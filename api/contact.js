import nodemailer from "nodemailer";
import busboy from "busboy";

const mailConfig = {
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 3000,
  socketTimeout: 3000,
  greetingTimeout: 3000,
  tls: {
    rejectUnauthorized: false,
    minVersion: "TLSv1.2",
  },
};

let transporter;

export default async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Parse multipart form data
    const formData = await new Promise((resolve, reject) => {
      const bb = busboy({ headers: req.headers });
      const result = {};
      let timeout;

      bb.on("field", (name, val) => {
        result[name] = val;
        clearTimeout(timeout);
        timeout = setTimeout(() => bb.end(), 100);
      });

      bb.on("close", () => {
        clearTimeout(timeout);
        resolve(result);
      });

      bb.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      timeout = setTimeout(() => {
        bb.destroy(new Error("Form parse timeout"));
      }, 2000);

      req.pipe(bb);
    });

    // Extract fields
    const {
      "full-name": name,
      "company-name": company,
      email,
      message,
    } = formData;

    console.log("Received form data:", { name, company, email, message });

    // Initialize transporter
    if (!transporter) {
      transporter = nodemailer.createTransport(mailConfig);
      await transporter.verify();
    }

    // Send email
    await transporter.sendMail({
      from: `"Contact Form" <${process.env.SMTP_USER}>`,
      to: process.env.RECIPIENT_EMAIL,
      subject: "New Form Submission",
      text: `Name: ${name}\nCompany: ${company}\nEmail: ${email}\nMessage: ${message}`,
    });

    return res.redirect(302, "/submitted/contact_form_submitted.html");
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      error: error.message.includes("timeout")
        ? "Server timeout"
        : "Internal server error",
    });
  }
};
