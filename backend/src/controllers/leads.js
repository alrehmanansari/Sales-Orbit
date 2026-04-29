const Joi = require('joi');
const Lead = require('../models/Lead');
const Opportunity = require('../models/Opportunity');
const Activity = require('../models/Activity');
const { ok, created, badRequest, notFound } = require('../utils/response');
const { sendCSV } = require('../utils/csvExport');

const leadSchema = Joi.object({
  contactPerson: Joi.string().trim().min(1).max(100).required(),
  companyName: Joi.string().trim().min(1).max(200).required(),
  website: Joi.string().trim().allow('').max(200).default(''),
  email: Joi.string().email().lowercase().allow('').default(''),
  phone: Joi.string().trim().allow('').max(30).default(''),
  city: Joi.string().trim().allow('').max(100).default(''),
  leadSource: Joi.string().trim().allow('').default(''),
  leadSourceOther: Joi.string().trim().allow('').default(''),
  vertical: Joi.string().trim().allow('').default(''),
  natureOfBusiness: Joi.string().trim().allow('').default(''),
  leadOwner: Joi.string().trim().allow('').default(''),
  priority: Joi.string().valid('Hot', 'Warm', 'Cold').default('Cold'),
  notes: Joi.string().trim().allow('').default(''),
  status: Joi.string().valid('New', 'Contacted', 'Qualified', 'Converted', 'Lost').default('New'),
});

function buildFilter(query, user) {
  const filter = {};
  if (user.role === 'Rep') filter.leadOwner = user.name;
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.owner) filter.leadOwner = query.owner;
  if (query.vertical) filter.vertical = query.vertical;
  if (query.search) {
    filter.$or = [
      { contactPerson: { $regex: query.search, $options: 'i' } },
      { companyName: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
    ];
  }
  return filter;
}

// GET /api/v1/leads
exports.list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;
    const sort = req.query.sortBy || '-createdAt';

    const filter = buildFilter(req.query, req.user);
    const [leads, total] = await Promise.all([
      Lead.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Lead.countDocuments(filter),
    ]);

    ok(res, { leads, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/leads
exports.create = async (req, res, next) => {
  try {
    const { error, value } = leadSchema.validate(req.body);
    if (error) return badRequest(res, error.details[0].message);

    const lead = await Lead.create({ ...value, createdBy: req.user.name });
    created(res, { lead }, 'Lead created');
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/leads/export
exports.exportCSV = async (req, res, next) => {
  try {
    const filter = buildFilter(req.query, req.user);
    const leads = await Lead.find(filter).sort('-createdAt').lean();
    const rows = leads.map(l => ({
      'Lead ID': l.leadId,
      'Contact Person': l.contactPerson,
      'Company Name': l.companyName,
      'Email': l.email,
      'Phone': l.phone,
      'City': l.city,
      'Lead Source': l.leadSource,
      'Vertical': l.vertical,
      'Nature of Business': l.natureOfBusiness,
      'Lead Owner': l.leadOwner,
      'Priority': l.priority,
      'Status': l.status,
      'Notes': l.notes,
      'Created At': l.createdAt,
    }));
    const date = new Date().toISOString().slice(0, 10);
    sendCSV(res, `leads-export-${date}.csv`, rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/leads/:id
exports.get = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ leadId: req.params.id }).lean();
    if (!lead) return notFound(res, 'Lead not found');
    const activities = await Activity.find({ entityType: 'lead', entityId: req.params.id })
      .sort('-dateTime').lean();
    ok(res, { lead, activities });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/leads/:id
exports.update = async (req, res, next) => {
  try {
    const { error, value } = leadSchema.validate(req.body, { allowUnknown: false });
    if (error) return badRequest(res, error.details[0].message);

    const lead = await Lead.findOneAndUpdate(
      { leadId: req.params.id },
      value,
      { new: true, runValidators: true }
    ).lean();
    if (!lead) return notFound(res, 'Lead not found');
    ok(res, { lead });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/leads/:id
exports.remove = async (req, res, next) => {
  try {
    const lead = await Lead.findOneAndDelete({ leadId: req.params.id });
    if (!lead) return notFound(res, 'Lead not found');
    await Activity.deleteMany({ entityType: 'lead', entityId: req.params.id });
    ok(res, {}, 'Lead deleted');
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/leads/bulk
exports.bulkImport = async (req, res, next) => {
  try {
    const rows = req.body.leads;
    if (!Array.isArray(rows) || rows.length === 0) {
      return badRequest(res, 'leads array is required');
    }

    const emails = rows.map(r => r.email?.toLowerCase()).filter(Boolean);
    const existing = await Lead.find({ email: { $in: emails } }).select('email').lean();
    const existingEmails = new Set(existing.map(e => e.email));

    const toInsert = [];
    const skipped = [];

    for (const row of rows) {
      const { error, value } = leadSchema.validate(row, { abortEarly: false });
      if (error) { skipped.push({ row, reason: error.details.map(d => d.message).join(', ') }); continue; }
      if (value.email && existingEmails.has(value.email)) { skipped.push({ row, reason: 'Duplicate email' }); continue; }
      toInsert.push({ ...value, createdBy: req.user.name });
    }

    const inserted = toInsert.length ? await Lead.insertMany(toInsert) : [];
    ok(res, { inserted: inserted.length, skipped: skipped.length, skippedRows: skipped });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/leads/:id/convert
exports.convert = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ leadId: req.params.id });
    if (!lead) return notFound(res, 'Lead not found');
    if (lead.status === 'Converted') return badRequest(res, 'Lead already converted');

    const { error, value } = Joi.object({
      opportunityName: Joi.string().trim().min(1).required(),
      expectedMonthlyVolume: Joi.number().min(0).default(0),
      expectedMonthlyRevenue: Joi.number().min(0).default(0),
      expectedCloseDate: Joi.date().iso().allow(null).default(null),
      decisionMaker: Joi.string().trim().allow('').default(''),
      dealNotes: Joi.string().trim().allow('').default(''),
    }).validate(req.body);
    if (error) return badRequest(res, error.details[0].message);

    const opp = await Opportunity.create({
      leadId: lead.leadId,
      opportunityName: value.opportunityName,
      companyName: lead.companyName,
      contactPerson: lead.contactPerson,
      email: lead.email,
      phone: lead.phone,
      city: lead.city,
      website: lead.website,
      leadSource: lead.leadSource,
      vertical: lead.vertical,
      natureOfBusiness: lead.natureOfBusiness,
      leadOwner: lead.leadOwner,
      priority: lead.priority,
      expectedMonthlyVolume: value.expectedMonthlyVolume,
      expectedMonthlyRevenue: value.expectedMonthlyRevenue,
      expectedCloseDate: value.expectedCloseDate,
      decisionMaker: value.decisionMaker,
      dealNotes: value.dealNotes,
      stage: 'Prospecting',
      stageHistory: [{
        stage: 'Prospecting',
        enteredAt: new Date(),
        note: 'Opportunity created from lead',
        changedBy: req.user.name,
      }],
      createdBy: req.user.name,
    });

    lead.status = 'Converted';
    lead.convertedAt = new Date();
    lead.opportunityId = opp.opportunityId;
    await lead.save();

    ok(res, { lead, opportunity: opp.toJSON() }, 'Lead converted to opportunity');
  } catch (err) {
    next(err);
  }
};
