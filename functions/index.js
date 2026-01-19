const { onRequest } = require("firebase-functions/v2/https");
const dns = require("dns");
const net = require("net");
const cors = require("cors")({ origin: true });

// Helper to resolve MX records
const resolveMxRecords = (domain) => {
    return new Promise((resolve, reject) => {
        dns.resolveMx(domain, (err, addresses) => {
            if (err || !addresses || addresses.length === 0) {
                resolve([]);
            } else {
                // Sort by priority
                resolve(addresses.sort((a, b) => a.priority - b.priority));
            }
        });
    });
};

// Helper to check SMTP
const checkSmtpConnection = (mxHost, email) => {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let status = { valid: false, message: "Connection failed" };
        let step = 0; // 0: Connect, 1: HELO, 2: MAIL FROM, 3: RCPT TO

        // Set timeout (e.g., 5 seconds) to avoid long waits
        socket.setTimeout(5000);

        socket.on("connect", () => {
            // connected, wait for greeting
        });

        socket.on("data", (data) => {
            const response = data.toString();
            const code = parseInt(response.substring(0, 3));

            // 220 Service ready
            if (step === 0 && code === 220) {
                socket.write(`HELO ${process.env.GCLOUD_PROJECT || "verify-app"}.web.app\r\n`);
                step++;
            }
            // 250 Requested mail action okay, completed
            else if (step === 1 && code === 250) {
                socket.write(`MAIL FROM:<check@${process.env.GCLOUD_PROJECT || "verify-app"}.web.app>\r\n`);
                step++;
            }
            else if (step === 2 && code === 250) {
                socket.write(`RCPT TO:<${email}>\r\n`);
                step++;
            }
            else if (step === 3) {
                if (code === 250) {
                    status = { valid: true, message: "SMTP/250 OK" };
                } else {
                    status = { valid: false, message: `SMTP/${code}: ${response.trim()}` };
                }
                socket.write("QUIT\r\n");
                socket.end();
                resolve(status);
            }
            else {
                // Unexpected or error code
                if (step > 0 && code >= 400) {
                    status = { valid: false, message: `SMTP Error ${code}` };
                    socket.end();
                    resolve(status);
                }
            }
        });

        socket.on("timeout", () => {
            status = { valid: false, message: "Connection timed out" };
            socket.destroy();
            resolve(status);
        });

        socket.on("error", (err) => {
            status = { valid: false, message: `Socket Error: ${err.message}` };
            socket.destroy();
            resolve(status);
        });

        socket.connect(25, mxHost);
    });
};

exports.verifyEmail = onRequest({ cors: true, maxInstances: 10 }, async (req, res) => {
    // Enable CORS
    cors(req, res, async () => {
        if (req.method !== "POST") {
            return res.status(405).send({ error: "Method Not Allowed" });
        }

        const { email } = req.body;

        if (!email || typeof email !== "string") {
            return res.status(400).send({ error: "Invalid email" });
        }

        // 1. Syntax Check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.json({
                email,
                valid: false,
                reason: "Invalid Syntax",
                mx: null,
                smtp: null
            });
        }

        const domain = email.split("@")[1];

        try {
            // 2. MX Record Check
            const mxRecords = await resolveMxRecords(domain);

            if (mxRecords.length === 0) {
                return res.json({
                    email,
                    valid: false,
                    reason: "No MX Records",
                    mx: null,
                    smtp: null
                });
            }

            const topMx = mxRecords[0].exchange;

            // 3. SMTP Check (Handshake)
            // Note: This is simplified. Real-world SMTP checks need rotation, delays, etc.
            // Also: Only perform if requested or for specific providers where it's reliable.
            // Doing this for EVERY email might trigger blocking on Cloud IPs.
            // But per requirements, we do it.

            const smtpStatus = await checkSmtpConnection(topMx, email);

            return res.json({
                email,
                valid: smtpStatus.valid,
                reason: smtpStatus.message,
                mx: topMx,
                smtp: smtpStatus.message
            });

        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    });
});
