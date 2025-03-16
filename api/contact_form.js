import nodemailer from "nodemailer";
import axios from "axios";
import { IncomingMessage } from "http";
function parseFormData(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const parsedData = new URLSearchParams(body);
      resolve(Object.fromEntries(parsedData.entries())); // Convert to object
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
    // Parse form data manually (since Vercel doesn't parse it automatically)
    const parsedData = await parseFormData(req);

    const {
      "full-name": fullName,
      "company-name": companyName,
      email,
      message,
      "cf-turnstile-response": turnstileToken,
    } = parsedData;

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
      to: "daniel.deaconescu98@gmail.com", // Change this to your email
      subject: "Someone filled out the form on danieldeaconescu.com",
      text: `Full Name: ${fullName}\nCompany: ${companyName}\nEmail: ${email}\nMessage: ${message}`,
    };

    await transporter.sendMail(mailOptions);

    // Return success message to the client
    return res.redirect(302, "/submitted/contact_form_submitted.html");
  } catch (error) {
    console.error("Eroare la transmiterea mesajului: ", error);
    return res
      .status(500)
      .json({ message: "Eroare la transmiterea mesajului." });
  }
}
