import nodemailer from "nodemailer";
import axios from "axios";

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: true, // Force SSL for port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // For self-signed certificates
    },
    connectionTimeout: 10000,
  });
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .setHeader("Allow", ["POST"])
      .status(405)
      .json({ message: "Method not allowed" });
  }

  try {
    // Parse form data
    let body = "";
    for await (const chunk of req) {
      body += chunk.toString();
    }
    const formData = new URLSearchParams(body);
    const data = Object.fromEntries(formData.entries());

    // Validate fields
    const requiredFields = [
      "full-name",
      "company-name",
      "email",
      "message",
      "cf-turnstile-response",
    ];
    if (requiredFields.some((field) => !data[field]?.trim())) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Verify CAPTCHA
    const captchaResponse = await axios.post(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET,
        response: data["cf-turnstile-response"],
        remoteip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 5000,
      }
    );

    if (!captchaResponse.data?.success) {
      console.error("CAPTCHA failed:", captchaResponse.data);
      return res.status(403).json({ message: "CAPTCHA verification failed" });
    }

    // Send email
    await createTransporter().sendMail({
      from: `"Website Form" <${process.env.SMTP_USER}>`,
      to: process.env.RECIPIENT_EMAIL,
      subject: "New contact form submission",
      text: `Name: ${data["full-name"]}\nCompany: ${data["company-name"]}\nEmail: ${data.email}\nMessage: ${data.message}`,
    });

    return res.redirect(302, "/submitted/contact_form_submitted.html");
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(error.response?.status || 500).json({
      message: error.message.includes("timeout")
        ? "Request timeout"
        : "An error occurred",
    });
  }
}
