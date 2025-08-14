import nodemailer from "nodemailer";
import busboy from "busboy";

const getTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 5000,
    socketTimeout: 5000,
    tls: { rejectUnauthorized: false },
  });

export default async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.setHeader("Content-Type", "application/json");
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Parse form data
    const formData = await new Promise((resolve, reject) => {
      const bb = busboy({ headers: req.headers });
      const result = {};

      bb.on("field", (name, value) => (result[name] = value));
      bb.on("close", () => resolve(result));
      bb.on("error", reject);

      const timeout = setTimeout(() => {
        req.destroy();
        reject(new Error("Form parse timeout"));
      }, 5000);

      req.on("close", () => clearTimeout(timeout));
      req.pipe(bb);
    });

    // Send email
    await getTransporter().sendMail({
      from: `"Contact Form" <${process.env.SMTP_USER}>`,
      to: process.env.RECIPIENT_EMAIL,
      subject: "New Form Submission",
      text: `Name: ${formData["full-name"]}\nCompany: ${formData["company-name"]}\nEmail: ${formData.email}\nMessage: ${formData.message}`,
    });

    return res.redirect(302, "/submitted/contact_form_submitted.html");
  } catch (error) {
    console.error("Error:", error.message);
    res.setHeader("Content-Type", "application/json");
    return res.status(500).json({
      error: error.message.includes("timeout")
        ? "Email server timeout"
        : "Failed to send email",
    });
  }
};
