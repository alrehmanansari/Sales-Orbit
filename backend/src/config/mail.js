/**
 * Email delivery cascade (highest priority first):
 *
 *  1. Resend API  — set RESEND_API_KEY in .env
 *                   Uses HTTPS (port 443) — works on every network.
 *                   Free tier: 3,000 emails / month  →  resend.com
 *
 *  2. SMTP        — set SMTP_USER + SMTP_PASS in .env
 *                   Works with Gmail App Passwords, SendGrid, etc.
 *
 *  3. Ethereal    — auto-provisioned test inbox, no config needed.
 *                   Emails viewable at ethereal.email (not real delivery).
 *                   Falls back to OTP-in-response if port 587 is blocked.
 */

const nodemailer = require('nodemailer');

let smtpTransporter  = null;
let etherealReady    = false;

// ── Email HTML template ──────────────────────────────────────────────────────
function otpHtml(otp, name) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
      <h2 style="color:#4796E3;margin:0 0 16px">SalesOrbit CRM</h2>
      <p style="color:#444;margin:0 0 8px">Hi ${name || 'there'},</p>
      <p style="color:#444;margin:0 0 24px">Your one-time login code is:</p>
      <div style="font-size:40px;font-weight:800;letter-spacing:10px;color:#4796E3;
                  background:#f0f7ff;border-radius:12px;padding:20px 32px;
                  display:inline-block;margin:0 0 24px">${otp}</div>
      <p style="color:#444;margin:0 0 8px">
        This code expires in <strong>10 minutes</strong>.
      </p>
      <p style="color:#999;font-size:12px;margin:0">
        If you did not request this, you can safely ignore this email.
      </p>
    </div>
  `;
}

// ── 1. Resend REST API (HTTPS — no SMTP port required) ───────────────────────
async function sendViaResend(to, otp, name) {
  const fromName  = process.env.FROM_NAME  || 'SalesOrbit CRM';
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:    `${fromName} <${fromEmail}>`,
      to:      [to],
      subject: 'Your SalesOrbit Login OTP',
      html:    otpHtml(otp, name),
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Resend API error ${res.status}`);
  }

  console.log('✉  OTP email sent via Resend →', to);
  return { previewUrl: null };
}

// ── 2. SMTP (Gmail App Password, SendGrid, etc.) ─────────────────────────────
async function getSmtpTransporter() {
  if (smtpTransporter) return smtpTransporter;

  const t = nodemailer.createTransport({
    host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await t.verify(); // throws if credentials are wrong
  smtpTransporter = t;
  console.log('✉  SMTP connected:', process.env.SMTP_HOST || 'smtp.gmail.com');
  return t;
}

async function sendViaSmtp(to, otp, name) {
  const t = await getSmtpTransporter();
  const fromName  = process.env.FROM_NAME  || 'SalesOrbit CRM';
  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;

  await t.sendMail({
    from:    `"${fromName}" <${fromEmail}>`,
    to,
    subject: 'Your SalesOrbit Login OTP',
    html:    otpHtml(otp, name),
  });

  console.log('✉  OTP email sent via SMTP →', to);
  return { previewUrl: null };
}

// ── 3. Ethereal (auto test account — preview URL only, no real delivery) ─────
async function sendViaEthereal(to, otp, name) {
  if (!etherealReady) {
    const test = await nodemailer.createTestAccount();
    smtpTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email', port: 587, secure: false,
      auth: { user: test.user, pass: test.pass },
    });
    etherealReady = true;
    console.log('✉  Ethereal test account ready — view emails at https://ethereal.email');
    console.log(`   Login: ${test.user}  /  ${test.pass}`);
  }

  const info = await smtpTransporter.sendMail({
    from:    '"SalesOrbit CRM" <noreply@salesorbit.io>',
    to,
    subject: 'Your SalesOrbit Login OTP',
    html:    otpHtml(otp, name),
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) || null;
  if (previewUrl) console.log('✉  Ethereal preview:', previewUrl);
  return { previewUrl };
}

// ── Public: sendOtpEmail ─────────────────────────────────────────────────────
async function sendOtpEmail(to, otp, name) {
  // 1. Resend (HTTPS — preferred, no port restrictions)
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_xxxxxxxxxxxxxxxxxxxx') {
    return sendViaResend(to, otp, name);
  }

  // 2. SMTP (Gmail, SendGrid, etc.)
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return sendViaSmtp(to, otp, name);
  }

  // 3. No provider configured — skip silently, OTP will be shown on screen
  console.log('✉  No email provider configured — OTP returned in API response');
  return { previewUrl: null };
}

module.exports = { sendOtpEmail };
