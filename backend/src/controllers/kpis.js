const Joi = require('joi');
const Kpi = require('../models/Kpi');
const { ok, badRequest } = require('../utils/response');

const kpiEntrySchema = Joi.object({
  userId: Joi.string().required(),
  userName: Joi.string().required(),
  quarter: Joi.string().valid('Q1', 'Q2', 'Q3', 'Q4').required(),
  year: Joi.number().integer().min(2020).max(2100).required(),
  tcTarget: Joi.number().min(0).default(0),
  tcAch: Joi.number().min(0).default(0),
  acTarget: Joi.number().min(0).default(0),
  acAch: Joi.number().min(0).default(0),
});

// GET /api/v1/kpis
exports.list = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const filter = { year };
    if (req.user.role === 'Rep') filter.userId = req.user.userId;

    const kpis = await Kpi.find(filter).sort('userName quarter').lean();
    ok(res, { kpis });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/kpis/:userId
exports.getByUser = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const kpis = await Kpi.find({ userId: req.params.userId, year }).lean();
    ok(res, { kpis });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/kpis  (upsert bulk)
exports.upsert = async (req, res, next) => {
  try {
    const rows = req.body.kpis;
    if (!Array.isArray(rows)) return badRequest(res, 'kpis array required');

    const ops = [];
    for (const row of rows) {
      const { error, value } = kpiEntrySchema.validate(row);
      if (error) return badRequest(res, error.details[0].message);
      ops.push({
        updateOne: {
          filter: { userId: value.userId, quarter: value.quarter, year: value.year },
          update: { $set: value },
          upsert: true,
        },
      });
    }

    await Kpi.bulkWrite(ops);
    ok(res, {}, 'KPIs updated');
  } catch (err) {
    next(err);
  }
};
