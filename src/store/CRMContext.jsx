import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { generateLeadId, generateOpportunityId, generateActivityId } from '../utils/helpers'
import { TEAM_MEMBERS } from '../data/constants'

const CRMContext = createContext(null)

const STORAGE_KEY = 'salesorbit_crm_v2'

function getInitialState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return buildSeedState()
}

function buildSeedState() {
  const now = new Date()
  const daysAgo = d => new Date(now - d * 86400000).toISOString()

  const leads = [
    {
      id: 'LD-20260410-1001', contactPerson: 'Sarah Mitchell', companyName: 'NexaTech Solutions',
      website: 'nexatech.io', email: 'sarah@nexatech.io', phone: '5551234567',
      city: 'New York', leadSource: 'Cold Outreach', leadSourceOther: '',
      vertical: 'IT Services', natureOfBusiness: 'IT Services',
      leadOwner: 'Alice Johnson', priority: 'Hot', notes: 'Interested in cross-border payments',
      status: 'Converted', createdAt: daysAgo(20), createdBy: 'Alice Johnson',
      convertedAt: daysAgo(18), opportunityId: 'OPP-20260410-1001', lastActivityAt: daysAgo(2)
    },
    {
      id: 'LD-20260412-1002', contactPerson: 'James Rodriguez', companyName: 'ShopMax Global',
      website: 'shopmax.com', email: 'james@shopmax.com', phone: '5559876543',
      city: 'Los Angeles', leadSource: 'Marketing Campaign', leadSourceOther: '',
      vertical: 'E-commerce Seller', natureOfBusiness: 'Shopify',
      leadOwner: 'Bob Martinez', priority: 'Warm', notes: 'Looking to expand to EU markets',
      status: 'Contacted', createdAt: daysAgo(15), createdBy: 'Bob Martinez',
      convertedAt: null, opportunityId: null, lastActivityAt: daysAgo(3)
    },
    {
      id: 'LD-20260414-1003', contactPerson: 'Priya Kapoor', companyName: 'TradeLink B2B',
      website: 'tradelink.in', email: 'priya@tradelink.in', phone: '5554445555',
      city: 'Mumbai', leadSource: 'Customer Referral', leadSourceOther: '',
      vertical: 'B2B Seller', natureOfBusiness: 'B2B Goods',
      leadOwner: 'Clara Singh', priority: 'Hot', notes: 'High volume FX requirements',
      status: 'Converted', createdAt: daysAgo(30), createdBy: 'Clara Singh',
      convertedAt: daysAgo(25), opportunityId: 'OPP-20260414-1002', lastActivityAt: daysAgo(1)
    },
    {
      id: 'LD-20260416-1004', contactPerson: 'Liam Chen', companyName: 'CloudStack Systems',
      website: 'cloudstack.dev', email: 'liam@cloudstack.dev', phone: '5557778888',
      city: 'Singapore', leadSource: 'Trade Show/Event', leadSourceOther: '',
      vertical: 'IT Services', natureOfBusiness: 'IT Services',
      leadOwner: 'David Kim', priority: 'Cold', notes: 'Met at SaaS Expo, needs follow-up Q2',
      status: 'New', createdAt: daysAgo(5), createdBy: 'David Kim',
      convertedAt: null, opportunityId: null, lastActivityAt: null
    },
    {
      id: 'LD-20260418-1005', contactPerson: 'Amina Hassan', companyName: 'Zarif Logistics',
      website: 'zarif.ae', email: 'amina@zarif.ae', phone: '5553332222',
      city: 'Dubai', leadSource: 'Online Directory', leadSourceOther: '',
      vertical: 'B2B Seller', natureOfBusiness: 'Logistics',
      leadOwner: 'Emma Chen', priority: 'Hot', notes: 'Fleet of 200+ drivers, global payouts',
      status: 'Qualified', createdAt: daysAgo(8), createdBy: 'Emma Chen',
      convertedAt: null, opportunityId: null, lastActivityAt: daysAgo(1)
    },
    {
      id: 'LD-20260420-1006', contactPerson: 'Oliver Smith', companyName: 'FinFlow Digital',
      website: 'finflow.io', email: 'oliver@finflow.io', phone: '5556667777',
      city: 'London', leadSource: 'Customer Referral', leadSourceOther: '',
      vertical: 'IT Services', natureOfBusiness: 'Digital Accountancy',
      leadOwner: 'Farhan Sheikh', priority: 'Warm', notes: 'Referred by NexaTech, strong fit',
      status: 'Contacted', createdAt: daysAgo(10), createdBy: 'Farhan Sheikh',
      convertedAt: null, opportunityId: null, lastActivityAt: daysAgo(2)
    },
    {
      id: 'LD-20260422-1007', contactPerson: 'Mei Wang', companyName: 'HRCore Asia',
      website: 'hrcore.asia', email: 'mei@hrcore.asia', phone: '5551112222',
      city: 'Shanghai', leadSource: 'Cold Outreach', leadSourceOther: '',
      vertical: 'IT Services', natureOfBusiness: 'HR Management',
      leadOwner: 'Grace Liu', priority: 'Warm', notes: 'Payroll processing for 5k employees',
      status: 'New', createdAt: daysAgo(2), createdBy: 'Grace Liu',
      convertedAt: null, opportunityId: null, lastActivityAt: null
    },
    {
      id: 'LD-20260423-1008', contactPerson: 'Tariq Noor', companyName: 'Ecomera PKR',
      website: 'ecomera.pk', email: 'tariq@ecomera.pk', phone: '5559990000',
      city: 'Karachi', leadSource: 'Marketing Campaign', leadSourceOther: '',
      vertical: 'E-commerce Seller', natureOfBusiness: 'E-comm Marketplaces',
      leadOwner: 'Hassan Ali', priority: 'Cold', notes: 'Small seller, exploring options',
      status: 'Dead', createdAt: daysAgo(45), createdBy: 'Hassan Ali',
      convertedAt: null, opportunityId: null, lastActivityAt: daysAgo(20)
    }
  ]

  const opps = [
    {
      id: 'OPP-20260410-1001', leadId: 'LD-20260410-1001',
      opportunityName: 'NexaTech Solutions – IT Services',
      companyName: 'NexaTech Solutions', contactPerson: 'Sarah Mitchell',
      email: 'sarah@nexatech.io', phone: '5551234567',
      vertical: 'IT Services', natureOfBusiness: 'IT Services',
      leadOwner: 'Alice Johnson', priority: 'Hot',
      expectedMonthlyVolume: 250000, expectedMonthlyRevenue: 12500,
      expectedCloseDate: daysAgo(-14).slice(0, 10),
      decisionMaker: 'Sarah Mitchell', competitors: ['Payoneer', 'Wise'],
      dealNotes: 'Strong interest, budget confirmed',
      stage: 'Onboarded', lostReason: '', onHoldReviewDate: null,
      stageHistory: [
        { stage: 'Prospecting', enteredAt: daysAgo(18), exitedAt: daysAgo(12), note: 'Opportunity created from lead', changedBy: 'Alice Johnson' },
        { stage: 'Won', enteredAt: daysAgo(12), exitedAt: daysAgo(5), note: 'Account registered', changedBy: 'Alice Johnson' },
        { stage: 'Onboarded', enteredAt: daysAgo(5), exitedAt: null, note: 'KYC completed', changedBy: 'Alice Johnson' }
      ],
      createdAt: daysAgo(18), createdBy: 'Alice Johnson',
      city: 'New York', website: 'nexatech.io', leadSource: 'Cold Outreach'
    },
    {
      id: 'OPP-20260414-1002', leadId: 'LD-20260414-1003',
      opportunityName: 'TradeLink B2B – B2B Seller',
      companyName: 'TradeLink B2B', contactPerson: 'Priya Kapoor',
      email: 'priya@tradelink.in', phone: '5554445555',
      vertical: 'B2B Seller', natureOfBusiness: 'B2B Goods',
      leadOwner: 'Clara Singh', priority: 'Hot',
      expectedMonthlyVolume: 500000, expectedMonthlyRevenue: 25000,
      expectedCloseDate: daysAgo(-7).slice(0, 10),
      decisionMaker: 'Priya Kapoor', competitors: ['Airwallex', 'Payoneer'],
      dealNotes: 'Large deal, needs exec approval',
      stage: 'Activated', lostReason: '', onHoldReviewDate: null,
      stageHistory: [
        { stage: 'Prospecting', enteredAt: daysAgo(25), exitedAt: daysAgo(18), note: 'Opportunity created', changedBy: 'Clara Singh' },
        { stage: 'Won', enteredAt: daysAgo(18), exitedAt: daysAgo(10), note: 'Signed up', changedBy: 'Clara Singh' },
        { stage: 'Onboarded', enteredAt: daysAgo(10), exitedAt: daysAgo(3), note: 'KYC completed, live', changedBy: 'Clara Singh' },
        { stage: 'Activated', enteredAt: daysAgo(3), exitedAt: null, note: 'First transaction $12,000', changedBy: 'Clara Singh' }
      ],
      createdAt: daysAgo(25), createdBy: 'Clara Singh',
      city: 'Mumbai', website: 'tradelink.in', leadSource: 'Customer Referral'
    },
    {
      id: 'OPP-20260420-1003', leadId: null,
      opportunityName: 'FinFlow Digital – IT Services',
      companyName: 'FinFlow Digital', contactPerson: 'Oliver Smith',
      email: 'oliver@finflow.io', phone: '5556667777',
      vertical: 'IT Services', natureOfBusiness: 'Digital Accountancy',
      leadOwner: 'Farhan Sheikh', priority: 'Warm',
      expectedMonthlyVolume: 120000, expectedMonthlyRevenue: 6000,
      expectedCloseDate: daysAgo(-21).slice(0, 10),
      decisionMaker: 'Oliver Smith', competitors: ['Wise'],
      dealNotes: 'Second demo scheduled',
      stage: 'Prospecting', lostReason: '', onHoldReviewDate: null,
      stageHistory: [
        { stage: 'Prospecting', enteredAt: daysAgo(7), exitedAt: null, note: 'Opportunity created', changedBy: 'Farhan Sheikh' }
      ],
      createdAt: daysAgo(7), createdBy: 'Farhan Sheikh',
      city: 'London', website: 'finflow.io', leadSource: 'Customer Referral'
    },
    {
      id: 'OPP-20260421-1004', leadId: null,
      opportunityName: 'ShopMax Global – E-commerce Seller',
      companyName: 'ShopMax Global', contactPerson: 'James Rodriguez',
      email: 'james@shopmax.com', phone: '5559876543',
      vertical: 'E-commerce Seller', natureOfBusiness: 'Shopify',
      leadOwner: 'Bob Martinez', priority: 'Warm',
      expectedMonthlyVolume: 80000, expectedMonthlyRevenue: 3200,
      expectedCloseDate: daysAgo(-10).slice(0, 10),
      decisionMaker: 'James Rodriguez', competitors: ['Ping Pong'],
      dealNotes: 'Shopify integration key requirement',
      stage: 'Won', lostReason: '', onHoldReviewDate: null,
      stageHistory: [
        { stage: 'Prospecting', enteredAt: daysAgo(14), exitedAt: daysAgo(4), note: 'Opportunity created', changedBy: 'Bob Martinez' },
        { stage: 'Won', enteredAt: daysAgo(4), exitedAt: null, note: 'Account registered', changedBy: 'Bob Martinez' }
      ],
      createdAt: daysAgo(14), createdBy: 'Bob Martinez',
      city: 'Los Angeles', website: 'shopmax.com', leadSource: 'Marketing Campaign'
    },
    {
      id: 'OPP-20260422-1005', leadId: null,
      opportunityName: 'Zarif Logistics – B2B Seller',
      companyName: 'Zarif Logistics', contactPerson: 'Amina Hassan',
      email: 'amina@zarif.ae', phone: '5553332222',
      vertical: 'B2B Seller', natureOfBusiness: 'Logistics',
      leadOwner: 'Emma Chen', priority: 'Hot',
      expectedMonthlyVolume: 300000, expectedMonthlyRevenue: 15000,
      expectedCloseDate: daysAgo(-5).slice(0, 10),
      decisionMaker: 'Amina Hassan', competitors: ['Payoneer', 'Local Banks'],
      dealNotes: 'Price is the main hurdle',
      stage: 'Lost', lostReason: 'Competitor', onHoldReviewDate: null,
      stageHistory: [
        { stage: 'Prospecting', enteredAt: daysAgo(20), exitedAt: daysAgo(10), note: 'Opportunity created', changedBy: 'Emma Chen' },
        { stage: 'Lost', enteredAt: daysAgo(10), exitedAt: null, note: 'Went with Payoneer, better pricing', changedBy: 'Emma Chen' }
      ],
      createdAt: daysAgo(20), createdBy: 'Emma Chen',
      city: 'Dubai', website: 'zarif.ae', leadSource: 'Online Directory'
    }
  ]

  const activities = [
    {
      id: 'ACT-001', entityType: 'lead', entityId: 'LD-20260410-1001', type: 'Call',
      callType: 'Discovery Call', callOutcome: 'Connected – Interested',
      dateTime: daysAgo(19), nextFollowUpDate: daysAgo(17).slice(0, 10),
      notes: 'Discussed cross-border payments needs. Budget confirmed ~$250k/month.',
      loggedBy: 'Alice Johnson', createdAt: daysAgo(19)
    },
    {
      id: 'ACT-002', entityType: 'lead', entityId: 'LD-20260410-1001', type: 'Call',
      callType: 'Demo Call', callOutcome: 'Connected – Interested',
      dateTime: daysAgo(17), nextFollowUpDate: daysAgo(15).slice(0, 10),
      notes: 'Showed dashboard and API. Very positive. Sending docs.',
      loggedBy: 'Alice Johnson', createdAt: daysAgo(17)
    },
    {
      id: 'ACT-003', entityType: 'opportunity', entityId: 'OPP-20260410-1001', type: 'Email',
      callType: '', callOutcome: '',
      dateTime: daysAgo(15), nextFollowUpDate: null,
      notes: 'Sent onboarding documents and KYC checklist.',
      loggedBy: 'Alice Johnson', createdAt: daysAgo(15)
    },
    {
      id: 'ACT-004', entityType: 'lead', entityId: 'LD-20260412-1002', type: 'Call',
      callType: 'Follow-Up Call', callOutcome: 'Connected – Call Later',
      dateTime: daysAgo(12), nextFollowUpDate: daysAgo(5).slice(0, 10),
      notes: 'Busy with Q2 planning. Requested callback next week.',
      loggedBy: 'Bob Martinez', createdAt: daysAgo(12)
    },
    {
      id: 'ACT-005', entityType: 'lead', entityId: 'LD-20260418-1005', type: 'Call',
      callType: 'Discovery Call', callOutcome: 'Connected – Interested',
      dateTime: daysAgo(7), nextFollowUpDate: daysAgo(4).slice(0, 10),
      notes: 'Fleet management company, 200+ drivers globally. Needs mass payouts.',
      loggedBy: 'Emma Chen', createdAt: daysAgo(7)
    },
    {
      id: 'ACT-006', entityType: 'lead', entityId: 'LD-20260418-1005', type: 'Meeting',
      callType: '', callOutcome: '',
      dateTime: daysAgo(4), nextFollowUpDate: daysAgo(1).slice(0, 10),
      notes: 'Video call with CFO. Pricing and compliance discussed.',
      loggedBy: 'Emma Chen', createdAt: daysAgo(4)
    },
    {
      id: 'ACT-007', entityType: 'opportunity', entityId: 'OPP-20260414-1002', type: 'Call',
      callType: 'Customer Support Call', callOutcome: 'Connected – Interested',
      dateTime: daysAgo(2), nextFollowUpDate: null,
      notes: 'First transaction confirmed $12k. Client very happy.',
      loggedBy: 'Clara Singh', createdAt: daysAgo(2)
    },
    {
      id: 'ACT-008', entityType: 'opportunity', entityId: 'OPP-20260420-1003', type: 'Call',
      callType: 'Demo Call', callOutcome: 'Connected – Interested',
      dateTime: daysAgo(6), nextFollowUpDate: new Date(now.getTime() + 2 * 86400000).toISOString().slice(0, 10),
      notes: 'Demo went well. Decision maker joining next call.',
      loggedBy: 'Farhan Sheikh', createdAt: daysAgo(6)
    },
    {
      id: 'ACT-009', entityType: 'lead', entityId: 'LD-20260416-1004', type: 'Note',
      callType: '', callOutcome: '',
      dateTime: daysAgo(5), nextFollowUpDate: null,
      notes: 'Met at SaaS Expo. Card exchanged. Follow up Q2.',
      loggedBy: 'David Kim', createdAt: daysAgo(5)
    },
    {
      id: 'ACT-010', entityType: 'lead', entityId: 'LD-20260420-1006', type: 'Call',
      callType: 'Follow-Up Call', callOutcome: 'Not Responded',
      dateTime: daysAgo(3), nextFollowUpDate: new Date(now.getTime() + 1 * 86400000).toISOString().slice(0, 10),
      notes: 'No answer. Left voicemail.',
      loggedBy: 'Farhan Sheikh', createdAt: daysAgo(3)
    }
  ]

  return {
    leads,
    opportunities: opps,
    activities,
    currentUser: { name: 'Alice Johnson', role: 'Manager', email: 'alice@salesorbit.io' },
    users: TEAM_MEMBERS.map((name, i) => ({
      id: i + 1, name,
      role: i === 0 ? 'Manager' : 'Rep',
      email: name.toLowerCase().replace(/ /g, '.') + '@salesorbit.io'
    })),
    auditLog: []
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_LEAD': {
      const lead = { ...action.payload, id: generateLeadId(), createdAt: new Date().toISOString(), status: 'New', convertedAt: null, opportunityId: null }
      return { ...state, leads: [lead, ...state.leads], auditLog: [{ action: 'Lead Created', entityId: lead.id, entityType: 'lead', user: state.currentUser.name, at: new Date().toISOString() }, ...state.auditLog] }
    }
    case 'UPDATE_LEAD': {
      return { ...state, leads: state.leads.map(l => l.id === action.payload.id ? { ...l, ...action.payload } : l), auditLog: [{ action: 'Lead Updated', entityId: action.payload.id, entityType: 'lead', user: state.currentUser.name, at: new Date().toISOString() }, ...state.auditLog] }
    }
    case 'DELETE_LEAD': {
      return { ...state, leads: state.leads.filter(l => l.id !== action.id) }
    }
    case 'BULK_IMPORT_LEADS': {
      return { ...state, leads: [...action.payload, ...state.leads] }
    }
    case 'ADD_OPPORTUNITY': {
      const opp = { ...action.payload, id: generateOpportunityId(), createdAt: new Date().toISOString(), stageHistory: [{ stage: action.payload.stage || 'Prospecting', enteredAt: new Date().toISOString(), exitedAt: null, note: action.payload.initialNote || 'Opportunity created', changedBy: state.currentUser.name }] }
      let leads = state.leads
      if (action.payload.leadId) {
        leads = leads.map(l => l.id === action.payload.leadId ? { ...l, status: 'Converted', convertedAt: new Date().toISOString(), opportunityId: opp.id } : l)
      }
      return { ...state, leads, opportunities: [opp, ...state.opportunities], auditLog: [{ action: 'Opportunity Created', entityId: opp.id, entityType: 'opportunity', user: state.currentUser.name, at: new Date().toISOString() }, ...state.auditLog] }
    }
    case 'UPDATE_OPPORTUNITY': {
      return { ...state, opportunities: state.opportunities.map(o => o.id === action.payload.id ? { ...o, ...action.payload } : o), auditLog: [{ action: 'Opportunity Updated', entityId: action.payload.id, entityType: 'opportunity', user: state.currentUser.name, at: new Date().toISOString() }, ...state.auditLog] }
    }
    case 'MOVE_STAGE': {
      const { id, newStage, note, lostReason, onHoldReviewDate } = action.payload
      const opp = state.opportunities.find(o => o.id === id)
      if (!opp) return state
      const now = new Date().toISOString()
      const updatedHistory = opp.stageHistory.map((s, idx) =>
        idx === opp.stageHistory.length - 1 ? { ...s, exitedAt: now } : s
      )
      updatedHistory.push({ stage: newStage, enteredAt: now, exitedAt: null, note, changedBy: state.currentUser.name })
      const updated = { ...opp, stage: newStage, stageHistory: updatedHistory, lostReason: lostReason || opp.lostReason, onHoldReviewDate: onHoldReviewDate || opp.onHoldReviewDate }
      return { ...state, opportunities: state.opportunities.map(o => o.id === id ? updated : o), auditLog: [{ action: `Stage → ${newStage}`, entityId: id, entityType: 'opportunity', user: state.currentUser.name, at: now }, ...state.auditLog] }
    }
    case 'DELETE_OPPORTUNITY': {
      return { ...state, opportunities: state.opportunities.filter(o => o.id !== action.id) }
    }
    case 'ADD_ACTIVITY': {
      const act = { ...action.payload, id: generateActivityId(), createdAt: new Date().toISOString() }
      const leads = state.leads.map(l => l.id === act.entityId ? { ...l, lastActivityAt: act.dateTime, status: l.status === 'New' ? 'Contacted' : l.status } : l)
      return { ...state, activities: [act, ...state.activities], leads }
    }
    case 'SET_CURRENT_USER': {
      return { ...state, currentUser: action.payload }
    }
    default:
      return state
  }
}

export function CRMProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, getInitialState)

  // Sync auth user into CRM state
  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem('salesorbit_session_v1'))
      if (session && session.name !== state.currentUser?.name) {
        dispatch({ type: 'SET_CURRENT_USER', payload: { name: session.name, role: session.role, email: session.email, designation: session.designation } })
      }
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
  }, [state])

  return <CRMContext.Provider value={{ state, dispatch }}>{children}</CRMContext.Provider>
}

export function useCRM() {
  const ctx = useContext(CRMContext)
  if (!ctx) throw new Error('useCRM must be used within CRMProvider')
  return ctx
}
