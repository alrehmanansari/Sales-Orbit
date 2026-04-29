require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Lead = require('../src/models/Lead');
const Opportunity = require('../src/models/Opportunity');
const Activity = require('../src/models/Activity');
const Kpi = require('../src/models/Kpi');

const TEAM = [
  { firstName: 'Alice', lastName: 'Johnson', email: 'alice@salesorbit.io', designation: 'Head of Sales' },
  { firstName: 'Bob', lastName: 'Martinez', email: 'bob@salesorbit.io', designation: 'Sales Rep' },
  { firstName: 'Clara', lastName: 'Singh', email: 'clara@salesorbit.io', designation: 'Sales Rep' },
  { firstName: 'David', lastName: 'Kim', email: 'david@salesorbit.io', designation: 'Sales Rep' },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salesorbit');
  console.log('Connected to MongoDB');

  // Clear
  await Promise.all([
    User.deleteMany({}),
    Lead.deleteMany({}),
    Opportunity.deleteMany({}),
    Activity.deleteMany({}),
    Kpi.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // Users
  const users = await User.insertMany(TEAM);
  console.log(`Created ${users.length} users`);

  // Leads
  const leads = await Lead.insertMany([
    {
      leadId: 'LD-20260218-1001',
      contactPerson: 'Sarah Mitchell',
      companyName: 'NexaTech Solutions',
      website: 'nexatech.io',
      email: 'sarah@nexatech.io',
      phone: '5551234567',
      city: 'New York',
      leadSource: 'Cold Outreach',
      vertical: 'IT Services',
      natureOfBusiness: 'IT Services',
      leadOwner: 'Alice Johnson',
      priority: 'Hot',
      notes: 'Interested in cross-border payments',
      status: 'Qualified',
      createdBy: 'Alice Johnson',
    },
    {
      leadId: 'LD-20260301-1002',
      contactPerson: 'James Wei',
      companyName: 'CloudBridge Inc',
      email: 'james@cloudbridge.com',
      city: 'San Francisco',
      leadSource: 'Customer Referral',
      vertical: 'B2B Seller',
      natureOfBusiness: 'Software Development',
      leadOwner: 'Bob Martinez',
      priority: 'Warm',
      status: 'Contacted',
      createdBy: 'Bob Martinez',
    },
    {
      leadId: 'LD-20260310-1003',
      contactPerson: 'Priya Sharma',
      companyName: 'EcomGlobe',
      email: 'priya@ecomglobe.com',
      city: 'Dubai',
      leadSource: 'Trade Show/Event',
      vertical: 'Ecom Seller',
      natureOfBusiness: 'Shopify',
      leadOwner: 'Clara Singh',
      priority: 'Hot',
      status: 'New',
      createdBy: 'Clara Singh',
    },
  ]);
  console.log(`Created ${leads.length} leads`);

  // Opportunities
  const opps = await Opportunity.insertMany([
    {
      opportunityId: 'OPP-20260220-1001',
      leadId: 'LD-20260218-1001',
      opportunityName: 'NexaTech Solutions – IT Services',
      companyName: 'NexaTech Solutions',
      contactPerson: 'Sarah Mitchell',
      email: 'sarah@nexatech.io',
      city: 'New York',
      leadSource: 'Cold Outreach',
      vertical: 'IT Services',
      natureOfBusiness: 'IT Services',
      leadOwner: 'Alice Johnson',
      priority: 'Hot',
      expectedMonthlyVolume: 250000,
      expectedMonthlyRevenue: 12500,
      expectedCloseDate: new Date('2026-05-12'),
      decisionMaker: 'Sarah Mitchell',
      stage: 'Onboarded',
      stageHistory: [
        { stage: 'Prospecting', enteredAt: new Date('2026-02-20'), exitedAt: new Date('2026-02-26'), note: 'Opportunity created from lead', changedBy: 'Alice Johnson' },
        { stage: 'Onboarded', enteredAt: new Date('2026-02-26'), note: 'Moved after contract signed', changedBy: 'Alice Johnson' },
      ],
      createdBy: 'Alice Johnson',
    },
  ]);
  console.log(`Created ${opps.length} opportunities`);

  // Activities
  await Activity.insertMany([
    {
      activityId: 'ACT-001',
      entityType: 'lead',
      entityId: 'LD-20260218-1001',
      type: 'Call',
      callType: 'Discovery Call',
      callOutcome: 'Connected – Interested',
      dateTime: new Date('2026-02-19'),
      notes: 'Discussed cross-border payments needs. Budget confirmed ~$250k/month.',
      loggedBy: 'Alice Johnson',
    },
    {
      activityId: 'ACT-002',
      entityType: 'opportunity',
      entityId: 'OPP-20260220-1001',
      type: 'Meeting',
      dateTime: new Date('2026-02-25'),
      notes: 'Product demo completed. Client very interested.',
      loggedBy: 'Alice Johnson',
    },
  ]);
  console.log('Created sample activities');

  // KPIs
  const year = 2026;
  const kpis = [];
  for (const u of users) {
    for (const q of ['Q2', 'Q3', 'Q4']) {
      kpis.push({
        userId: u.userId,
        userName: `${u.firstName} ${u.lastName}`,
        quarter: q,
        year,
        tcTarget: 50,
        tcAch: q === 'Q2' ? 12 : 0,
        acTarget: 10,
        acAch: q === 'Q2' ? 3 : 0,
      });
    }
  }
  await Kpi.insertMany(kpis);
  console.log(`Created ${kpis.length} KPI records`);

  console.log('\n✓ Seed complete!');
  console.log('\nTest credentials (use any seeded email + request OTP):');
  TEAM.forEach(u => console.log(`  ${u.email}`));
  console.log('\nIn development mode, OTP is returned in the API response.');

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
