import nodemailer from "nodemailer";

export default async (req, res) => {
  try {
    // Parse the JSON
    const data = await new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error("Invalid JSON"));
        }
      });
      req.on("error", reject);
    });

    // Validate
    if (!data.name || !data["company-name"] || !data.email || !data.message) {
      res.status(400).json({ error: "All fields are required!" });
    }

    // Verify the Turnstile (https://challenges.cloudflare.com/turnstile/v0/siteverify)
    const turnstileResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: data["cf-turnstile-response"],
        }),
      }
    ).then((res) => res.json());

    if (!turnstileResponse.success) {
      return res.status(400).json({ error: "CAPTCHA verification failed" });
    }

    // Send email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMPT_PASS,
      },
      connectionTimeout: 5000,
    });

    await transporter.sendMail({
      from: `Contact Form <${process.env.SMTP_USER}>`,
      to: process.env.RECIPIENT_EMAIL,
      subject: `New Message from ${data.name}`,
      text: `Name: ${data.name}\n Company: ${data.company}\n Email: ${data.email}\n Message: ${data.message}`,
    });

    res
      .status(200)
      .json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    console.error("Server error: ", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};
