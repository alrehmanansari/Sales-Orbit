const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  activityId: { type: String, unique: true },
  entityType: { type: String, enum: ['lead', 'opportunity'], required: true },
  entityId: { type: String, required: true },
  type: {
    type: String,
    enum: ['Call', 'Email', 'Meeting', 'WhatsApp', 'Note'],
    required: true,
  },
  callType: { type: String, trim: true, default: '' },
  callOutcome: { type: String, trim: true, default: '' },
  dateTime: { type: Date, required: true },
  nextFollowUpDate: { type: Date, default: null },
  notes: { type: String, trim: true, default: '' },
  loggedBy: { type: String, trim: true },
}, { timestamps: true });

activitySchema.index({ entityType: 1, entityId: 1, dateTime: -1 });
activitySchema.index({ loggedBy: 1 });

activitySchema.pre('save', function (next) {
  if (!this.activityId) {
    this.activityId = `ACT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  }
  next();
});

activitySchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret.activityId;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Activity', activitySchema);
