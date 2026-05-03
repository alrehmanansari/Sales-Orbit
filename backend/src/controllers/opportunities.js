const Joi = require('joi');
const pool = require('../config/db');
const { ok, created, badRequest, notFound } = require('../utils/response');
const { sendCSV } = require('../utils/csvExport');
const { transformOpportunity, transformStageHistory, transformActivity } = require('../utils/transform');

const SAFE_SORT = {
  '-createdAt': 'o.created_at DESC', 'createdAt': 'o.created_at ASC',
  '-companyName': 'o.company_name DESC', 'companyName': 'o.company_name ASC',
  '-stage': 'o.stage DESC', 'stage': 'o.stage ASC',
};

const oppSchema = Joi.object({
  opportunityName:        Joi.string().trim().min(1).max(200).required(),
  companyName:            Joi.string().trim().min(1).max(200).required(),
  contactPerson:          Joi.string().trim().allow('').default(''),
  email:                  Joi.string().email().lowercase().allow('').default(''),
  phone:                  Joi.string().trim().allow('').max(30).default(''),
  city:                   Joi.string().trim().allow('').max(100).default(''),
  website:                Joi.string().trim().allow('').max(200).default(''),
  leadSource:             Joi.string().trim().allow('').default(''),
  vertical:               Joi.string().trim().allow('').default(''),
  natureOfBusiness:       Joi.string().trim().allow('').default(''),
  leadOwner:              Joi.string().trim().allow('').default(''),
  priority:               Joi.string().valid('Hot','Warm','Cold').default('Cold'),
  expectedMonthlyVolume:  Joi.number().min(0).default(0),
  expectedMonthlyRevenue: Joi.number().min(0).default(0),
  expectedCloseDate:      Joi.date().iso().allow(null).default(null),
  decisionMaker:          Joi.string().trim().allow('').default(''),
  competitors:            Joi.array().items(Joi.string()).default([]),
  dealNotes:              Joi.string().trim().allow('').default(''),
  stage:                  Joi.string().valid('Prospecting','Won','Onboarded','Activated','Lost','On Hold').default('Prospecting'),
  lostReason:             Joi.string().trim().allow('').default(''),
  onHoldReviewDate:       Joi.date().iso().allow(null).default(null),
  clientId:               Joi.string().trim().allow('').default(''),
  kycAgent:               Joi.string().trim().allow('').default(''),
});

function genOppId() {
  const d = new Date().toISOString().slice(0,10).replace(/-/g,'');
  return `OPP-${d}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function buildWhere(query, user) {
  const conds = [], params = [];
  if (user.role === 'Rep') { conds.push('o.lead_owner = ?'); params.push(user.name); }
  if (query.stage)    { conds.push('o.stage = ?');          params.push(query.stage); }
  if (query.priority) { conds.push('o.priority = ?');       params.push(query.priority); }
  if (query.owner)    { conds.push('o.lead_owner = ?');     params.push(query.owner); }
  if (query.nob)      { conds.push('o.nature_of_business = ?'); params.push(query.nob); }
  if (query.search) {
    const s = `%${query.search}%`;
    conds.push('(o.opportunity_name LIKE ? OR o.company_name LIKE ? OR o.contact_person LIKE ?)');
    params.push(s, s, s);
  }
  return { where: conds.length ? 'WHERE ' + conds.join(' AND ') : '', params };
}

async function attachStageHistory(oppRows) {
  if (!oppRows.length) return oppRows.map(r => transformOpportunity(r, []));
  const ids = oppRows.map(r => r.opportunity_id);
  const [sh] = await pool.query(
    'SELECT * FROM stage_history WHERE opportunity_id IN (?) ORDER BY id ASC', [ids]
  );
  const map = {};
  sh.forEach(h => {
    if (!map[h.opportunity_id]) map[h.opportunity_id] = [];
    map[h.opportunity_id].push(transformStageHistory(h));
  });
  return oppRows.map(r => transformOpportunity(r, map[r.opportunity_id] || []));
}

// GET /api/v1/opportunities
exports.list = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const offset = (page - 1) * limit;
    const sort = SAFE_SORT[req.query.sortBy] || 'o.created_at DESC';
    const { where, params } = buildWhere(req.query, req.user);

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM opportunities o ${where}`, params
    );
    const [rows] = await pool.query(
      `SELECT o.* FROM opportunities o ${where} ORDER BY ${sort} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const opportunities = await attachStageHistory(rows);
    ok(res, { opportunities, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// POST /api/v1/opportunities
exports.create = async (req, res, next) => {
  try {
    const { error, value } = oppSchema.validate(req.body);
    if (error) return badRequest(res, error.details[0].message);

    const oppId = genOppId();
    const now = new Date();

    await pool.query(
      `INSERT INTO opportunities
        (opportunity_id,opportunity_name,company_name,contact_person,email,phone,city,website,
         lead_source,vertical,nature_of_business,lead_owner,priority,expected_monthly_volume,
         expected_monthly_revenue,expected_close_date,decision_maker,competitors,deal_notes,
         stage,lost_reason,on_hold_review_date,client_id,kyc_agent,created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [oppId, value.opportunityName, value.companyName, value.contactPerson, value.email,
       value.phone, value.city, value.website, value.leadSource, value.vertical,
       value.natureOfBusiness, value.leadOwner, value.priority,
       value.expectedMonthlyVolume, value.expectedMonthlyRevenue,
       value.expectedCloseDate || null, value.decisionMaker,
       JSON.stringify(value.competitors), value.dealNotes,
       value.stage, value.lostReason, value.onHoldReviewDate || null,
       value.clientId || '', value.kycAgent || '', req.user.name]
    );
    await pool.query(
      'INSERT INTO stage_history (opportunity_id,stage,entered_at,note,changed_by) VALUES (?,?,?,?,?)',
      [oppId, value.stage, now, 'Opportunity created', req.user.name]
    );

    const [rows] = await pool.query('SELECT * FROM opportunities WHERE opportunity_id = ?', [oppId]);
    const [sh]   = await pool.query('SELECT * FROM stage_history WHERE opportunity_id = ? ORDER BY id ASC', [oppId]);
    created(res, { opportunity: transformOpportunity(rows[0], sh.map(transformStageHistory)) }, 'Opportunity created');
  } catch (err) { next(err); }
};

// GET /api/v1/opportunities/export
exports.exportCSV = async (req, res, next) => {
  try {
    const { where, params } = buildWhere(req.query, req.user);
    const [rows] = await pool.query(
      `SELECT o.* FROM opportunities o ${where} ORDER BY o.created_at DESC`, params
    );
    const data = rows.map(o => ({
      'Opportunity ID': o.opportunity_id, 'Name': o.opportunity_name,
      'Company': o.company_name, 'Contact': o.contact_person, 'Email': o.email,
      'Stage': o.stage, 'Priority': o.priority,
      'Monthly Volume': o.expected_monthly_volume, 'Monthly Revenue': o.expected_monthly_revenue,
      'Close Date': o.expected_close_date, 'Lead Owner': o.lead_owner,
      'Nature of Business': o.nature_of_business, 'Created': o.created_at,
    }));
    sendCSV(res, `opportunities-export-${new Date().toISOString().slice(0,10)}.csv`, data);
  } catch (err) { next(err); }
};

// GET /api/v1/opportunities/:id
exports.get = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM opportunities WHERE opportunity_id = ?', [req.params.id]);
    if (!rows.length) return notFound(res, 'Opportunity not found');
    const [sh]   = await pool.query('SELECT * FROM stage_history WHERE opportunity_id = ? ORDER BY id ASC', [req.params.id]);
    const [acts] = await pool.query(
      'SELECT * FROM activities WHERE entity_type = ? AND entity_id = ? ORDER BY date_time DESC',
      ['opportunity', req.params.id]
    );
    ok(res, {
      opportunity: transformOpportunity(rows[0], sh.map(transformStageHistory)),
      activities:  acts.map(transformActivity),
    });
  } catch (err) { next(err); }
};

// PUT /api/v1/opportunities/:id
exports.update = async (req, res, next) => {
  try {
    const { error, value } = oppSchema.validate(req.body);
    if (error) return badRequest(res, error.details[0].message);

    const [existing] = await pool.query('SELECT id FROM opportunities WHERE opportunity_id = ?', [req.params.id]);
    if (!existing.length) return notFound(res, 'Opportunity not found');

    await pool.query(
      `UPDATE opportunities SET opportunity_name=?,company_name=?,contact_person=?,email=?,
       phone=?,city=?,website=?,lead_source=?,vertical=?,nature_of_business=?,lead_owner=?,
       priority=?,expected_monthly_volume=?,expected_monthly_revenue=?,expected_close_date=?,
       decision_maker=?,competitors=?,deal_notes=?,lost_reason=?,on_hold_review_date=?,
       client_id=?,kyc_agent=?
       WHERE opportunity_id=?`,
      [value.opportunityName, value.companyName, value.contactPerson, value.email,
       value.phone, value.city, value.website, value.leadSource, value.vertical,
       value.natureOfBusiness, value.leadOwner, value.priority,
       value.expectedMonthlyVolume, value.expectedMonthlyRevenue,
       value.expectedCloseDate || null, value.decisionMaker,
       JSON.stringify(value.competitors), value.dealNotes,
       value.lostReason, value.onHoldReviewDate || null,
       value.clientId || '', value.kycAgent || '', req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM opportunities WHERE opportunity_id = ?', [req.params.id]);
    const [sh]   = await pool.query('SELECT * FROM stage_history WHERE opportunity_id = ? ORDER BY id ASC', [req.params.id]);
    ok(res, { opportunity: transformOpportunity(rows[0], sh.map(transformStageHistory)) });
  } catch (err) { next(err); }
};

// DELETE /api/v1/opportunities/:id
exports.remove = async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM opportunities WHERE opportunity_id = ?', [req.params.id]);
    if (!result.affectedRows) return notFound(res, 'Opportunity not found');
    await pool.query('DELETE FROM stage_history WHERE opportunity_id = ?', [req.params.id]);
    await pool.query('DELETE FROM activities WHERE entity_type = ? AND entity_id = ?', ['opportunity', req.params.id]);
    ok(res, {}, 'Opportunity deleted');
  } catch (err) { next(err); }
};

// PATCH /api/v1/opportunities/:id/stage
exports.moveStage = async (req, res, next) => {
  try {
    const { error, value } = Joi.object({
      stage:              Joi.string().valid('Prospecting','Won','Onboarded','Activated','Lost','On Hold').required(),
      note:               Joi.string().trim().allow('').default(''),
      lostReason:         Joi.string().trim().allow('').default(''),
      onHoldReviewDate:   Joi.date().iso().allow(null).default(null),
      clientId:           Joi.string().trim().allow('').default(''),
      kycAgent:           Joi.string().trim().allow('').default(''),
    }).validate(req.body);
    if (error) return badRequest(res, error.details[0].message);

    const [existing] = await pool.query('SELECT id FROM opportunities WHERE opportunity_id = ?', [req.params.id]);
    if (!existing.length) return notFound(res, 'Opportunity not found');

    const now = new Date();

    // Close the last open stage_history entry
    const [lastSH] = await pool.query(
      'SELECT id FROM stage_history WHERE opportunity_id = ? ORDER BY id DESC LIMIT 1',
      [req.params.id]
    );
    if (lastSH.length) {
      await pool.query('UPDATE stage_history SET exited_at = ? WHERE id = ?', [now, lastSH[0].id]);
    }

    await pool.query(
      'INSERT INTO stage_history (opportunity_id,stage,entered_at,note,changed_by) VALUES (?,?,?,?,?)',
      [req.params.id, value.stage, now, value.note, req.user.name]
    );

    const sets = ['stage = ?'];
    const params = [value.stage];
    if (value.lostReason)       { sets.push('lost_reason = ?');         params.push(value.lostReason); }
    if (value.onHoldReviewDate) { sets.push('on_hold_review_date = ?'); params.push(value.onHoldReviewDate); }
    if (value.clientId)         { sets.push('client_id = ?');           params.push(value.clientId); }
    if (value.kycAgent)         { sets.push('kyc_agent = ?');           params.push(value.kycAgent); }
    params.push(req.params.id);
    await pool.query(`UPDATE opportunities SET ${sets.join(', ')} WHERE opportunity_id = ?`, params);

    const [rows] = await pool.query('SELECT * FROM opportunities WHERE opportunity_id = ?', [req.params.id]);
    const [sh]   = await pool.query('SELECT * FROM stage_history WHERE opportunity_id = ? ORDER BY id ASC', [req.params.id]);
    ok(res, { opportunity: transformOpportunity(rows[0], sh.map(transformStageHistory)) }, 'Stage updated');
  } catch (err) { next(err); }
};
