import nodemailer from "nodemailer";
import axios from "axios";

async function parseJSONBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error("Invalid JSON format"));
      }
    });

    req.on("error", (err) => {
      reject(err);
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Parse JSON data from request body
    const formData = await parseJSONBody(req);

    const {
      "full-name": fullName,
      "company-name": companyName,
      email,
      message,
      "cf-turnstile-response": turnstileToken,
    } = formData;

    // Validate required fields
    if (!fullName || !companyName || !email || !message || !turnstileToken) {
      return res
        .status(400)
        .json({ message: "Toate câmpurile sunt obligatorii!" });
    }

    // Verify Turnstile token with Cloudflare
    const verification = await axios.post(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET,
        response: turnstileToken,
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    if (!verification.data.success) {
      return res.status(403).json({ message: "Verificarea CAPTCHA a eșuat!" });
    }

    // Create transporter for nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: "daniel.deaconescu98@gmail.com",
      subject: "Someone filled out the form on danieldeaconescu.com",
      text: `Full Name: ${fullName}\nCompany: ${companyName}\nEmail: ${email}\nMessage: ${message}`,
    };

    // Send email with timeout
    await Promise.race([
      transporter.sendMail(mailOptions),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("SMTP timeout")), 10000)
      ),
    ]);

    // Return success redirect
    return res.redirect(302, "/submitted/contact_form_submitted.html");
  } catch (error) {
    console.error("Eroare la transmiterea mesajului:", error);

    if (error.message === "SMTP timeout") {
      return res
        .status(504)
        .json({ message: "Server timeout. Please try again." });
    }

    return res.status(500).json({
      message: error.message || "Eroare la transmiterea mesajului.",
    });
  }
}
