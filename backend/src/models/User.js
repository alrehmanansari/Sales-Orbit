const mongoose = require('mongoose');

const MANAGER_DESIGNATIONS = ['Head of Sales', 'Country Manager', 'Head of MENA'];

const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  designation: { type: String, required: true, trim: true },
  role: { type: String, enum: ['Manager', 'Rep'], default: 'Rep' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.virtual('name').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

userSchema.pre('save', function (next) {
  if (!this.userId) {
    this.userId = `USR-${Date.now()}`;
  }
  this.role = MANAGER_DESIGNATIONS.includes(this.designation) ? 'Manager' : 'Rep';
  next();
});

module.exports = mongoose.model('User', userSchema);
