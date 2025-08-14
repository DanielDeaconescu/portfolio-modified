import nodemailer from "nodemailer";

// Reusable transporter (Vercel keeps warm instances)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 4000, // 4 seconds
  socketTimeout: 4000,
});

export default async (req, res) => {
  // Set timeout headers
  res.setHeader("Cache-Control", "no-store");

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Parse form data with 5s timeout
    const formData = await new Promise((resolve, reject) => {
      let body = [];
      const timeout = setTimeout(() => {
        req.destroy();
        reject(new Error("Form parse timeout"));
      }, 5000);

      req.on("data", (chunk) => body.push(chunk));
      req.on("end", () => {
        clearTimeout(timeout);
        resolve(Buffer.concat(body));
      });
      req.on("error", reject);
    });

    // Convert to object (assuming URL-encoded form)
    const params = new URLSearchParams(formData.toString());
    const {
      "full-name": fullName,
      "company-name": company,
      email,
      message,
    } = Object.fromEntries(params);

    // Send email with 4s timeout
    await Promise.race([
      transporter.sendMail({
        from: `"Contact Form" <${process.env.SMTP_USER}>`,
        to: process.env.RECIPIENT_EMAIL,
        subject: "New Form Submission",
        text: `Name: ${fullName}\nCompany: ${company}\nEmail: ${email}\nMessage: ${message}`,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("SMTP timeout")), 4000)
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
