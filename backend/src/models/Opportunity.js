const mongoose = require('mongoose');

const stageHistorySchema = new mongoose.Schema({
  stage: String,
  enteredAt: Date,
  exitedAt: { type: Date, default: null },
  note: { type: String, default: '' },
  changedBy: String,
}, { _id: false });

const opportunitySchema = new mongoose.Schema({
  opportunityId: { type: String, unique: true },
  leadId: { type: String, default: null },
  opportunityName: { type: String, required: true, trim: true },
  companyName: { type: String, required: true, trim: true },
  contactPerson: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, lowercase: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },
  website: { type: String, trim: true, default: '' },
  leadSource: { type: String, trim: true, default: '' },
  vertical: { type: String, trim: true, default: '' },
  natureOfBusiness: { type: String, trim: true, default: '' },
  leadOwner: { type: String, trim: true, default: '' },
  priority: { type: String, enum: ['Hot', 'Warm', 'Cold'], default: 'Cold' },
  expectedMonthlyVolume: { type: Number, default: 0 },
  expectedMonthlyRevenue: { type: Number, default: 0 },
  expectedCloseDate: { type: Date, default: null },
  decisionMaker: { type: String, trim: true, default: '' },
  competitors: { type: [String], default: [] },
  dealNotes: { type: String, trim: true, default: '' },
  stage: {
    type: String,
    enum: ['Prospecting', 'Won', 'Onboarded', 'Activated', 'Lost', 'On Hold'],
    default: 'Prospecting',
  },
  lostReason: { type: String, trim: true, default: '' },
  onHoldReviewDate: { type: Date, default: null },
  stageHistory: { type: [stageHistorySchema], default: [] },
  createdBy: { type: String, trim: true },
}, { timestamps: true });

opportunitySchema.index({ stage: 1, leadOwner: 1, priority: 1 });
opportunitySchema.index({ companyName: 'text', opportunityName: 'text', contactPerson: 'text' });

opportunitySchema.pre('save', function (next) {
  if (!this.opportunityId) {
    const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    this.opportunityId = `OPP-${d}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  next();
});

opportunitySchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret.opportunityId;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Opportunity', opportunitySchema);
