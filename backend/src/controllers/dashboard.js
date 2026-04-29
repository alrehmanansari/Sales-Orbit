const Lead = require('../models/Lead');
const Opportunity = require('../models/Opportunity');
const Activity = require('../models/Activity');
const { ok } = require('../utils/response');

function dateRange(filter) {
  const now = new Date();
  let start;
  switch (filter) {
    case 'week':  start = new Date(now); start.setDate(now.getDate() - 7);  break;
    case 'month': start = new Date(now.getFullYear(), now.getMonth(), 1);   break;
    case 'quarter': {
      const q = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), q * 3, 1);
      break;
    }
    case 'year':  start = new Date(now.getFullYear(), 0, 1);                break;
    default:      start = null;
  }
  return start;
}

function userFilter(user) {
  return user.role === 'Rep' ? user.name : null;
}

// GET /api/v1/dashboard/stats
exports.stats = async (req, res, next) => {
  try {
    const owner = userFilter(req.user);
    const range = req.query.range || 'month';
    const since = dateRange(range);
    const dateFilter = since ? { $gte: since } : undefined;

    const leadFilter = owner ? { leadOwner: owner } : {};
    const oppFilter = owner ? { leadOwner: owner } : {};
    if (dateFilter) {
      leadFilter.createdAt = dateFilter;
      oppFilter.createdAt = dateFilter;
    }
    const actFilter = owner ? { loggedBy: owner } : {};
    if (dateFilter) actFilter.dateTime = dateFilter;

    const [
      totalLeads,
      convertedLeads,
      totalOpps,
      activeOpps,
      wonOpps,
      totalActivities,
      callActivities,
    ] = await Promise.all([
      Lead.countDocuments(leadFilter),
      Lead.countDocuments({ ...leadFilter, status: 'Converted' }),
      Opportunity.countDocuments(oppFilter),
      Opportunity.countDocuments({ ...oppFilter, stage: { $in: ['Prospecting', 'Won', 'Onboarded', 'Activated', 'On Hold'] } }),
      Opportunity.countDocuments({ ...oppFilter, stage: { $in: ['Won', 'Onboarded', 'Activated'] } }),
      Activity.countDocuments(actFilter),
      Activity.countDocuments({ ...actFilter, type: 'Call' }),
    ]);

    const revenueAgg = await Opportunity.aggregate([
      { $match: { ...oppFilter, stage: { $in: ['Won', 'Onboarded', 'Activated'] } } },
      { $group: { _id: null, total: { $sum: '$expectedMonthlyRevenue' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0.0';

    ok(res, {
      stats: {
        totalLeads,
        convertedLeads,
        conversionRate: parseFloat(conversionRate),
        totalOpportunities: totalOpps,
        activeOpportunities: activeOpps,
        wonOpportunities: wonOpps,
        totalRevenue,
        totalActivities,
        callActivities,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/dashboard/pipeline
exports.pipeline = async (req, res, next) => {
  try {
    const owner = userFilter(req.user);
    const matchFilter = owner ? { leadOwner: owner } : {};

    const stages = await Opportunity.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
          totalVolume: { $sum: '$expectedMonthlyVolume' },
          totalRevenue: { $sum: '$expectedMonthlyRevenue' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    ok(res, { pipeline: stages });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/dashboard/leaderboard
exports.leaderboard = async (req, res, next) => {
  try {
    const range = req.query.range || 'month';
    const since = dateRange(range);
    const dateFilter = since ? { createdAt: { $gte: since } } : {};

    const [leadsByOwner, oppsByOwner, actsByOwner] = await Promise.all([
      Lead.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$leadOwner', leads: { $sum: 1 }, converted: { $sum: { $cond: [{ $eq: ['$status', 'Converted'] }, 1, 0] } } } },
      ]),
      Opportunity.aggregate([
        { $match: { ...dateFilter, stage: { $in: ['Won', 'Onboarded', 'Activated'] } } },
        { $group: { _id: '$leadOwner', won: { $sum: 1 }, revenue: { $sum: '$expectedMonthlyRevenue' } } },
      ]),
      Activity.aggregate([
        { $match: since ? { dateTime: { $gte: since } } : {} },
        { $group: { _id: '$loggedBy', activities: { $sum: 1 } } },
      ]),
    ]);

    const map = {};
    leadsByOwner.forEach(r => { map[r._id] = { name: r._id, leads: r.leads, converted: r.converted }; });
    oppsByOwner.forEach(r => { if (!map[r._id]) map[r._id] = { name: r._id }; Object.assign(map[r._id], { won: r.won, revenue: r.revenue }); });
    actsByOwner.forEach(r => { if (!map[r._id]) map[r._id] = { name: r._id }; map[r._id].activities = r.activities; });

    const leaderboard = Object.values(map).map(r => ({
      name: r.name || '',
      leads: r.leads || 0,
      converted: r.converted || 0,
      won: r.won || 0,
      revenue: r.revenue || 0,
      activities: r.activities || 0,
    })).sort((a, b) => b.revenue - a.revenue);

    ok(res, { leaderboard });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/dashboard/activity-breakdown
exports.activityBreakdown = async (req, res, next) => {
  try {
    const owner = userFilter(req.user);
    const range = req.query.range || 'month';
    const since = dateRange(range);
    const matchFilter = {};
    if (owner) matchFilter.loggedBy = owner;
    if (since) matchFilter.dateTime = { $gte: since };

    const [byType, byOutcome, byCallType, daily] = await Promise.all([
      Activity.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      Activity.aggregate([
        { $match: { ...matchFilter, type: 'Call', callOutcome: { $ne: '' } } },
        { $group: { _id: '$callOutcome', count: { $sum: 1 } } },
      ]),
      Activity.aggregate([
        { $match: { ...matchFilter, type: 'Call', callType: { $ne: '' } } },
        { $group: { _id: '$callType', count: { $sum: 1 } } },
      ]),
      Activity.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$dateTime' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
    ]);

    ok(res, { byType, byOutcome, byCallType, daily });
  } catch (err) {
    next(err);
  }
};
