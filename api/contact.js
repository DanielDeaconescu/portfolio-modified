import nodemailer from "nodemailer";

// Configuration with aggressive timeouts
const mailConfig = {
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 3000, // 3 seconds
  socketTimeout: 3000,
  greetingTimeout: 3000,
  tls: {
    rejectUnauthorized: false, // For self-signed certs
    minVersion: "TLSv1.2", // Force modern TLS
  },
};

// Global transporter (reused between invocations)
let transporter;
let lastSuccessTime = 0;

export default async (req, res) => {
  try {
    // Validate request
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Parse form data with timeout
    const formData = await new Promise((resolve, reject) => {
      let body = [];
      const timeout = setTimeout(() => {
        req.destroy();
        reject(new Error("Form parse timeout"));
      }, 2000); // 2 seconds max for parsing

      req.on("data", (chunk) => body.push(chunk));
      req.on("end", () => {
        clearTimeout(timeout);
        resolve(Buffer.concat(body).toString());
      });
      req.on("error", reject);
    });

    // Process form data
    const params = new URLSearchParams(formData);
    const { "full-name": name, email, message } = Object.fromEntries(params);

    // Initialize or recreate transporter if stale
    if (!transporter || Date.now() - lastSuccessTime > 300000) {
      // 5 minutes
      transporter = nodemailer.createTransport(mailConfig);
      await transporter.verify(); // Test connection
    }

    // Send email with timeout
    await Promise.race([
      transporter.sendMail({
        from: `"Contact Form" <${process.env.SMTP_USER}>`,
        to: process.env.RECIPIENT_EMAIL,
        subject: "New Form Submission",
        text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("SMTP operation timeout")), 4000)
      ),
    ]);

    lastSuccessTime = Date.now();
    return res.redirect(302, "/submitted/contact_form_submitted.html");
  } catch (error) {
    console.error("Error:", error.message);

    // Force transporter recreation on next attempt
    transporter = null;

    return res.status(500).json({
      error: error.message.includes("timeout")
        ? "Server timeout"
        : "Internal server error",
    });
  }
};
