const Joi = require('joi');
const pool = require('../config/db');
const { ok, badRequest } = require('../utils/response');
const { transformKpi } = require('../utils/transform');

const kpiEntry = Joi.object({
  userId:   Joi.string().required(),
  userName: Joi.string().required(),
  quarter:  Joi.string().valid('Q1','Q2','Q3','Q4').required(),
  year:     Joi.number().integer().min(2020).max(2100).required(),
  tcTarget: Joi.number().min(0).default(0),
  tcAch:    Joi.number().min(0).default(0),
  acTarget: Joi.number().min(0).default(0),
  acAch:    Joi.number().min(0).default(0),
});

// GET /api/v1/kpis
exports.list = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const conds = ['year = ?'];
    const params = [year];
    if (req.user.role === 'Rep') { conds.push('user_id = ?'); params.push(req.user.userId); }

    const [rows] = await pool.query(
      `SELECT * FROM kpis WHERE ${conds.join(' AND ')} ORDER BY user_name, quarter`,
      params
    );
    ok(res, { kpis: rows.map(transformKpi) });
  } catch (err) { next(err); }
};

// GET /api/v1/kpis/:userId
exports.getByUser = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const [rows] = await pool.query(
      'SELECT * FROM kpis WHERE user_id = ? AND year = ? ORDER BY quarter',
      [req.params.userId, year]
    );
    ok(res, { kpis: rows.map(transformKpi) });
  } catch (err) { next(err); }
};

// PUT /api/v1/kpis  — upsert using SELECT + INSERT/UPDATE (works on MySQL & SQLite)
exports.upsert = async (req, res, next) => {
  try {
    const rows = req.body.kpis;
    if (!Array.isArray(rows)) return badRequest(res, 'kpis array required');

    for (const row of rows) {
      const { error, value } = kpiEntry.validate(row);
      if (error) return badRequest(res, error.details[0].message);

      const [existing] = await pool.query(
        'SELECT id FROM kpis WHERE user_id = ? AND quarter = ? AND year = ?',
        [value.userId, value.quarter, value.year]
      );

      if (existing.length) {
        await pool.query(
          `UPDATE kpis SET user_name = ?, tc_target = ?, tc_ach = ?, ac_target = ?, ac_ach = ?
           WHERE user_id = ? AND quarter = ? AND year = ?`,
          [value.userName, value.tcTarget, value.tcAch, value.acTarget, value.acAch,
           value.userId, value.quarter, value.year]
        );
      } else {
        await pool.query(
          `INSERT INTO kpis (user_id, user_name, quarter, year, tc_target, tc_ach, ac_target, ac_ach)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [value.userId, value.userName, value.quarter, value.year,
           value.tcTarget, value.tcAch, value.acTarget, value.acAch]
        );
      }
    }
    ok(res, {}, 'KPIs updated');
  } catch (err) { next(err); }
};
