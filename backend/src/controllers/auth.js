const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { sendOtpEmail } = require('../config/mail');
const { ok, created, badRequest } = require('../utils/response');

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function issueOtp(email, name) {
  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, ROUNDS);
  await Otp.deleteMany({ email });
  await Otp.create({ email, otpHash });
  await sendOtpEmail(email, otp, name);
  // Return otp only in development (never in production)
  return process.env.NODE_ENV !== 'production' ? otp : null;
}

// POST /api/v1/auth/signup
exports.signup = async (req, res, next) => {
  try {
    const schema = Joi.object({
      firstName: Joi.string().trim().min(1).max(50).required(),
      lastName: Joi.string().trim().min(1).max(50).required(),
      email: Joi.string().email().lowercase().required(),
      designation: Joi.string().trim().min(1).max(100).required(),
    });
    const { error, value } = schema.validate(req.body);
    if (error) return badRequest(res, error.details[0].message);

    const existing = await User.findOne({ email: value.email });
    if (existing) return badRequest(res, 'Email already registered. Please log in.');

    const user = await User.create(value);
    const otp = await issueOtp(user.email, user.firstName);

    const payload = { message: 'OTP sent to your email', userId: user.userId };
    if (otp) payload.otp = otp; // dev only

    return created(res, payload, 'Account created. OTP sent.');
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/auth/login
exports.login = async (req, res, next) => {
  try {
    const { error, value } = Joi.object({
      email: Joi.string().email().lowercase().required(),
    }).validate(req.body);
    if (error) return badRequest(res, error.details[0].message);

    const user = await User.findOne({ email: value.email, isActive: true });
    if (!user) return badRequest(res, 'No account found for this email. Please sign up.');

    const otp = await issueOtp(user.email, user.firstName);

    const payload = { message: 'OTP sent to your email', userId: user.userId };
    if (otp) payload.otp = otp;

    return ok(res, payload);
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/auth/verify-otp
exports.verifyOtp = async (req, res, next) => {
  try {
    const { error, value } = Joi.object({
      email: Joi.string().email().lowercase().required(),
      otp: Joi.string().length(6).required(),
    }).validate(req.body);
    if (error) return badRequest(res, error.details[0].message);

    const record = await Otp.findOne({ email: value.email });
    if (!record) return badRequest(res, 'OTP expired or not found. Please request a new one.');

    const valid = await bcrypt.compare(value.otp, record.otpHash);
    if (!valid) return badRequest(res, 'Invalid OTP');

    await Otp.deleteMany({ email: value.email });

    const user = await User.findOne({ email: value.email }).lean();
    if (!user) return badRequest(res, 'User not found');
    user.name = `${user.firstName} ${user.lastName}`;

    const token = signToken(user.userId);
    return ok(res, { token, user });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/auth/me
exports.getMe = async (req, res) => {
  ok(res, { user: req.user });
};

// PUT /api/v1/auth/me
exports.updateMe = async (req, res, next) => {
  try {
    const { error, value } = Joi.object({
      firstName: Joi.string().trim().min(1).max(50),
      lastName: Joi.string().trim().min(1).max(50),
      designation: Joi.string().trim().min(1).max(100),
    }).validate(req.body);
    if (error) return badRequest(res, error.details[0].message);

    const user = await User.findOneAndUpdate(
      { userId: req.user.userId },
      value,
      { new: true, runValidators: true }
    ).lean();

    ok(res, { user });
  } catch (err) {
    next(err);
  }
};
