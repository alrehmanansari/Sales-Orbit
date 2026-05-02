require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../src/config/db');

const TEAM = [
  { userId: 'USR-1001', firstName: 'Alice', lastName: 'Johnson', email: 'alice@salesorbit.io', designation: 'Head of Sales',  role: 'Manager' },
  { userId: 'USR-1002', firstName: 'Bob',   lastName: 'Martinez',email: 'bob@salesorbit.io',   designation: 'Sales Rep',      role: 'Rep' },
  { userId: 'USR-1003', firstName: 'Clara', lastName: 'Singh',   email: 'clara@salesorbit.io', designation: 'Sales Rep',      role: 'Rep' },
  { userId: 'USR-1004', firstName: 'David', lastName: 'Kim',     email: 'david@salesorbit.io', designation: 'Sales Rep',      role: 'Rep' },
];

async function run() {
  console.log('Seeding database…\n');

  // Clear all tables (works on both MySQL and SQLite)
  for (const t of ['kpis','activities','stage_history','opportunities','leads','otps','users']) {
    await pool.query(`DELETE FROM ${t}`);
  }
  console.log('Cleared existing data');

  // ── Users ──────────────────────────────────────────────────────────────────
  for (const u of TEAM) {
    await pool.query(
      'INSERT INTO users (user_id, first_name, last_name, email, designation, role) VALUES (?,?,?,?,?,?)',
      [u.userId, u.firstName, u.lastName, u.email, u.designation, u.role]
    );
  }
  console.log(`Created ${TEAM.length} users`);

  // ── Leads ──────────────────────────────────────────────────────────────────
  const leads = [
    ['LD-20260218-1001','Sarah Mitchell','NexaTech Solutions','nexatech.io','sarah@nexatech.io','5551234567','New York','Cold Outreach','IT Services','IT Services','Alice Johnson','Hot','Interested in cross-border payments','Qualified','Alice Johnson'],
    ['LD-20260301-1002','James Wei','CloudBridge Inc','cloudbridge.com','james@cloudbridge.com','5559876543','San Francisco','Customer Referral','B2B Seller','Software Development','Bob Martinez','Warm','','Contacted','Bob Martinez'],
    ['LD-20260310-1003','Priya Kapoor','TradeLink B2B','tradelink.in','priya@tradelink.in','5554445555','Mumbai','Customer Referral','B2B Seller','B2B Goods','Clara Singh','Hot','High volume FX requirements','Qualified','Clara Singh'],
    ['LD-20260416-1004','Liam Chen','CloudStack Systems','cloudstack.dev','liam@cloudstack.dev','5557778888','Singapore','Trade Show/Event','IT Services','IT Services','David Kim','Cold','Met at SaaS Expo','New','David Kim'],
    ['LD-20260418-1005','Amina Hassan','Zarif Logistics','zarif.ae','amina@zarif.ae','5553332222','Dubai','Online Directory','B2B Seller','Logistics','Alice Johnson','Hot','Fleet of 200+ drivers','Qualified','Alice Johnson'],
  ];
  for (const l of leads) {
    await pool.query(
      `INSERT INTO leads (lead_id,contact_person,company_name,website,email,phone,city,
       lead_source,vertical,nature_of_business,lead_owner,priority,notes,status,created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, l
    );
  }
  console.log(`Created ${leads.length} leads`);

  // ── Opportunities ──────────────────────────────────────────────────────────
  await pool.query(
    `INSERT INTO opportunities
      (opportunity_id,lead_id,opportunity_name,company_name,contact_person,email,phone,city,
       lead_source,vertical,nature_of_business,lead_owner,priority,
       expected_monthly_volume,expected_monthly_revenue,expected_close_date,
       decision_maker,competitors,deal_notes,stage,created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ['OPP-20260220-1001','LD-20260218-1001','NexaTech Solutions – IT Services',
     'NexaTech Solutions','Sarah Mitchell','sarah@nexatech.io','5551234567','New York',
     'Cold Outreach','IT Services','IT Services','Alice Johnson','Hot',
     250000, 12500, '2026-05-12', 'Sarah Mitchell',
     JSON.stringify(['Payoneer','Wise']), 'Strong interest, budget confirmed', 'Onboarded', 'Alice Johnson']
  );
  await pool.query(
    `INSERT INTO opportunities
      (opportunity_id,lead_id,opportunity_name,company_name,contact_person,email,phone,city,
       lead_source,vertical,nature_of_business,lead_owner,priority,
       expected_monthly_volume,expected_monthly_revenue,expected_close_date,
       decision_maker,competitors,deal_notes,stage,created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ['OPP-20260310-1002','LD-20260310-1003','TradeLink B2B – B2B Seller',
     'TradeLink B2B','Priya Kapoor','priya@tradelink.in','5554445555','Mumbai',
     'Customer Referral','B2B Seller','B2B Goods','Clara Singh','Hot',
     500000, 25000, '2026-06-01', 'Priya Kapoor',
     JSON.stringify(['Airwallex','Payoneer']), 'Large deal, needs exec approval', 'Activated', 'Clara Singh']
  );
  console.log('Created 2 opportunities');

  // ── Stage history ──────────────────────────────────────────────────────────
  const stageHistory = [
    ['OPP-20260220-1001','Prospecting','2026-02-20 00:00:00','2026-02-26 00:00:00','Opportunity created from lead','Alice Johnson'],
    ['OPP-20260220-1001','Won',        '2026-02-26 00:00:00','2026-03-05 00:00:00','Account registered','Alice Johnson'],
    ['OPP-20260220-1001','Onboarded',  '2026-03-05 00:00:00', null,                'KYC completed','Alice Johnson'],
    ['OPP-20260310-1002','Prospecting','2026-03-10 00:00:00','2026-03-20 00:00:00','Opportunity created','Clara Singh'],
    ['OPP-20260310-1002','Won',        '2026-03-20 00:00:00','2026-04-01 00:00:00','Signed up','Clara Singh'],
    ['OPP-20260310-1002','Onboarded',  '2026-04-01 00:00:00','2026-04-15 00:00:00','KYC done','Clara Singh'],
    ['OPP-20260310-1002','Activated',  '2026-04-15 00:00:00', null,                'First transaction confirmed','Clara Singh'],
  ];
  for (const [oid, stage, ea, xa, note, by] of stageHistory) {
    await pool.query(
      'INSERT INTO stage_history (opportunity_id,stage,entered_at,exited_at,note,changed_by) VALUES (?,?,?,?,?,?)',
      [oid, stage, ea, xa, note, by]
    );
  }
  console.log('Created stage history');

  // ── Activities ─────────────────────────────────────────────────────────────
  const activities = [
    ['ACT-001','lead','LD-20260218-1001','Call','Discovery Call','Connected – Interested','2026-02-19 10:00:00','2026-02-21','Discussed cross-border payments. Budget ~$250k/month.','Alice Johnson'],
    ['ACT-002','lead','LD-20260218-1001','Call','Demo Call','Connected – Interested','2026-02-23 14:00:00','2026-02-26','Showed dashboard and API. Very positive.','Alice Johnson'],
    ['ACT-003','opportunity','OPP-20260220-1001','Email','','','2026-02-26 09:00:00', null,'Sent onboarding documents and KYC checklist.','Alice Johnson'],
    ['ACT-004','lead','LD-20260301-1002','Call','Follow-Up Call','Connected – Call Later','2026-03-05 11:00:00','2026-03-12','Busy with Q2 planning. Callback next week.','Bob Martinez'],
    ['ACT-005','lead','LD-20260418-1005','Call','Discovery Call','Connected – Interested','2026-04-20 10:00:00','2026-04-23','Fleet management, 200+ drivers. Needs mass payouts.','Alice Johnson'],
    ['ACT-006','opportunity','OPP-20260310-1002','Call','Customer Support Call','Connected – Interested','2026-04-25 15:00:00', null,'First transaction confirmed $12k. Client very happy.','Clara Singh'],
    ['ACT-007','lead','LD-20260416-1004','Note','','','2026-04-27 09:00:00', null,'Met at SaaS Expo. Card exchanged. Follow up Q2.','David Kim'],
  ];
  for (const [id, et, eid, type, ct, co, dt, nfd, notes, by] of activities) {
    await pool.query(
      `INSERT INTO activities (activity_id,entity_type,entity_id,type,call_type,call_outcome,
       date_time,next_follow_up_date,notes,logged_by) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [id, et, eid, type, ct, co, dt, nfd, notes, by]
    );
  }
  console.log(`Created ${activities.length} activities`);

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const year = 2026;
  for (const u of TEAM) {
    for (const q of ['Q2','Q3','Q4']) {
      await pool.query(
        `INSERT INTO kpis (user_id, user_name, quarter, year, tc_target, tc_ach, ac_target, ac_ach)
         VALUES (?,?,?,?,?,?,?,?)`,
        [u.userId, `${u.firstName} ${u.lastName}`, q, year,
         50, q === 'Q2' ? 12 : 0,
         10, q === 'Q2' ? 3  : 0]
      );
    }
  }
  console.log(`Created ${TEAM.length * 3} KPI records`);

  console.log('\n✓ Seed complete!');
  console.log('\nTest accounts (enter email → OTP shown in API response in dev mode):');
  TEAM.forEach(u => console.log(`  ${u.email}`));

  if (pool.end) await pool.end();
  process.exit(0);
}

run().catch(err => { console.error('\n✗ Seed failed:', err.message); process.exit(1); });
