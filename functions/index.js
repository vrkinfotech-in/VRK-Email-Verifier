const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { auth, pubsub } = require("firebase-functions/v1");
const admin = require("firebase-admin");
const dns = require("dns");
const net = require("net");
const tls = require("tls");
const cors = require("cors")({ origin: true });
const Razorpay = require("razorpay");
const { v4: uuidv4 } = require("uuid");

admin.initializeApp();

// ----------------------------------------
// SAAS CONFIGURATION
// ----------------------------------------
const PLANS = {
    free: { credits: 100, price: 0, duration: Infinity },
    starter: { credits: 5000, price: 299, duration: 30 },
    growth: { credits: 25000, price: 999, duration: 30 },
    scale: { credits: 100000, price: 2999, duration: 30 }
};

const razorpay = new Razorpay({
    key_id: "rzp_test_YOUR_KEY_ID_HERE",
    key_secret: "YOUR_KEY_SECRET_HERE"
});

// ----------------------------------------
// HELPERS
// ----------------------------------------

// ----------------------------------------
// HELPERS
// ----------------------------------------

// ----------------------------------------
// USER MANAGEMENT (Triggers)
// ----------------------------------------
// 1. On User Signup -> Create Doc & API Key
exports.onUserCreated = auth.user().onCreate(async (user) => {
    const apiKey = `vg_live_${uuidv4().replace(/-/g, "")}`;
    const userData = {
        uid: user.uid,
        email: user.email,
        role: "user",
        plan: "free",
        credits_total: 100,
        credits_used: 0,
        credits_left: 100,
        api_key: apiKey,
        status: "active",
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        plan_expires_at: null
    };

    await admin.firestore().collection("users").doc(user.uid).set(userData);
    console.log(`User ${user.email} created with API Key: ${apiKey}`);
});

// ----------------------------------------
// PAYMENTS (Razorpay)
// ----------------------------------------
exports.createRazorpayOrder = onRequest({ cors: true }, async (req, res) => {
    cors(req, res, async () => {
        if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

        // Authenticate User (via ID Token)
        const idToken = req.headers.authorization?.split("Bearer ")[1];
        if (!idToken) return res.status(401).send("Unauthorized");

        try {
            const decoded = await admin.auth().verifyIdToken(idToken);

            // 1. HARD SUSPENSION & USER CHECK
            const userDoc = await admin.firestore().collection("users").doc(decoded.uid).get();
            if (!userDoc.exists) return res.status(404).send("User not found");
            const userData = userDoc.data();

            if (userData.status === "suspended") {
                return res.status(403).send("Account Suspended. Cannot purchase.");
            }

            const planName = req.body.plan;
            const plan = PLANS[planName];

            if (!plan || plan.price === 0) return res.status(400).send("Invalid Plan");

            // PROMO CODE LOGIC (Abuse Protection)
            let finalPrice = plan.price;
            const promoCode = req.body.promoCode;

            if (promoCode) {
                const promoDoc = await admin.firestore().collection("promo_codes").doc(promoCode).get();
                if (promoDoc.exists && promoDoc.data().active) {
                    const promo = promoDoc.data();

                    // Expiry Check
                    if (promo.expires_at && promo.expires_at.toMillis() < Date.now()) {
                        return res.status(400).send("Promo Code Expired");
                    }

                    // Max Uses Check
                    if (promo.max_uses && promo.used_count >= promo.max_uses) {
                        return res.status(400).send("Promo Code usage limit reached");
                    }

                    if (promo.plans.includes(planName) || promo.plans.includes("all")) {
                        if (promo.type === "percentage") {
                            finalPrice = finalPrice - (finalPrice * (promo.value / 100));
                        } else if (promo.type === "flat") {
                            finalPrice = finalPrice - promo.value;
                        }
                        finalPrice = Math.max(0, finalPrice);
                    }
                } else {
                    if (promoCode) return res.status(400).send("Invalid Promo Code");
                }
            }

            const options = {
                amount: Math.round(finalPrice * 100),
                currency: "INR",
                receipt: `receipt_${decoded.uid}_${Date.now()}`,
                notes: { uid: decoded.uid, plan: planName, promo: promoCode || "none" }
            };

            const order = await razorpay.orders.create(options);
            return res.json(order);

        } catch (error) {
            console.error("Payment Order Error:", error);
            return res.status(500).send({ error: error.message });
        }
    });
});

exports.handleRazorpayWebhook = onRequest(async (req, res) => {
    const event = req.body;

    if (event.event === "payment.captured") {
        const paymentId = event.payload.payment.entity.id;
        const { notes } = event.payload.payment.entity;
        const { uid, plan: planName, promo } = notes;

        // IDEMPOTENCY CHECK
        const processedDoc = await admin.firestore().collection("processed_payments").doc(paymentId).get();
        if (processedDoc.exists) {
            console.log(`Payment ${paymentId} already processed.`);
            return res.json({ status: "ok" });
        }

        if (uid && planName && PLANS[planName]) {
            const plan = PLANS[planName];

            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);

            const batch = admin.firestore().batch();
            const userRef = admin.firestore().collection("users").doc(uid);

            // Activate Plan
            batch.update(userRef, {
                plan: planName,
                credits_total: admin.firestore.FieldValue.increment(plan.credits),
                credits_left: admin.firestore.FieldValue.increment(plan.credits),
                plan_expires_at: admin.firestore.Timestamp.fromDate(expiryDate)
            });

            // Mark Payment Processed
            batch.set(admin.firestore().collection("processed_payments").doc(paymentId), {
                uid, plan: planName, timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            // Promo Usage Increment
            if (promo && promo !== "none") {
                batch.update(admin.firestore().collection("promo_codes").doc(promo), {
                    used_count: admin.firestore.FieldValue.increment(1)
                });
            }

            await batch.commit();

            // Infra Log
            admin.firestore().collection("infra_stats").doc("payments").set({
                success_count: admin.firestore.FieldValue.increment(1)
            }, { merge: true }).catch(console.error);

            console.log(`Plan ${planName} activated for ${uid}`);
        } else {
            admin.firestore().collection("infra_stats").doc("payments").set({
                failure_count: admin.firestore.FieldValue.increment(1)
            }, { merge: true }).catch(console.error);
        }
    }
    res.json({ status: "ok" });
});

// ----------------------------------------
// CRON JOBS (Scheduled)
// ----------------------------------------
exports.checkPlanExpiry = pubsub.schedule('every 24 hours').onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();

    const expiredUsers = await admin.firestore().collection("users")
        .where("plan_expires_at", "<", now)
        .where("plan", "!=", "free")
        .get();

    const batch = admin.firestore().batch();

    expiredUsers.forEach(doc => {
        batch.update(doc.ref, {
            plan: "free",
            credits_left: 100, // Reset to free limit
            plan_expires_at: null
        });
    });

    await batch.commit();
    console.log(`Downgraded ${expiredUsers.size} users.`);
    return null;
});

// ----------------------------------------
// ADMIN API
// ----------------------------------------
const validateAdmin = async (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new Error("Missing Authorization Header");
    const token = authHeader.split("Bearer ")[1];
    const decoded = await admin.auth().verifyIdToken(token);
    const userDoc = await admin.firestore().collection("users").doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data().role !== "admin") throw new Error("Access Denied: Admin Only");
    return decoded;
};

exports.adminAPI = onRequest({ cors: true }, async (req, res) => {
    cors(req, res, async () => {
        try {
            await validateAdmin(req);
            const { action, payload } = req.body;

            // 1. GET USERS
            if (action === "get_users") {
                const snapshot = await admin.firestore().collection("users").orderBy("created_at", "desc").limit(50).get();
                const users = snapshot.docs.map(d => d.data());
                return res.json({ users });
            }

            // 2. MANAGE USER (Suspend/Activate/Key)
            if (action === "manage_user") {
                const { uid, type } = payload;
                if (type === "suspend") await admin.firestore().collection("users").doc(uid).update({ status: "suspended" });
                if (type === "activate") await admin.firestore().collection("users").doc(uid).update({ status: "active" });
                if (type === "regen_key") {
                    const newKey = `vg_live_${uuidv4().replace(/-/g, "")}`;
                    await admin.firestore().collection("users").doc(uid).update({ api_key: newKey });
                    return res.json({ success: true, newKey });
                }
                return res.json({ success: true });
            }

            // 3. MODIFY CREDITS
            if (action === "modify_credits") {
                const { uid, amount } = payload; // amount can be negative
                await admin.firestore().collection("users").doc(uid).update({
                    credits_left: admin.firestore.FieldValue.increment(parseInt(amount))
                });
                return res.json({ success: true });
            }

            // 4. GET STATS
            if (action === "get_stats") {
                const userCount = (await admin.firestore().collection("users").count().get()).data().count;
                // Simple aggregate revenue calculation (In prod, use a real aggregation or Stripe/Razorpay API)
                // Here we just count users on paid plans as an estimate or fetch from usage stats if we stored payments properly.
                // For now, returning basic counts.
                const logs = await admin.firestore().collection("usage_logs").orderBy("timestamp", "desc").limit(100).get();
                // Health Check flags
                const health = {
                    smtp: "operational",
                    api: "operational",
                    webhooks: "listening"
                };
                return res.json({
                    stats: {
                        total_users: userCount,
                        recent_logs: logs.docs.map(d => d.data()),
                        infra: {
                            smtp: (await admin.firestore().collection("infra_stats").doc("smtp").get()).data() || {},
                            payments: (await admin.firestore().collection("infra_stats").doc("payments").get()).data() || {},
                            api: (await admin.firestore().collection("infra_stats").doc("api").get()).data() || {}
                        }
                    },
                    health
                });
            }

            // 5. MANAGE PROMOS
            if (action === "create_promo") {
                const { code, type, value, plans } = payload;
                await admin.firestore().collection("promo_codes").doc(code).set({
                    code, type, value, plans, active: true, created_at: admin.firestore.FieldValue.serverTimestamp()
                });
                return res.json({ success: true });
            }

            if (action === "get_promos") {
                const snapshot = await admin.firestore().collection("promo_codes").get();
                return res.json({ promos: snapshot.docs.map(d => d.data()) });
            }

            return res.status(400).json({ error: "Invalid Action" });

        } catch (e) {
            return res.status(401).json({ error: e.message });
        }
    });
});

// ----------------------------------------
// MIDDLEWARE: Validate Credits & Key
// ----------------------------------------
const validateRequest = async (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new Error("Missing Authorization Header");

    const token = authHeader.split("Bearer ")[1];
    let userDoc = null;
    let uid = null;

    // 1. Check if it looks like an API Key
    if (token.startsWith("vg_live_")) {
        const snapshot = await admin.firestore().collection("users").where("api_key", "==", token).limit(1).get();
        if (snapshot.empty) throw new Error("Invalid API Key");
        userDoc = snapshot.docs[0];
        uid = userDoc.id;
    }
    // 2. Check if it's a Firebase ID Token
    else {
        try {
            const decoded = await admin.auth().verifyIdToken(token);
            uid = decoded.uid;
            userDoc = await admin.firestore().collection("users").doc(uid).get();
            // Auto-create doc if missing (legacy users)
            if (!userDoc.exists) throw new Error("User profile not found. Please log in again.");
        } catch (e) {
            throw new Error("Invalid Token or API Key");
        }
    }

    const userData = userDoc.data();

    if (userData.status === "suspended") throw new Error("Account Suspended"); // Hard Block
    if (userData.status !== "active") throw new Error("Account is inactive");
    if (userData.credits_left <= 0) throw new Error("Insufficient Credits");

    return { uid, userData };
};

const resolveMxRecords = (domain) => {
    return new Promise((resolve) => {
        dns.resolveMx(domain, (err, addresses) => {
            if (err || !addresses || addresses.length === 0) {
                resolve([]);
            } else {
                resolve(addresses.sort((a, b) => a.priority - b.priority));
            }
        });
    });
};

const resolveTxtRecords = (domain) => {
    return new Promise((resolve) => {
        dns.resolveTxt(domain, (err, records) => {
            if (err || !records) {
                resolve([]);
            } else {
                // Flatten array of arrays
                resolve(records.map(r => r.join('')));
            }
        });
    });
};

const checkSPF = async (domain) => {
    try {
        const records = await resolveTxtRecords(domain);
        const spfRecord = records.find(r => r.toLowerCase().startsWith('v=spf1'));
        return spfRecord ? 'pass' : 'fail';
    } catch { return 'fail'; }
};

const checkDMARC = async (domain) => {
    try {
        const records = await resolveTxtRecords(`_dmarc.${domain}`);
        const dmarcRecord = records.find(r => r.toLowerCase().includes('v=dmarc1'));
        return dmarcRecord ? 'pass' : 'fail';
    } catch { return 'fail'; }
};

const checkSmtpConnection = async (mxHost, email, timeout = 10000) => {
    // Port priority: 587 -> 465 -> 2525 -> 25
    const ports = [587, 465, 2525, 25];

    for (const port of ports) {
        try {
            const result = await new Promise((resolve) => {
                let socket;
                let status = { valid: false, code: 0, message: "Connection failed" };
                let step = 0; // 0: Connect, 1: HELO, 2: MAIL FROM, 3: RCPT TO
                let receivedData = "";

                const onData = (data) => {
                    receivedData += data.toString();
                    if (!receivedData.endsWith("\n")) return;

                    const response = receivedData;
                    receivedData = "";

                    const code = parseInt(response.substring(0, 3));
                    if (isNaN(code)) return;

                    if (step === 0 && (code === 220)) {
                        const heloCmd = `EHLO ${process.env.GCLOUD_PROJECT ? `${process.env.GCLOUD_PROJECT}.web.app` : "verify-app.web.app"}\r\n`;
                        socket.write(heloCmd);
                        step++;
                    }
                    else if (step === 1 && (code === 250)) {
                        const mailFrom = `MAIL FROM:<verify@${process.env.GCLOUD_PROJECT ? `${process.env.GCLOUD_PROJECT}.web.app` : "verify-app.web.app"}>\r\n`;
                        socket.write(mailFrom);
                        step++;
                    }
                    else if (step === 2 && (code === 250)) {
                        const rcptTo = `RCPT TO:<${email}>\r\n`;
                        socket.write(rcptTo);
                        step++;
                    }
                    else if (step === 3) {
                        // Response to RCPT TO
                        if (code === 250 || code === 251) {
                            status = { valid: true, code: code, message: "pass" };
                        } else if (code === 550) {
                            status = { valid: false, code: code, message: "fail" };
                        } else if ([421, 450, 451, 452].includes(code)) {
                            status = { valid: 'soft', code: code, message: "soft" };
                        } else {
                            status = { valid: 'unknown', code: code, message: "unknown" };
                        }

                        socket.write("QUIT\r\n");
                        socket.end();
                        resolve(status);
                    }
                };

                const onError = (err) => {
                    status = { valid: 'unknown', code: 0, message: "unknown" };
                    if (socket && !socket.destroyed) socket.destroy();
                    resolve(status);
                };

                const onTimeout = () => {
                    status = { valid: 'unknown', code: 0, message: "unknown" };
                    if (socket && !socket.destroyed) socket.destroy();
                    resolve(status);
                };

                if (port === 465) {
                    socket = tls.connect(port, mxHost, { rejectUnauthorized: false });
                } else {
                    socket = new net.Socket();
                    socket.connect(port, mxHost);
                }

                socket.setTimeout(timeout);
                socket.on("data", onData);
                socket.on("error", onError);
                socket.on("timeout", onTimeout);
            });

            // If we got a definitive valid/invalid, return it
            if (result.valid === true || result.valid === false) return result;
            // If soft/unknown, keep trying other ports unless it's the last one

        } catch (e) {
            console.error(e);
        }
    }
    return { valid: 'unknown', code: 0, message: "unknown" };
};

// ----------------------------------------
// DATA LISTS
// ----------------------------------------
const DISPOSABLE_DOMAINS = new Set([
    "yopmail.com", "guerrillamail.com", "mailinator.com", "10minutemail.com",
    "temp.email", "temp-mail.org", "fake-email.com", "throwawaymail.com",
    "sharklasers.com", "getairmail.com", "maildrop.cc", "dispostable.com"
]);

const ROLE_BASED_PREFIXES = new Set([
    "admin", "info", "support", "sales", "contact", "help", "billing", "noreply",
    "marketing", "office", "hr", "enquiries", "webmaster", "postmaster",
    "hostmaster", "no-reply"
]);

const checkDisposable = (domain) => DISPOSABLE_DOMAINS.has(domain.toLowerCase());
const checkRoleBased = (email) => ROLE_BASED_PREFIXES.has(email.split("@")[0].toLowerCase());

// ----------------------------------------
// MAIN FUNCTION
// ----------------------------------------
exports.verifyEmail = onRequest({ cors: true, maxInstances: 10 }, async (req, res) => {
    cors(req, res, async () => {
        if (req.method !== "POST") return res.status(405).send({ error: "Method Not Allowed" });

        // AUTHORIZATION & CREDIT CHECK
        let userUid = null;
        try {
            const { uid } = await validateRequest(req);
            userUid = uid;

            // Deduct Credit
            await admin.firestore().collection("users").doc(uid).update({
                credits_used: admin.firestore.FieldValue.increment(1),
                credits_left: admin.firestore.FieldValue.increment(-1)
            });

            // Log Usage
            admin.firestore().collection("usage_logs").add({
                uid: uid,
                email_verified: req.body.email || "unknown",
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                result: "processed"
            }).catch(console.error);

            // INFRA STATS
            admin.firestore().collection("infra_stats").doc("api").set({
                total_requests: admin.firestore.FieldValue.increment(1)
            }, { merge: true }).catch(console.error);

        } catch (authError) {
            return res.status(401).json({ error: authError.message });
        }

        let { email } = req.body;

        // STEP 1: EMAIL NORMALIZATION
        if (!email || typeof email !== "string") {
            return res.json({ Email: email || "", Syntax: "fail", Status: "invalid", Score: 0 });
        }
        email = email.trim().toLowerCase();
        if (!email) {
            return res.json({ Email: "", Syntax: "fail", Status: "invalid", Score: 0 });
        }

        // Initialize Result Object
        let finalResult = {
            "Email": email,
            "Syntax": "fail",
            "DNS": "fail",
            "SMTP": "fail",
            "Role": "no",
            "SPF": "fail",
            "DMARC": "fail",
            "Disp": "no",
            "Status": "invalid",
            "Score": 0
        };

        // STEP 2: SYNTAX CHECK
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            finalResult.Syntax = "fail";
            finalResult.Status = "invalid";
            finalResult.Score = 0;
            return res.json(finalResult);
        }
        finalResult.Syntax = "pass";

        const domain = email.split("@")[1];

        // STEP 6 & 7 (Pre-computation)
        finalResult.Role = checkRoleBased(email) ? "yes" : "no";
        finalResult.Disp = checkDisposable(domain) ? "yes" : "no";

        try {
            // STEP 3: DNS + MX RECORD CHECK
            const mxRecords = await resolveMxRecords(domain);
            if (!mxRecords || mxRecords.length === 0) {
                finalResult.DNS = "fail";
                finalResult.Status = "invalid";
                finalResult.Score = 10;
                admin.firestore().collection("infra_stats").doc("smtp").set({
                    dns_failures: admin.firestore.FieldValue.increment(1)
                }, { merge: true }).catch(() => { });
                return res.json(finalResult);
            }
            finalResult.DNS = "pass";

            // STEP 8 & 9: SPF & DMARC
            const [spf, dmarc] = await Promise.all([
                checkSPF(domain),
                checkDMARC(domain)
            ]);
            finalResult.SPF = spf;
            finalResult.DMARC = dmarc;

            // STEP 4: SMTP MAILBOX VERIFICATION
            const topMx = mxRecords[0].exchange;
            const smtpCheck = await checkSmtpConnection(topMx, email, 5000); // 5s initial timeout

            // Map SMTP result
            if (smtpCheck.valid === true) finalResult.SMTP = "pass";
            else if (smtpCheck.valid === false) finalResult.SMTP = "fail";
            else if (smtpCheck.valid === 'soft') finalResult.SMTP = "soft";
            else finalResult.SMTP = "unknown";

            // STEP 5: CATCH-ALL DETECTION
            let isCatchAll = false;
            if (finalResult.SMTP === "pass") {
                const randomEmail = `x9a8s7d6_${Date.now()}@${domain}`;
                const catchAllCheck = await checkSmtpConnection(topMx, randomEmail, 5000);

                if (catchAllCheck.valid === true) {
                    isCatchAll = true;
                }
            }

            // STEP 10: FINAL STATUS DECISION
            if (finalResult.Syntax === "fail") finalResult.Status = "invalid";
            else if (finalResult.DNS === "fail") finalResult.Status = "invalid";
            else if (finalResult.SMTP === "fail") finalResult.Status = "invalid";
            else if (isCatchAll) finalResult.Status = "catch_all";
            else if (finalResult.Disp === "yes") finalResult.Status = "risky";
            else if (finalResult.SMTP === "soft" || finalResult.SMTP === "unknown") finalResult.Status = "unknown";
            else if (finalResult.SMTP === "pass") finalResult.Status = "valid";
            else finalResult.Status = "unknown"; // Fallback

            // STEP 11: SCORE CALCULATION
            let score = 0;
            if (finalResult.Syntax === "pass") score += 10;
            if (finalResult.DNS === "pass") score += 15;
            if (finalResult.SMTP === "pass") score += 40;
            if (!isCatchAll) score += 10;
            if (finalResult.Disp === "no") score += 10;
            if (finalResult.Role === "no") score += 5;
            if (finalResult.SPF === "pass") score += 5;
            if (finalResult.DMARC === "pass") score += 5;

            // Penalties
            if (isCatchAll) score -= 20;
            if (finalResult.Disp === "yes") score -= 40;
            // Greylist not explicitly detected separate from soft, assume contained in soft/unknown?
            // "If SMTP = unknown" penalty
            if (finalResult.SMTP === "unknown") score -= 20;

            finalResult.Score = Math.max(0, Math.min(100, score));

            return res.json(finalResult);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: error.message });
        }
    });
});
