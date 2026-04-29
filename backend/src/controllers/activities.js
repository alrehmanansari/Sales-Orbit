const Joi = require('joi');
const Activity = require('../models/Activity');
const Lead = require('../models/Lead');
const { ok, created, badRequest, notFound } = require('../utils/response');

const activitySchema = Joi.object({
  entityType: Joi.string().valid('lead', 'opportunity').required(),
  entityId: Joi.string().required(),
  type: Joi.string().valid('Call', 'Email', 'Meeting', 'WhatsApp', 'Note').required(),
  callType: Joi.string().trim().allow('').default(''),
  callOutcome: Joi.string().trim().allow('').default(''),
  dateTime: Joi.date().iso().required(),
  nextFollowUpDate: Joi.date().iso().allow(null).default(null),
  notes: Joi.string().trim().allow('').max(2000).default(''),
});

// GET /api/v1/activities
exports.list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, parseInt(req.query.limit) || 50);
    const filter = {};
    if (req.query.entityType) filter.entityType = req.query.entityType;
    if (req.query.entityId) filter.entityId = req.query.entityId;
    if (req.query.type) filter.type = req.query.type;
    if (req.user.role === 'Rep') filter.loggedBy = req.user.name;

    const [activities, total] = await Promise.all([
      Activity.find(filter).sort('-dateTime').skip((page - 1) * limit).limit(limit).lean(),
      Activity.countDocuments(filter),
    ]);
    ok(res, { activities, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/activities
exports.create = async (req, res, next) => {
  try {
    const { error, value } = activitySchema.validate(req.body);
    if (error) return badRequest(res, error.details[0].message);

    const activity = await Activity.create({ ...value, loggedBy: req.user.name });

    // Update lastActivityAt on lead
    if (value.entityType === 'lead') {
      await Lead.findOneAndUpdate(
        { leadId: value.entityId },
        { lastActivityAt: new Date() }
      );
    }

    created(res, { activity: activity.toJSON() }, 'Activity logged');
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/activities/:id
exports.get = async (req, res, next) => {
  try {
    const activity = await Activity.findOne({ activityId: req.params.id }).lean();
    if (!activity) return notFound(res, 'Activity not found');
    ok(res, { activity });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/activities/entity/:type/:id
exports.byEntity = async (req, res, next) => {
  try {
    const activities = await Activity.find({
      entityType: req.params.type,
      entityId: req.params.id,
    }).sort('-dateTime').lean();
    ok(res, { activities, total: activities.length });
  } catch (err) {
    next(err);
  }
};
