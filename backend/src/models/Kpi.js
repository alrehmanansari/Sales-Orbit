const mongoose = require('mongoose');

const kpiSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  quarter: { type: String, enum: ['Q1', 'Q2', 'Q3', 'Q4'], required: true },
  year: { type: Number, required: true },
  tcTarget: { type: Number, default: 0 },
  tcAch: { type: Number, default: 0 },
  acTarget: { type: Number, default: 0 },
  acAch: { type: Number, default: 0 },
}, { timestamps: true });

kpiSchema.index({ userId: 1, quarter: 1, year: 1 }, { unique: true });

kpiSchema.virtual('score').get(function () {
  const tcScore = this.tcTarget > 0 ? (this.tcAch / this.tcTarget) * 70 : 0;
  const acScore = this.acTarget > 0 ? (this.acAch / this.acTarget) * 30 : 0;
  return Math.min(100, Math.round(tcScore + acScore));
});

kpiSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Kpi', kpiSchema);
