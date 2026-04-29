// Map MySQL snake_case rows → camelCase JSON that the frontend expects

function parseJSON(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'object') return val; // already parsed by mysql2
  try { return JSON.parse(val); } catch { return fallback; }
}

function transformUser(row) {
  return {
    userId:      row.user_id,
    firstName:   row.first_name,
    lastName:    row.last_name,
    name:        `${row.first_name} ${row.last_name}`,
    email:       row.email,
    designation: row.designation,
    role:        row.role,
    isActive:    row.is_active === 1,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  };
}

function transformLead(row) {
  return {
    id:                row.lead_id,
    leadId:            row.lead_id,
    contactPerson:     row.contact_person,
    companyName:       row.company_name,
    website:           row.website        || '',
    email:             row.email          || '',
    phone:             row.phone          || '',
    city:              row.city           || '',
    leadSource:        row.lead_source    || '',
    leadSourceOther:   row.lead_source_other || '',
    vertical:          row.vertical       || '',
    natureOfBusiness:  row.nature_of_business || '',
    leadOwner:         row.lead_owner     || '',
    priority:          row.priority,
    notes:             row.notes          || '',
    status:            row.status,
    createdBy:         row.created_by     || '',
    convertedAt:       row.converted_at   || null,
    opportunityId:     row.opportunity_id || null,
    lastActivityAt:    row.last_activity_at || null,
    createdAt:         row.created_at,
    updatedAt:         row.updated_at,
  };
}

function transformStageHistory(row) {
  return {
    stage:      row.stage,
    enteredAt:  row.entered_at,
    exitedAt:   row.exited_at  || null,
    note:       row.note       || '',
    changedBy:  row.changed_by || '',
  };
}

function transformOpportunity(row, stageHistory = []) {
  return {
    id:                      row.opportunity_id,
    opportunityId:           row.opportunity_id,
    leadId:                  row.lead_id || null,
    opportunityName:         row.opportunity_name,
    companyName:             row.company_name,
    contactPerson:           row.contact_person  || '',
    email:                   row.email            || '',
    phone:                   row.phone            || '',
    city:                    row.city             || '',
    website:                 row.website          || '',
    leadSource:              row.lead_source      || '',
    vertical:                row.vertical         || '',
    natureOfBusiness:        row.nature_of_business || '',
    leadOwner:               row.lead_owner       || '',
    priority:                row.priority,
    expectedMonthlyVolume:   parseFloat(row.expected_monthly_volume)  || 0,
    expectedMonthlyRevenue:  parseFloat(row.expected_monthly_revenue) || 0,
    expectedCloseDate:       row.expected_close_date  || null,
    decisionMaker:           row.decision_maker   || '',
    competitors:             parseJSON(row.competitors, []),
    dealNotes:               row.deal_notes        || '',
    stage:                   row.stage,
    lostReason:              row.lost_reason       || '',
    onHoldReviewDate:        row.on_hold_review_date || null,
    createdBy:               row.created_by        || '',
    stageHistory,
    createdAt:               row.created_at,
    updatedAt:               row.updated_at,
  };
}

function transformActivity(row) {
  return {
    id:                row.activity_id,
    activityId:        row.activity_id,
    entityType:        row.entity_type,
    entityId:          row.entity_id,
    type:              row.type,
    callType:          row.call_type     || '',
    callOutcome:       row.call_outcome  || '',
    dateTime:          row.date_time,
    nextFollowUpDate:  row.next_follow_up_date || null,
    notes:             row.notes         || '',
    loggedBy:          row.logged_by     || '',
    createdAt:         row.created_at,
  };
}

function transformKpi(row) {
  return {
    userId:   row.user_id,
    userName: row.user_name,
    quarter:  row.quarter,
    year:     row.year,
    tcTarget: row.tc_target,
    tcAch:    row.tc_ach,
    acTarget: row.ac_target,
    acAch:    row.ac_ach,
    score:    calcScore(row),
  };
}

function calcScore(row) {
  const tc = row.tc_target > 0 ? (row.tc_ach / row.tc_target) * 70 : 0;
  const ac = row.ac_target > 0 ? (row.ac_ach / row.ac_target) * 30 : 0;
  return Math.min(100, Math.round(tc + ac));
}

module.exports = {
  transformUser,
  transformLead,
  transformOpportunity,
  transformStageHistory,
  transformActivity,
  transformKpi,
  parseJSON,
};
