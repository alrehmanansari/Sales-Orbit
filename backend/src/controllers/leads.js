const Joi = require('joi');
const pool = require('../config/db');
const { ok, created, badRequest, notFound } = require('../utils/response');
const { sendCSV } = require('../utils/csvExport');
const { transformLead, transformOpportunity, transformStageHistory } = require('../utils/transform');

const SAFE_SORT = {
  '-createdAt': 'created_at DESC', 'createdAt': 'created_at ASC',
  '-companyName': 'company_name DESC', 'companyName': 'company_name ASC',
  '-priority': 'priority DESC', 'priority': 'priority ASC',
  '-status': 'status DESC', 'status': 'status ASC',
};

const leadSchema = Joi.object({
  contactPerson:    Joi.string().trim().min(1).max(100).required(),
  companyName:      Joi.string().trim().min(1).max(200).required(),
  website:          Joi.string().trim().allow('').max(200).default(''),
  email:            Joi.string().email().lowercase().allow('').default(''),
  phone:            Joi.string().trim().allow('').max(30).default(''),
  city:             Joi.string().trim().allow('').max(100).default(''),
  leadSource:       Joi.string().trim().allow('').default(''),
  leadSourceOther:  Joi.string().trim().allow('').default(''),
  vertical:         Joi.string().trim().allow('').default(''),
  natureOfBusiness: Joi.string().trim().allow('').default(''),
  leadOwner:        Joi.string().trim().allow('').default(''),
  priority:         Joi.string().valid('Hot','Warm','Cold').default('Cold'),
  notes:            Joi.string().trim().allow('').default(''),
  status:           Joi.string().valid('New','Contacted','Qualified','Converted','Lost').default('New'),
});

function genLeadId() {
  const d = new Date().toISOString().slice(0,10).replace(/-/g,'');
  return `LD-${d}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function buildWhere(query, user) {
  const conds = [], params = [];
  if (user.role === 'Rep') { conds.push('lead_owner = ?'); params.push(user.name); }
  if (query.status)   { conds.push('status = ?');    params.push(query.status); }
  if (query.priority) { conds.push('priority = ?');  params.push(query.priority); }
  if (query.owner)    { conds.push('lead_owner = ?');params.push(query.owner); }
  if (query.vertical) { conds.push('vertical = ?');  params.push(query.vertical); }
  if (query.search) {
    const s = `%${query.search}%`;
    conds.push('(contact_person LIKE ? OR company_name LIKE ? OR email LIKE ?)');
    params.push(s, s, s);
  }
  return { where: conds.length ? 'WHERE ' + conds.join(' AND ') : '', params };
}

// GET /api/v1/leads
exports.list = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const offset = (page - 1) * limit;
    const sort = SAFE_SORT[req.query.sortBy] || 'created_at DESC';
    const { where, params } = buildWhere(req.query, req.user);

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM leads ${where}`, params);
    const [rows] = await pool.query(
      `SELECT * FROM leads ${where} ORDER BY ${sort} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    ok(res, { leads: rows.map(transformLead), total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// POST /api/v1/leads
exports.create = async (req, res, next) => {
  try {
    const { error, value } = leadSchema.validate(req.body);
    if (error) return badRequest(res, error.details[0].message);

    const leadId = genLeadId();
    await pool.query(
      `INSERT INTO leads
        (lead_id,contact_person,company_name,website,email,phone,city,lead_source,
         lead_source_other,vertical,nature_of_business,lead_owner,priority,notes,status,created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [leadId, value.contactPerson, value.companyName, value.website, value.email,
       value.phone, value.city, value.leadSource, value.leadSourceOther, value.vertical,
       value.natureOfBusiness, value.leadOwner, value.priority, value.notes,
       value.status, req.user.name]
    );
    const [rows] = await pool.query('SELECT * FROM leads WHERE lead_id = ?', [leadId]);
    created(res, { lead: transformLead(rows[0]) }, 'Lead created');
  } catch (err) { next(err); }
};

// GET /api/v1/leads/export
exports.exportCSV = async (req, res, next) => {
  try {
    const { where, params } = buildWhere(req.query, req.user);
    const [rows] = await pool.query(`SELECT * FROM leads ${where} ORDER BY created_at DESC`, params);
    const data = rows.map(l => ({
      'Lead ID': l.lead_id, 'Contact Person': l.contact_person, 'Company': l.company_name,
      'Email': l.email, 'Phone': l.phone, 'City': l.city, 'Lead Source': l.lead_source,
      'Vertical': l.vertical, 'Nature of Business': l.nature_of_business,
      'Lead Owner': l.lead_owner, 'Priority': l.priority, 'Status': l.status,
      'Notes': l.notes, 'Created': l.created_at,
    }));
    sendCSV(res, `leads-export-${new Date().toISOString().slice(0,10)}.csv`, data);
  } catch (err) { next(err); }
};

// GET /api/v1/leads/:id
exports.get = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM leads WHERE lead_id = ?', [req.params.id]);
    if (!rows.length) return notFound(res, 'Lead not found');
    const [acts] = await pool.query(
      'SELECT * FROM activities WHERE entity_type = ? AND entity_id = ? ORDER BY date_time DESC',
      ['lead', req.params.id]
    );
    ok(res, { lead: transformLead(rows[0]), activities: acts.map(a => require('./activities')._transform(a)) });
  } catch (err) { next(err); }
};

// PUT /api/v1/leads/:id
exports.update = async (req, res, next) => {
  try {
    const { error, value } = leadSchema.validate(req.body);
    if (error) return badRequest(res, error.details[0].message);

    const [existing] = await pool.query('SELECT id FROM leads WHERE lead_id = ?', [req.params.id]);
    if (!existing.length) return notFound(res, 'Lead not found');

    await pool.query(
      `UPDATE leads SET contact_person=?,company_name=?,website=?,email=?,phone=?,city=?,
       lead_source=?,lead_source_other=?,vertical=?,nature_of_business=?,lead_owner=?,
       priority=?,notes=?,status=? WHERE lead_id=?`,
      [value.contactPerson, value.companyName, value.website, value.email, value.phone,
       value.city, value.leadSource, value.leadSourceOther, value.vertical,
       value.natureOfBusiness, value.leadOwner, value.priority, value.notes,
       value.status, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM leads WHERE lead_id = ?', [req.params.id]);
    ok(res, { lead: transformLead(rows[0]) });
  } catch (err) { next(err); }
};

// DELETE /api/v1/leads/:id
exports.remove = async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM leads WHERE lead_id = ?', [req.params.id]);
    if (!result.affectedRows) return notFound(res, 'Lead not found');
    await pool.query('DELETE FROM activities WHERE entity_type = ? AND entity_id = ?', ['lead', req.params.id]);
    ok(res, {}, 'Lead deleted');
  } catch (err) { next(err); }
};

// POST /api/v1/leads/bulk
exports.bulkImport = async (req, res, next) => {
  try {
    const rows = req.body.leads;
    if (!Array.isArray(rows) || !rows.length) return badRequest(res, 'leads array is required');

    const emails = rows.map(r => r.email?.toLowerCase()).filter(Boolean);
    let existingEmails = new Set();
    if (emails.length) {
      const [existing] = await pool.query('SELECT email FROM leads WHERE email IN (?)', [emails]);
      existing.forEach(e => existingEmails.add(e.email));
    }

    let inserted = 0; const skipped = [];
    for (const row of rows) {
      const { error, value } = leadSchema.validate(row, { abortEarly: false });
      if (error) { skipped.push({ row, reason: error.details.map(d => d.message).join(', ') }); continue; }
      if (value.email && existingEmails.has(value.email)) { skipped.push({ row, reason: 'Duplicate email' }); continue; }
      const leadId = genLeadId();
      await pool.query(
        `INSERT INTO leads (lead_id,contact_person,company_name,website,email,phone,city,
         lead_source,lead_source_other,vertical,nature_of_business,lead_owner,priority,notes,status,created_by)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [leadId, value.contactPerson, value.companyName, value.website, value.email,
         value.phone, value.city, value.leadSource, value.leadSourceOther, value.vertical,
         value.natureOfBusiness, value.leadOwner, value.priority, value.notes,
         value.status, req.user.name]
      );
      inserted++;
    }
    ok(res, { inserted, skipped: skipped.length, skippedRows: skipped });
  } catch (err) { next(err); }
};

// POST /api/v1/leads/:id/convert
exports.convert = async (req, res, next) => {
  try {
    const [leadRows] = await pool.query('SELECT * FROM leads WHERE lead_id = ?', [req.params.id]);
    if (!leadRows.length) return notFound(res, 'Lead not found');
    const lead = leadRows[0];
    if (lead.status === 'Converted') return badRequest(res, 'Lead already converted');

    const { error, value } = Joi.object({
      opportunityName:        Joi.string().trim().min(1).required(),
      expectedMonthlyVolume:  Joi.number().min(0).default(0),
      expectedMonthlyRevenue: Joi.number().min(0).default(0),
      expectedCloseDate:      Joi.date().iso().allow(null).default(null),
      decisionMaker:          Joi.string().trim().allow('').default(''),
      dealNotes:              Joi.string().trim().allow('').default(''),
    }).validate(req.body);
    if (error) return badRequest(res, error.details[0].message);

    const d = new Date().toISOString().slice(0,10).replace(/-/g,'');
    const oppId = `OPP-${d}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();

    await pool.query(
      `INSERT INTO opportunities
        (opportunity_id,lead_id,opportunity_name,company_name,contact_person,email,phone,city,
         website,lead_source,vertical,nature_of_business,lead_owner,priority,
         expected_monthly_volume,expected_monthly_revenue,expected_close_date,
         decision_maker,deal_notes,stage,created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [oppId, lead.lead_id, value.opportunityName, lead.company_name, lead.contact_person,
       lead.email, lead.phone, lead.city, lead.website, lead.lead_source, lead.vertical,
       lead.nature_of_business, lead.lead_owner, lead.priority,
       value.expectedMonthlyVolume, value.expectedMonthlyRevenue,
       value.expectedCloseDate || null, value.decisionMaker, value.dealNotes,
       'Prospecting', req.user.name]
    );
    await pool.query(
      'INSERT INTO stage_history (opportunity_id,stage,entered_at,note,changed_by) VALUES (?,?,?,?,?)',
      [oppId, 'Prospecting', now, 'Opportunity created from lead', req.user.name]
    );
    await pool.query(
      'UPDATE leads SET status=?, converted_at=?, opportunity_id=? WHERE lead_id=?',
      ['Converted', now, oppId, lead.lead_id]
    );

    const [oppRows] = await pool.query('SELECT * FROM opportunities WHERE opportunity_id = ?', [oppId]);
    const [shRows]  = await pool.query('SELECT * FROM stage_history WHERE opportunity_id = ? ORDER BY id ASC', [oppId]);
    const [updLead] = await pool.query('SELECT * FROM leads WHERE lead_id = ?', [lead.lead_id]);

    ok(res, {
      lead:        transformLead(updLead[0]),
      opportunity: transformOpportunity(oppRows[0], shRows.map(transformStageHistory)),
    }, 'Lead converted to opportunity');
  } catch (err) { next(err); }
};
