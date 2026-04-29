const Joi = require('joi');
const Opportunity = require('../models/Opportunity');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const { ok, created, badRequest, notFound } = require('../utils/response');
const { sendCSV } = require('../utils/csvExport');

const oppSchema = Joi.object({
  opportunityName: Joi.string().trim().min(1).max(200).required(),
  companyName: Joi.string().trim().min(1).max(200).required(),
  contactPerson: Joi.string().trim().allow('').default(''),
  email: Joi.string().email().lowercase().allow('').default(''),
  phone: Joi.string().trim().allow('').max(30).default(''),
  city: Joi.string().trim().allow('').max(100).default(''),
  website: Joi.string().trim().allow('').max(200).default(''),
  leadSource: Joi.string().trim().allow('').default(''),
  vertical: Joi.string().trim().allow('').default(''),
  natureOfBusiness: Joi.string().trim().allow('').default(''),
  leadOwner: Joi.string().trim().allow('').default(''),
  priority: Joi.string().valid('Hot', 'Warm', 'Cold').default('Cold'),
  expectedMonthlyVolume: Joi.number().min(0).default(0),
  expectedMonthlyRevenue: Joi.number().min(0).default(0),
  expectedCloseDate: Joi.date().iso().allow(null).default(null),
  decisionMaker: Joi.string().trim().allow('').default(''),
  competitors: Joi.array().items(Joi.string()).default([]),
  dealNotes: Joi.string().trim().allow('').default(''),
  stage: Joi.string().valid('Prospecting', 'Won', 'Onboarded', 'Activated', 'Lost', 'On Hold').default('Prospecting'),
  lostReason: Joi.string().trim().allow('').default(''),
  onHoldReviewDate: Joi.date().iso().allow(null).default(null),
});

function buildFilter(query, user) {
  const filter = {};
  if (user.role === 'Rep') filter.leadOwner = user.name;
  if (query.stage) filter.stage = query.stage;
  if (query.priority) filter.priority = query.priority;
  if (query.owner) filter.leadOwner = query.owner;
  if (query.nob) filter.natureOfBusiness = query.nob;
  if (query.search) {
    filter.$or = [
      { opportunityName: { $regex: query.search, $options: 'i' } },
      { companyName: { $regex: query.search, $options: 'i' } },
      { contactPerson: { $regex: query.search, $options: 'i' } },
    ];
  }
  return filter;
}

// GET /api/v1/opportunities
exports.list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;
    const sort = req.query.sortBy || '-createdAt';
    const filter = buildFilter(req.query, req.user);

    const [opportunities, total] = await Promise.all([
      Opportunity.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Opportunity.countDocuments(filter),
    ]);

    ok(res, { opportunities, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/opportunities
exports.create = async (req, res, next) => {
  try {
    const { error, value } = oppSchema.validate(req.body);
    if (error) return badRequest(res, error.details[0].message);

    const opp = await Opportunity.create({
      ...value,
      createdBy: req.user.name,
      stageHistory: [{
        stage: value.stage,
        enteredAt: new Date(),
        note: 'Opportunity created',
        changedBy: req.user.name,
      }],
    });
    created(res, { opportunity: opp.toJSON() }, 'Opportunity created');
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/opportunities/export
exports.exportCSV = async (req, res, next) => {
  try {
    const filter = buildFilter(req.query, req.user);
    const opps = await Opportunity.find(filter).sort('-createdAt').lean();
    const rows = opps.map(o => ({
      'Opportunity ID': o.opportunityId,
      'Name': o.opportunityName,
      'Company': o.companyName,
      'Contact': o.contactPerson,
      'Email': o.email,
      'Stage': o.stage,
      'Priority': o.priority,
      'Monthly Volume': o.expectedMonthlyVolume,
      'Monthly Revenue': o.expectedMonthlyRevenue,
      'Close Date': o.expectedCloseDate,
      'Lead Owner': o.leadOwner,
      'Nature of Business': o.natureOfBusiness,
      'Created At': o.createdAt,
    }));
    const date = new Date().toISOString().slice(0, 10);
    sendCSV(res, `opportunities-export-${date}.csv`, rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/opportunities/:id
exports.get = async (req, res, next) => {
  try {
    const opp = await Opportunity.findOne({ opportunityId: req.params.id }).lean();
    if (!opp) return notFound(res, 'Opportunity not found');
    const activities = await Activity.find({ entityType: 'opportunity', entityId: req.params.id })
      .sort('-dateTime').lean();
    ok(res, { opportunity: opp, activities });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/opportunities/:id
exports.update = async (req, res, next) => {
  try {
    const { error, value } = oppSchema.validate(req.body);
    if (error) return badRequest(res, error.details[0].message);

    const opp = await Opportunity.findOneAndUpdate(
      { opportunityId: req.params.id },
      value,
      { new: true, runValidators: true }
    ).lean();
    if (!opp) return notFound(res, 'Opportunity not found');
    ok(res, { opportunity: opp });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/opportunities/:id
exports.remove = async (req, res, next) => {
  try {
    const opp = await Opportunity.findOneAndDelete({ opportunityId: req.params.id });
    if (!opp) return notFound(res, 'Opportunity not found');
    await Activity.deleteMany({ entityType: 'opportunity', entityId: req.params.id });
    ok(res, {}, 'Opportunity deleted');
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/opportunities/:id/stage
exports.moveStage = async (req, res, next) => {
  try {
    const { error, value } = Joi.object({
      stage: Joi.string().valid('Prospecting', 'Won', 'Onboarded', 'Activated', 'Lost', 'On Hold').required(),
      note: Joi.string().trim().allow('').default(''),
      lostReason: Joi.string().trim().allow('').default(''),
      onHoldReviewDate: Joi.date().iso().allow(null).default(null),
    }).validate(req.body);
    if (error) return badRequest(res, error.details[0].message);

    const opp = await Opportunity.findOne({ opportunityId: req.params.id });
    if (!opp) return notFound(res, 'Opportunity not found');

    const now = new Date();
    // Close last stage entry
    const last = opp.stageHistory[opp.stageHistory.length - 1];
    if (last && !last.exitedAt) last.exitedAt = now;

    opp.stageHistory.push({ stage: value.stage, enteredAt: now, note: value.note, changedBy: req.user.name });
    opp.stage = value.stage;
    if (value.lostReason) opp.lostReason = value.lostReason;
    if (value.onHoldReviewDate) opp.onHoldReviewDate = value.onHoldReviewDate;
    if (value.stage === 'Won' || value.stage === 'Activated') {
      // Update linked lead if exists
      if (opp.leadId) {
        await Lead.findOneAndUpdate({ leadId: opp.leadId }, { status: 'Converted' });
      }
    }
    await opp.save();
    ok(res, { opportunity: opp.toJSON() }, 'Stage updated');
  } catch (err) {
    next(err);
  }
};
