const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_USER) return null; // dev mode — no email sent

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

async function sendOtpEmail(to, otp, name) {
  const transport = getTransporter();
  if (!transport) {
    // No SMTP configured — OTP will be returned in the API response (dev only)
    return null;
  }
  const info = await transport.sendMail({
    from: `"${process.env.FROM_NAME || 'SalesOrbit CRM'}" <${process.env.FROM_EMAIL || 'noreply@salesorbit.io'}>`,
    to,
    subject: 'Your SalesOrbit Login OTP',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#4796E3">SalesOrbit CRM</h2>
        <p>Hi ${name || 'there'},</p>
        <p>Your one-time login code is:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#4796E3;margin:24px 0">${otp}</div>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p style="color:#888;font-size:12px">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
  return info;
}

module.exports = { sendOtpEmail };
