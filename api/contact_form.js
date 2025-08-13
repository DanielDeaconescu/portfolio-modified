import nodemailer from "nodemailer";
import axios from "axios";

// Email transporter with failover options
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000, // 10 seconds
    socketTimeout: 10000,
  });
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Parse form data
    let body = "";
    await new Promise((resolve) => {
      req.on("data", (chunk) => (body += chunk.toString()));
      req.on("end", resolve);
    });

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

    // Verify CAPTCHA (with timeout)
    const captchaVerify = await Promise.race([
      axios.post(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET,
          response: data["cf-turnstile-response"],
        }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: 5000,
        }
      ),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("CAPTCHA timeout")), 5000)
      ),
    ]);

    if (!captchaVerify.data?.success) {
      return res.status(403).json({ message: "CAPTCHA verification failed" });
    }

    // Send email (with timeout)
    await Promise.race([
      createTransporter().sendMail({
        from: `"Website Form" <${process.env.SMTP_USER}>`,
        to: process.env.RECIPIENT_EMAIL || "daniel.deaconescu98@gmail.com",
        subject: "New contact form submission",
        text: `Name: ${data["full-name"]}\nCompany: ${data["company-name"]}\nEmail: ${data.email}\nMessage: ${data.message}`,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("SMTP timeout")), 10000)
      ),
    ]);

    return res.redirect(302, "/submitted/contact_form_submitted.html");
  } catch (error) {
    console.error("Server error:", error.message);
    return res.status(error.message.includes("timeout") ? 504 : 500).json({
      message: error.message.includes("timeout")
        ? "Server timeout. Please try again later."
        : "An error occurred while processing your request.",
    });
  }
}
