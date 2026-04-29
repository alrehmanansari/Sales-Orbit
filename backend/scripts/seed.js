require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../src/config/db');

const TEAM = [
  { userId: 'USR-1001', firstName: 'Alice', lastName: 'Johnson', email: 'alice@salesorbit.io', designation: 'Head of Sales',  role: 'Manager' },
  { userId: 'USR-1002', firstName: 'Bob',   lastName: 'Martinez',email: 'bob@salesorbit.io',   designation: 'Sales Rep',      role: 'Rep' },
  { userId: 'USR-1003', firstName: 'Clara', lastName: 'Singh',   email: 'clara@salesorbit.io', designation: 'Sales Rep',      role: 'Rep' },
  { userId: 'USR-1004', firstName: 'David', lastName: 'Kim',     email: 'david@salesorbit.io', designation: 'Sales Rep',      role: 'Rep' },
];

async function run() {
  console.log('Seeding MySQL database…\n');

  // ── Truncate (safe order respecting FK deps) ──────────────────────────
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const t of ['kpis','activities','stage_history','opportunities','leads','otps','users']) {
    await pool.query(`TRUNCATE TABLE ${t}`);
  }
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('Cleared existing data');

  // ── Users ─────────────────────────────────────────────────────────────
  for (const u of TEAM) {
    await pool.query(
      'INSERT INTO users (user_id,first_name,last_name,email,designation,role) VALUES (?,?,?,?,?,?)',
      [u.userId, u.firstName, u.lastName, u.email, u.designation, u.role]
    );
  }
  console.log(`Created ${TEAM.length} users`);

  // ── Leads ─────────────────────────────────────────────────────────────
  const leads = [
    ['LD-20260218-1001','Sarah Mitchell','NexaTech Solutions','nexatech.io','sarah@nexatech.io','5551234567','New York','Cold Outreach','IT Services','IT Services','Alice Johnson','Hot','Interested in cross-border payments','Qualified','Alice Johnson'],
    ['LD-20260301-1002','James Wei','CloudBridge Inc','cloudbridge.com','james@cloudbridge.com','5559876543','San Francisco','Customer Referral','B2B Seller','Software Development','Bob Martinez','Warm','','Contacted','Bob Martinez'],
    ['LD-20260310-1003','Priya Kapoor','TradeLink B2B','tradelink.in','priya@tradelink.in','5554445555','Mumbai','Customer Referral','B2B Seller','B2B Goods','Clara Singh','Hot','High volume FX requirements','Qualified','Clara Singh'],
  ];
  for (const l of leads) {
    await pool.query(
      `INSERT INTO leads (lead_id,contact_person,company_name,website,email,phone,city,
       lead_source,vertical,nature_of_business,lead_owner,priority,notes,status,created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, l
    );
  }
  console.log(`Created ${leads.length} leads`);

  // ── Opportunities ─────────────────────────────────────────────────────
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
     250000,12500,'2026-05-12','Sarah Mitchell',
     JSON.stringify(['Payoneer','Wise']),'Strong interest, budget confirmed','Onboarded','Alice Johnson']
  );
  console.log('Created 1 opportunity');

  // ── Stage history ─────────────────────────────────────────────────────
  const sh = [
    ['OPP-20260220-1001','Prospecting',new Date('2026-02-20'),new Date('2026-02-26'),'Opportunity created from lead','Alice Johnson'],
    ['OPP-20260220-1001','Won',        new Date('2026-02-26'),new Date('2026-03-05'),'Account registered','Alice Johnson'],
    ['OPP-20260220-1001','Onboarded',  new Date('2026-03-05'),null,'KYC completed','Alice Johnson'],
  ];
  for (const [oid,stage,ea,xa,note,by] of sh) {
    await pool.query(
      'INSERT INTO stage_history (opportunity_id,stage,entered_at,exited_at,note,changed_by) VALUES (?,?,?,?,?,?)',
      [oid, stage, ea, xa, note, by]
    );
  }
  console.log('Created stage history');

  // ── Activities ────────────────────────────────────────────────────────
  const acts = [
    ['ACT-001','lead','LD-20260218-1001','Call','Discovery Call','Connected – Interested',new Date('2026-02-19'),new Date('2026-02-21'),'Discussed cross-border payments. Budget confirmed ~$250k/month.','Alice Johnson'],
    ['ACT-002','opportunity','OPP-20260220-1001','Meeting','','',new Date('2026-02-25'),null,'Product demo completed. Client very interested.','Alice Johnson'],
  ];
  for (const [id,et,eid,type,ct,co,dt,nfd,notes,by] of acts) {
    await pool.query(
      `INSERT INTO activities (activity_id,entity_type,entity_id,type,call_type,call_outcome,
       date_time,next_follow_up_date,notes,logged_by) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [id, et, eid, type, ct, co, dt, nfd, notes, by]
    );
  }
  console.log('Created sample activities');

  // ── KPIs ──────────────────────────────────────────────────────────────
  const year = 2026;
  for (const u of TEAM) {
    for (const q of ['Q2','Q3','Q4']) {
      await pool.query(
        `INSERT INTO kpis (user_id,user_name,quarter,year,tc_target,tc_ach,ac_target,ac_ach)
         VALUES (?,?,?,?,?,?,?,?)`,
        [u.userId, `${u.firstName} ${u.lastName}`, q, year, 50, q==='Q2'?12:0, 10, q==='Q2'?3:0]
      );
    }
  }
  console.log(`Created ${TEAM.length * 3} KPI records`);

  console.log('\n✓ Seed complete!');
  console.log('\nTest users (request OTP to login):');
  TEAM.forEach(u => console.log(`  ${u.email}`));
  console.log('\nIn development mode the OTP is returned in the API response.\n');

  await pool.end();
}

run().catch(err => { console.error(err); process.exit(1); });
