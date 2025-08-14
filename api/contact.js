import nodemailer from "nodemailer";

// Configure transporter outside handler (reused between invocations)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 5000, // 5 seconds
  socketTimeout: 5000,
});

export default async (req, res) => {
  // Immediately set timeout headers
  res.setHeader("Cache-Control", "no-store");

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Parse form data with timeout
    const [formData] = await Promise.race([
      new Promise((resolve) => {
        let body = [];
        req.on("data", (chunk) => body.push(chunk));
        req.on("end", () => resolve([Buffer.concat(body)]));
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 6000)
      ),
    ]);

    // Send email with timeout
    await Promise.race([
      transporter.sendMail({
        from: `"Contact Form" <${process.env.SMTP_USER}>`,
        to: process.env.RECIPIENT_EMAIL,
        subject: "New Form Submission",
        text: "Test message", // Simplified for testing
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("SMTP timeout")), 5000)
      ),
    ]);

    return res.redirect(302, "/submitted/contact_form_submitted.html");
  } catch (error) {
    console.error("Server error:", error.message);
    return res.status(500).json({
      error: error.message.includes("timeout")
        ? "Processing timeout"
        : "Internal server error",
    });
  }
};
