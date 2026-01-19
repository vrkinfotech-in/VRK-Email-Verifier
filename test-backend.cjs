const dns = require("dns");
const net = require("net");

// Mock environment variables
process.env.GCLOUD_PROJECT = "test-project";

// Copied logic from functions/index.js for testing
const resolveMxRecords = (domain) => {
    return new Promise((resolve, reject) => {
        dns.resolveMx(domain, (err, addresses) => {
            if (err || !addresses || addresses.length === 0) {
                resolve([]);
            } else {
                resolve(addresses.sort((a, b) => a.priority - b.priority));
            }
        });
    });
};

const checkSmtpConnection = (mxHost, email) => {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let status = { valid: false, message: "Connection failed" };
        let step = 0;

        socket.setTimeout(5000); // 5s timeout

        console.log(`Checking ${email} via ${mxHost}...`);

        socket.on("connect", () => {
            console.log("Connected to " + mxHost);
        });

        socket.on("data", (data) => {
            const response = data.toString();
            // console.log("Received:", response.trim());
            const code = parseInt(response.substring(0, 3));

            if (step === 0 && code === 220) {
                socket.write(`HELO google.com\r\n`); // Using a common domain for HELO to avoid some blocks
                step++;
            }
            else if (step === 1 && (code === 250 || code === 200)) { // Some servers reply 200
                socket.write(`MAIL FROM:<test@google.com>\r\n`);
                step++;
            }
            else if (step === 2 && (code === 250 || code === 200)) {
                socket.write(`RCPT TO:<${email}>\r\n`);
                step++;
            }
            else if (step === 3) {
                if (code === 250 || code === 200 || code === 251) {
                    status = { valid: true, message: "SMTP OK" };
                } else {
                    status = { valid: false, message: `SMTP/${code}: ${response.trim()}` };
                }
                socket.write("QUIT\r\n");
                socket.end();
                resolve(status);
            }
            else {
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

async function test(email) {
    const domain = email.split("@")[1];
    console.log(`Resolving MX for ${domain}...`);

    const mxRecords = await resolveMxRecords(domain);
    if (mxRecords.length === 0) {
        console.log("No MX Records found.");
        return;
    }

    const topMx = mxRecords[0].exchange;
    console.log(`Top MX: ${topMx}`);

    const result = await checkSmtpConnection(topMx, email);
    console.log(`Result for ${email}:`, result);
}

// Test with a few emails
// Note: Some might fail due to local ISP blocking port 25 or blacklisting
(async () => {
    await test("test@gmail.com");
    console.log("---");
    await test("invalid-user-12345@gmail.com");
    console.log("---");
    // Ensure we send an email, not just domain, or fix logic
    // test function expects email.
})();
