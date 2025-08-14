import nodemailer from "nodemailer";

export default async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  try {
    // Parse as multipart form-data
    const formData = await new Promise((resolve) => {
      let buffer = [];
      req.on("data", (chunk) => buffer.push(chunk));
      req.on("end", () => {
        resolve(Buffer.concat(buffer));
      });
    });

    // Simple email sending (remove Turnstile temporarily)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: { rejectUnauthorized: false },
    });

    await transporter.sendMail({
      from: `"Contact Form" <${process.env.SMTP_USER}>`,
      to: process.env.RECIPIENT_EMAIL,
      subject: "New Form Submission",
      text: "Test message", // Simplified for testing
    });

    return res.redirect(302, "/submitted/contact_form_submitted.html");
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).send(error.message);
  }
};
