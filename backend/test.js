// Quick integration test — run with: node backend/test.js
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const BASE = `http://localhost:${process.env.PORT || 5001}/api/v1`;

async function req(method, path, body, token) {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json();
}

async function run() {
  let passed = 0, failed = 0;
  function check(label, cond, detail = '') {
    if (cond) { console.log(`  ✓  ${label}`); passed++; }
    else       { console.log(`  ✗  ${label}${detail ? '  →  ' + detail : ''}`); failed++; }
  }

  console.log('\n═══ SalesOrbit API Integration Test ═══\n');

  // ── Auth ──────────────────────────────────────────────────────────────────
  console.log('AUTH');
  const login = await req('POST', '/auth/login', { email: 'alice@salesorbit.io' });
  check('login returns OTP',   !!login.otp, JSON.stringify(login));

  const verify = await req('POST', '/auth/verify-otp', { email: 'alice@salesorbit.io', otp: login.otp });
  check('verify-otp returns JWT',  !!verify.token, JSON.stringify(verify).slice(0, 120));
  check('verify-otp returns user', verify.user?.name === 'Alice Johnson');

  const T = verify.token;

  const me = await req('GET', '/auth/me', null, T);
  check('/auth/me returns user', me.user?.role === 'Manager');

  // ── Users ─────────────────────────────────────────────────────────────────
  console.log('\nUSERS');
  const users = await req('GET', '/users', null, T);
  check('list users', users.total >= 4, `total=${users.total}`);

  // ── Leads ─────────────────────────────────────────────────────────────────
  console.log('\nLEADS');
  const leads = await req('GET', '/leads', null, T);
  check('list leads',  leads.total >= 5, `total=${leads.total}`);

  const newLead = await req('POST', '/leads', {
    contactPerson: 'Jane Test', companyName: 'Acme Ltd',
    email: 'jane@acme.com', priority: 'Hot', status: 'New',
  }, T);
  check('create lead', !!newLead.lead?.id, JSON.stringify(newLead).slice(0, 120));
  const leadId = newLead.lead?.id;

  const updLead = await req('PUT', `/leads/${leadId}`, {
    contactPerson: 'Jane Updated', companyName: 'Acme Ltd',
    email: 'jane@acme.com', priority: 'Warm', status: 'Contacted',
  }, T);
  check('update lead', updLead.lead?.priority === 'Warm', JSON.stringify(updLead).slice(0, 120));

  // ── Activities ────────────────────────────────────────────────────────────
  console.log('\nACTIVITIES');
  const newAct = await req('POST', '/activities', {
    entityType: 'lead', entityId: leadId, type: 'Call',
    callType: 'Discovery Call', callOutcome: 'Connected – Interested',
    dateTime: new Date().toISOString(), notes: 'Test call log',
  }, T);
  check('create activity', !!newAct.activity?.id, JSON.stringify(newAct).slice(0, 120));

  const actList = await req('GET', '/activities', null, T);
  check('list activities', actList.total >= 1, `total=${actList.total}`);

  const byEntity = await req('GET', `/activities/entity/lead/${leadId}`, null, T);
  check('activities by entity', byEntity.total >= 1);

  // ── Opportunities ─────────────────────────────────────────────────────────
  console.log('\nOPPORTUNITIES');
  const opps = await req('GET', '/opportunities', null, T);
  check('list opportunities',         opps.total >= 2, `total=${opps.total}`);
  check('stageHistory in list',       Array.isArray(opps.opportunities?.[0]?.stageHistory));

  const newOpp = await req('POST', '/opportunities', {
    opportunityName: 'Test Deal', companyName: 'Acme Ltd',
    leadOwner: 'Alice Johnson', priority: 'Hot',
    expectedMonthlyVolume: 100000, expectedMonthlyRevenue: 5000,
    stage: 'Prospecting',
  }, T);
  check('create opportunity',         !!newOpp.opportunity?.id, JSON.stringify(newOpp).slice(0, 120));
  check('initial stageHistory added', newOpp.opportunity?.stageHistory?.length === 1);
  const oppId = newOpp.opportunity?.id;

  const moved = await req('PATCH', `/opportunities/${oppId}/stage`, {
    stage: 'Won', note: 'Contract signed',
  }, T);
  check('move stage to Won',          moved.opportunity?.stage === 'Won', JSON.stringify(moved).slice(0, 120));
  check('stageHistory grows to 2',    moved.opportunity?.stageHistory?.length === 2);

  // ── Convert lead ──────────────────────────────────────────────────────────
  console.log('\nCONVERT');
  const conv = await req('POST', `/leads/${leadId}/convert`, {
    opportunityName: 'Acme Ltd – Converted Deal',
    expectedMonthlyVolume: 50000, expectedMonthlyRevenue: 2500,
    expectedCloseDate: '2026-07-01', decisionMaker: 'Jane Updated',
  }, T);
  check('convert lead',               conv.lead?.status === 'Converted', JSON.stringify(conv).slice(0, 120));
  check('opportunity created',        !!conv.opportunity?.id);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  console.log('\nKPIS');
  const kpis = await req('GET', '/kpis?year=2026', null, T);
  check('list KPIs', kpis.kpis?.length >= 12, `count=${kpis.kpis?.length}`);

  const kpiUpsert = await req('PUT', '/kpis', { kpis: [{
    userId: 'USR-1001', userName: 'Alice Johnson',
    quarter: 'Q2', year: 2026,
    tcTarget: 60, tcAch: 25, acTarget: 12, acAch: 6,
  }]}, T);
  check('upsert KPI', kpiUpsert.success === true, JSON.stringify(kpiUpsert));

  const kpisAfter = await req('GET', '/kpis/USR-1001?year=2026', null, T);
  check('KPI updated value', kpisAfter.kpis?.find(k => k.quarter === 'Q2')?.tcAch === 25);

  // ── Dashboard ─────────────────────────────────────────────────────────────
  console.log('\nDASHBOARD');
  const stats = await req('GET', '/dashboard/stats?range=year', null, T);
  check('stats endpoint',     stats.stats?.totalLeads > 0, JSON.stringify(stats.stats));

  const pipe = await req('GET', '/dashboard/pipeline', null, T);
  check('pipeline endpoint',  pipe.pipeline?.length > 0, `stages=${pipe.pipeline?.length}`);

  const lb = await req('GET', '/dashboard/leaderboard?range=year', null, T);
  check('leaderboard',        lb.leaderboard?.length > 0);

  const ab = await req('GET', '/dashboard/activity-breakdown?range=year', null, T);
  check('activity breakdown', Array.isArray(ab.byType));

  // ── Cleanup ───────────────────────────────────────────────────────────────
  console.log('\nCLEANUP');
  const delLead = await req('DELETE', `/leads/${leadId}`, null, T);
  check('delete lead', delLead.success === true);

  const delOpp = await req('DELETE', `/opportunities/${oppId}`, null, T);
  check('delete opportunity', delOpp.success === true);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(42)}`);
  console.log(`  ${passed} passed   ${failed} failed   ${passed + failed} total`);
  console.log('═'.repeat(42) + '\n');
  if (failed > 0) process.exit(1);
}

run().catch(e => { console.error('Test runner error:', e.message); process.exit(1); });
