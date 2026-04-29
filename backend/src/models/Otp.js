const mongoose = require('mongoose');

// TTL index automatically deletes expired OTP documents
const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true },
  otpHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // 10 minutes
});

module.exports = mongoose.model('Otp', otpSchema);
