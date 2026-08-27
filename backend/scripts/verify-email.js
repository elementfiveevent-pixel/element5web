const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const nodemailer = require("nodemailer");

async function run() {
  const required = ["BREVO_SMTP_HOST", "BREVO_SMTP_USER", "BREVO_SMTP_PASSWORD", "EMAIL_FROM"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing email environment variables: ${missing.join(", ")}`);

  const recipient = process.env.EMAIL_TEST_RECIPIENT || process.env.EMAIL_FROM;
  const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST,
    port: Number(process.env.BREVO_SMTP_PORT || 587),
    secure: false,
    requireTLS: true,
    auth: { user: process.env.BREVO_SMTP_USER, pass: process.env.BREVO_SMTP_PASSWORD },
  });

  await transporter.verify();
  const info = await transporter.sendMail({
    from: `Element 5 <${process.env.EMAIL_FROM}>`,
    to: recipient,
    subject: "Element 5 email delivery test",
    text: "Brevo SMTP is connected. This is a controlled Element 5 delivery test.",
  });
  console.log(`SMTP verified. Brevo accepted the test email: ${info.messageId}`);
}

run().catch((error) => {
  console.error(`SMTP test failed: ${error.message}`);
  process.exit(1);
});
