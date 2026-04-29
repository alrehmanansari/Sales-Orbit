const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  leadId: { type: String, unique: true },
  contactPerson: { type: String, required: true, trim: true },
  companyName: { type: String, required: true, trim: true },
  website: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, lowercase: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },
  leadSource: { type: String, trim: true, default: '' },
  leadSourceOther: { type: String, trim: true, default: '' },
  vertical: { type: String, trim: true, default: '' },
  natureOfBusiness: { type: String, trim: true, default: '' },
  leadOwner: { type: String, trim: true, default: '' },
  priority: { type: String, enum: ['Hot', 'Warm', 'Cold'], default: 'Cold' },
  notes: { type: String, trim: true, default: '' },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'],
    default: 'New',
  },
  createdBy: { type: String, trim: true },
  convertedAt: { type: Date, default: null },
  opportunityId: { type: String, default: null },
  lastActivityAt: { type: Date, default: null },
}, { timestamps: true });

leadSchema.index({ status: 1, priority: 1, leadOwner: 1 });
leadSchema.index({ email: 1 });
leadSchema.index({ companyName: 'text', contactPerson: 'text', email: 'text' });

leadSchema.pre('save', function (next) {
  if (!this.leadId) {
    const date = new Date();
    const d = date.toISOString().slice(0, 10).replace(/-/g, '');
    this.leadId = `LD-${d}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  next();
});

leadSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret.leadId;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Lead', leadSchema);
