const pool = require('../config/db');
const { ok } = require('../utils/response');

function sinceDate(range) {
  const now = new Date();
  switch (range) {
    case 'week':    { const d = new Date(now); d.setDate(now.getDate() - 7); return d; }
    case 'month':   return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'quarter': { const q = Math.floor(now.getMonth() / 3); return new Date(now.getFullYear(), q * 3, 1); }
    case 'year':    return new Date(now.getFullYear(), 0, 1);
    default:        return null;
  }
}

function dateClause(field, since) {
  return since ? `AND ${field} >= '${since.toISOString().slice(0,19).replace('T',' ')}'` : '';
}

// GET /api/v1/dashboard/stats
exports.stats = async (req, res, next) => {
  try {
    const since = sinceDate(req.query.range || 'month');
    const ownerClause = req.user.role === 'Rep' ? `AND lead_owner = '${req.user.name}'` : '';
    const dc = dateClause('created_at', since);
    const adc = dateClause('date_time', since);

    const [[lStats]] = await pool.query(
      `SELECT
         COUNT(*) AS total,
         SUM(status = 'Converted') AS converted
       FROM leads WHERE 1=1 ${ownerClause} ${dc}`
    );
    const [[oStats]] = await pool.query(
      `SELECT
         COUNT(*) AS total,
         SUM(stage NOT IN ('Lost')) AS active,
         SUM(stage IN ('Won','Onboarded','Activated')) AS won,
         COALESCE(SUM(CASE WHEN stage IN ('Won','Onboarded','Activated') THEN expected_monthly_revenue ELSE 0 END),0) AS revenue
       FROM opportunities WHERE 1=1 ${ownerClause} ${dc}`
    );
    const [[aStats]] = await pool.query(
      `SELECT COUNT(*) AS total, SUM(type='Call') AS calls
       FROM activities WHERE 1=1 ${req.user.role === 'Rep' ? `AND logged_by = '${req.user.name}'` : ''} ${adc}`
    );

    const convRate = lStats.total > 0
      ? parseFloat(((lStats.converted / lStats.total) * 100).toFixed(1)) : 0;

    ok(res, { stats: {
      totalLeads:           lStats.total,
      convertedLeads:       lStats.converted,
      conversionRate:       convRate,
      totalOpportunities:   oStats.total,
      activeOpportunities:  oStats.active,
      wonOpportunities:     oStats.won,
      totalRevenue:         parseFloat(oStats.revenue) || 0,
      totalActivities:      aStats.total,
      callActivities:       aStats.calls,
    }});
  } catch (err) { next(err); }
};

// GET /api/v1/dashboard/pipeline
exports.pipeline = async (req, res, next) => {
  try {
    const ownerClause = req.user.role === 'Rep' ? `WHERE lead_owner = '${req.user.name}'` : '';
    const [rows] = await pool.query(
      `SELECT stage,
              COUNT(*) AS count,
              COALESCE(SUM(expected_monthly_volume),0)  AS totalVolume,
              COALESCE(SUM(expected_monthly_revenue),0) AS totalRevenue
       FROM opportunities ${ownerClause}
       GROUP BY stage ORDER BY stage`
    );
    ok(res, { pipeline: rows.map(r => ({
      _id: r.stage, count: r.count,
      totalVolume:  parseFloat(r.totalVolume),
      totalRevenue: parseFloat(r.totalRevenue),
    }))});
  } catch (err) { next(err); }
};

// GET /api/v1/dashboard/leaderboard
exports.leaderboard = async (req, res, next) => {
  try {
    const since = sinceDate(req.query.range || 'month');
    const dc  = dateClause('created_at', since);
    const adc = dateClause('date_time', since);

    const [byLead] = await pool.query(
      `SELECT lead_owner AS name,
              COUNT(*) AS leads,
              SUM(status='Converted') AS converted
       FROM leads WHERE 1=1 ${dc}
       GROUP BY lead_owner`
    );
    const [byOpp] = await pool.query(
      `SELECT lead_owner AS name,
              SUM(stage IN ('Won','Onboarded','Activated')) AS won,
              COALESCE(SUM(CASE WHEN stage IN ('Won','Onboarded','Activated') THEN expected_monthly_revenue ELSE 0 END),0) AS revenue
       FROM opportunities WHERE 1=1 ${dc}
       GROUP BY lead_owner`
    );
    const [byAct] = await pool.query(
      `SELECT logged_by AS name, COUNT(*) AS activities
       FROM activities WHERE 1=1 ${adc}
       GROUP BY logged_by`
    );

    const map = {};
    byLead.forEach(r => { map[r.name] = { name: r.name, leads: r.leads, converted: r.converted }; });
    byOpp.forEach(r  => {
      if (!map[r.name]) map[r.name] = { name: r.name };
      Object.assign(map[r.name], { won: r.won, revenue: parseFloat(r.revenue) });
    });
    byAct.forEach(r  => {
      if (!map[r.name]) map[r.name] = { name: r.name };
      map[r.name].activities = r.activities;
    });

    const leaderboard = Object.values(map).map(r => ({
      name:       r.name       || '',
      leads:      r.leads      || 0,
      converted:  r.converted  || 0,
      won:        r.won        || 0,
      revenue:    r.revenue    || 0,
      activities: r.activities || 0,
    })).sort((a, b) => b.revenue - a.revenue);

    ok(res, { leaderboard });
  } catch (err) { next(err); }
};

// GET /api/v1/dashboard/activity-breakdown
exports.activityBreakdown = async (req, res, next) => {
  try {
    const since = sinceDate(req.query.range || 'month');
    const ownerClause = req.user.role === 'Rep' ? `AND logged_by = '${req.user.name}'` : '';
    const adc = dateClause('date_time', since);
    const base = `FROM activities WHERE 1=1 ${ownerClause} ${adc}`;

    const [byType]     = await pool.query(`SELECT type AS _id, COUNT(*) AS count ${base} GROUP BY type`);
    const [byOutcome]  = await pool.query(
      `SELECT call_outcome AS _id, COUNT(*) AS count ${base} AND type='Call' AND call_outcome != '' GROUP BY call_outcome`
    );
    const [byCallType] = await pool.query(
      `SELECT call_type AS _id, COUNT(*) AS count ${base} AND type='Call' AND call_type != '' GROUP BY call_type`
    );
    const [daily] = await pool.query(
      `SELECT DATE_FORMAT(date_time,'%Y-%m-%d') AS _id, COUNT(*) AS count
       ${base} GROUP BY DATE_FORMAT(date_time,'%Y-%m-%d') ORDER BY _id DESC LIMIT 30`
    );

    ok(res, { byType, byOutcome, byCallType, daily: daily.reverse() });
  } catch (err) { next(err); }
};
