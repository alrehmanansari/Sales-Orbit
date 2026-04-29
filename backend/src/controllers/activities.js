const Joi = require('joi');
const pool = require('../config/db');
const { ok, created, badRequest, notFound } = require('../utils/response');
const { transformActivity } = require('../utils/transform');

// Exported for leads.js GET single lead (reuses transform)
exports._transform = transformActivity;

const activitySchema = Joi.object({
  entityType:        Joi.string().valid('lead','opportunity').required(),
  entityId:          Joi.string().required(),
  type:              Joi.string().valid('Call','Email','Meeting','WhatsApp','Note').required(),
  callType:          Joi.string().trim().allow('').default(''),
  callOutcome:       Joi.string().trim().allow('').default(''),
  dateTime:          Joi.date().iso().required(),
  nextFollowUpDate:  Joi.date().iso().allow(null).default(null),
  notes:             Joi.string().trim().allow('').max(2000).default(''),
});

function genActId() {
  return `ACT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
}

// GET /api/v1/activities
exports.list = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(200, parseInt(req.query.limit) || 50);
    const offset = (page - 1) * limit;

    const conds = [], params = [];
    if (req.user.role === 'Rep') { conds.push('logged_by = ?');   params.push(req.user.name); }
    if (req.query.entityType)   { conds.push('entity_type = ?'); params.push(req.query.entityType); }
    if (req.query.entityId)     { conds.push('entity_id = ?');   params.push(req.query.entityId); }
    if (req.query.type)         { conds.push('type = ?');         params.push(req.query.type); }

    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM activities ${where}`, params);
    const [rows] = await pool.query(
      `SELECT * FROM activities ${where} ORDER BY date_time DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    ok(res, { activities: rows.map(transformActivity), total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// POST /api/v1/activities
exports.create = async (req, res, next) => {
  try {
    const { error, value } = activitySchema.validate(req.body);
    if (error) return badRequest(res, error.details[0].message);

    const activityId = genActId();
    const loggedBy = req.user.name;

    await pool.query(
      `INSERT INTO activities
        (activity_id,entity_type,entity_id,type,call_type,call_outcome,
         date_time,next_follow_up_date,notes,logged_by)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [activityId, value.entityType, value.entityId, value.type,
       value.callType, value.callOutcome, value.dateTime,
       value.nextFollowUpDate || null, value.notes, loggedBy]
    );

    // Update last_activity_at on lead
    if (value.entityType === 'lead') {
      await pool.query(
        'UPDATE leads SET last_activity_at = ? WHERE lead_id = ?',
        [value.dateTime, value.entityId]
      );
    }

    const [rows] = await pool.query('SELECT * FROM activities WHERE activity_id = ?', [activityId]);
    created(res, { activity: transformActivity(rows[0]) }, 'Activity logged');
  } catch (err) { next(err); }
};

// GET /api/v1/activities/:id
exports.get = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM activities WHERE activity_id = ?', [req.params.id]);
    if (!rows.length) return notFound(res, 'Activity not found');
    ok(res, { activity: transformActivity(rows[0]) });
  } catch (err) { next(err); }
};

// GET /api/v1/activities/entity/:type/:id
exports.byEntity = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM activities WHERE entity_type = ? AND entity_id = ? ORDER BY date_time DESC',
      [req.params.type, req.params.id]
    );
    ok(res, { activities: rows.map(transformActivity), total: rows.length });
  } catch (err) { next(err); }
};
