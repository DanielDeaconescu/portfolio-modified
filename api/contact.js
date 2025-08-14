import nodemailer from "nodemailer";
import busboy from "busboy";

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
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Parse multipart form data
    const formData = await new Promise((resolve, reject) => {
      const bb = busboy({ headers: req.headers });
      const result = {};

      bb.on("field", (name, value) => {
        result[name] = value;
      });

      bb.on("close", () => {
        resolve(result);
      });

      bb.on("error", (err) => {
        reject(err);
      });

      req.pipe(bb);
    });

    console.log("Received form data:", formData); // Debug log

    // Initialize transporter if needed
    if (!transporter) {
      transporter = nodemailer.createTransport(mailConfig);
      await transporter.verify();
    }

    // Send email
    await transporter.sendMail({
      from: `"Contact Form" <${process.env.SMTP_USER}>`,
      to: process.env.RECIPIENT_EMAIL,
      subject: "New Form Submission",
      text: `Name: ${formData["full-name"]}
Company: ${formData["company-name"]}
Email: ${formData.email}
Message: ${formData.message}`,
    });

    return res.redirect(302, "/submitted/contact_form_submitted.html");
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
