import nodemailer from "nodemailer";
import busboy from "busboy";

// SMTP Configuration with multiple fallback options
const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 5000, // 5 seconds
    socketTimeout: 5000,
    tls: {
      rejectUnauthorized: false,
      minVersion: "TLSv1.2",
    },
  });
};

export default async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Parse form data
    const formData = await new Promise((resolve, reject) => {
      const bb = busboy({ headers: req.headers });
      const result = {};

      bb.on("field", (name, value) => {
        result[name] = value;
      });

      bb.on("close", () => resolve(result));
      bb.on("error", reject);

      // 5 second timeout for form parsing
      const timeout = setTimeout(() => {
        bb.destroy(new Error("Form parse timeout"));
      }, 5000);

      req.on("close", () => {
        clearTimeout(timeout);
      });

      req.pipe(bb);
    });

    console.log("Received form data:", formData);

    // Try sending email with retries
    let lastError;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const transporter = getTransporter();

        await Promise.race([
          transporter.sendMail({
            from: `"Contact Form" <${process.env.SMTP_USER}>`,
            to: process.env.RECIPIENT_EMAIL,
            subject: "New Form Submission",
            text: `Name: ${formData["full-name"]}\nCompany: ${formData["company-name"]}\nEmail: ${formData.email}\nMessage: ${formData.message}`,
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("SMTP timeout")), 6000)
          ),
        ]);

        return res.redirect(302, "/submitted/contact_form_submitted.html");
      } catch (error) {
        lastError = error;
        console.error(`Attempt ${attempt + 1} failed:`, error.message);
        if (attempt < 1) await new Promise((r) => setTimeout(r, 1000));
      }
    }

    throw lastError || new Error("Email sending failed");
  } catch (error) {
    console.error("Final error:", error.message);
    return res.status(500).json({
      error: error.message.includes("timeout")
        ? "Email server timeout"
        : "Failed to send email",
    });
  }
};
