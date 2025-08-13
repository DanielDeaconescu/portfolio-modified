import nodemailer from "nodemailer";
import axios from "axios";

async function parseFormData(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const parsedData = new URLSearchParams(body);
        resolve(Object.fromEntries(parsedData.entries()));
      } catch (err) {
        reject(new Error("Invalid form data"));
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
    const formData = await parseFormData(req);

    const {
      "full-name": fullName,
      "company-name": companyName,
      email,
      message,
      "cf-turnstile-response": turnstileToken,
    } = formData;

    if (!fullName || !companyName || !email || !message || !turnstileToken) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    // Verify Turnstile token (with timeout)
    const verification = await Promise.race([
      axios.post(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET,
          response: turnstileToken,
        }).toString(),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: 5000, // 5 second timeout
        }
      ),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("CAPTCHA verification timeout")),
          5000
        )
      ),
    ]);

    if (!verification.data.success) {
      return res.status(403).json({ message: "CAPTCHA verification failed!" });
    }

    // Configure transporter with timeout
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 5000, // 5 seconds
      socketTimeout: 5000, // 5 seconds
    });

    // Send email with timeout
    await Promise.race([
      transporter.sendMail({
        from: process.env.SMTP_USER,
        to: "daniel.deaconescu98@gmail.com",
        subject: "New form submission from your website",
        text: `Name: ${fullName}\nCompany: ${companyName}\nEmail: ${email}\nMessage: ${message}`,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Email sending timeout")), 5000)
      ),
    ]);

    // Successful response with redirect
    return res.redirect(302, "/submitted/contact_form_submitted.html");
  } catch (error) {
    console.error("Submission error:", error.message);

    if (error.message.includes("timeout")) {
      return res
        .status(504)
        .json({ message: "Server timeout. Please try again." });
    }

    return res.status(500).json({
      message:
        error.message || "An error occurred while processing your request.",
    });
  }
}
