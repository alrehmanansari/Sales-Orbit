const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const pool = require('../config/db');
const { sendOtpEmail } = require('../config/mail');
const { ok, created, badRequest } = require('../utils/response');
const { transformUser } = require('../utils/transform');

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;
const OTP_MS = parseInt(process.env.OTP_EXPIRES_MS) || 600000;
const MANAGER_DESIGNATIONS = ['Head of Sales', 'Country Manager', 'Head of MENA'];

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function genOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function issueOtp(email, name) {
  const otp = genOtp();
  const hash = await bcrypt.hash(otp, ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_MS);

  await pool.query('DELETE FROM otps WHERE email = ?', [email]);
  await pool.query('DELETE FROM otps WHERE expires_at < NOW()');
  await pool.query(
    'INSERT INTO otps (email, otp_hash, expires_at) VALUES (?, ?, ?)',
    [email, hash, expiresAt]
  );

  // Only attempt email if SMTP credentials are actually configured
  const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
  let emailSent = false;

  if (smtpConfigured) {
    try {
      await sendOtpEmail(email, otp, name);
      emailSent = true;
    } catch (emailErr) {
      console.warn('[auth] Email send failed — OTP returned in API response:', emailErr.message);
    }
  }

  // Return OTP in the API response unless it was successfully delivered by email
  // (in which case, only withhold it in production for security)
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && emailSent) return null;   // prod + working SMTP → user checks inbox
  return otp;                             // everything else → OTP shown on screen
}

// POST /api/v1/auth/signup
exports.signup = async (req, res, next) => {
  try {
    const { error, value } = Joi.object({
      firstName:   Joi.string().trim().min(1).max(50).required(),
      lastName:    Joi.string().trim().min(1).max(50).required(),
      email:       Joi.string().email().lowercase().required(),
      designation: Joi.string().trim().min(1).max(100).required(),
    }).validate(req.body);
    if (error) return badRequest(res, error.details[0].message);

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [value.email]);
    if (existing.length) return badRequest(res, 'Email already registered. Please log in.');

    const userId = `USR-${Date.now()}`;
    const role = MANAGER_DESIGNATIONS.includes(value.designation) ? 'Manager' : 'Rep';

    await pool.query(
      'INSERT INTO users (user_id, first_name, last_name, email, designation, role) VALUES (?,?,?,?,?,?)',
      [userId, value.firstName, value.lastName, value.email, value.designation, role]
    );

    const otp = await issueOtp(value.email, value.firstName);
    const payload = { message: 'Account created. OTP sent.', userId };
    if (otp) payload.otp = otp;
    return created(res, payload, 'Account created. OTP sent.');
  } catch (err) { next(err); }
};

// POST /api/v1/auth/login
exports.login = async (req, res, next) => {
  try {
    const { error, value } = Joi.object({
      email: Joi.string().email().lowercase().required(),
    }).validate(req.body);
    if (error) return badRequest(res, error.details[0].message);

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND is_active = 1', [value.email]
    );
    if (!rows.length) return badRequest(res, 'No account found for this email. Please sign up.');

    const u = rows[0];
    const otp = await issueOtp(u.email, u.first_name);
    const payload = { message: 'OTP sent to your email', userId: u.user_id };
    if (otp) payload.otp = otp;
    return ok(res, payload);
  } catch (err) { next(err); }
};

// POST /api/v1/auth/verify-otp
exports.verifyOtp = async (req, res, next) => {
  try {
    const { error, value } = Joi.object({
      email: Joi.string().email().lowercase().required(),
      otp:   Joi.string().length(6).required(),
    }).validate(req.body);
    if (error) return badRequest(res, error.details[0].message);

    const [otpRows] = await pool.query(
      'SELECT * FROM otps WHERE email = ? AND expires_at > NOW()', [value.email]
    );
    if (!otpRows.length) return badRequest(res, 'OTP expired or not found. Please request a new one.');

    const valid = await bcrypt.compare(value.otp, otpRows[0].otp_hash);
    if (!valid) return badRequest(res, 'Invalid OTP');

    await pool.query('DELETE FROM otps WHERE email = ?', [value.email]);

    const [userRows] = await pool.query('SELECT * FROM users WHERE email = ?', [value.email]);
    if (!userRows.length) return badRequest(res, 'User not found');

    const user = transformUser(userRows[0]);
    const token = signToken(user.userId);
    return ok(res, { token, user });
  } catch (err) { next(err); }
};

// GET /api/v1/auth/me
exports.getMe = async (req, res) => {
  ok(res, { user: req.user });
};

// PUT /api/v1/auth/me
exports.updateMe = async (req, res, next) => {
  try {
    const { error, value } = Joi.object({
      firstName:   Joi.string().trim().min(1).max(50),
      lastName:    Joi.string().trim().min(1).max(50),
      designation: Joi.string().trim().min(1).max(100),
    }).validate(req.body);
    if (error) return badRequest(res, error.details[0].message);

    const sets = [], params = [];
    if (value.firstName)   { sets.push('first_name = ?');  params.push(value.firstName); }
    if (value.lastName)    { sets.push('last_name = ?');   params.push(value.lastName); }
    if (value.designation) {
      sets.push('designation = ?'); params.push(value.designation);
      sets.push('role = ?');
      params.push(MANAGER_DESIGNATIONS.includes(value.designation) ? 'Manager' : 'Rep');
    }
    if (!sets.length) return badRequest(res, 'No fields to update');

    params.push(req.user.userId);
    await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE user_id = ?`, params);

    const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [req.user.userId]);
    ok(res, { user: transformUser(rows[0]) });
  } catch (err) { next(err); }
};
