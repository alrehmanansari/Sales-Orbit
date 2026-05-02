import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react'
import { generateLeadId, generateOpportunityId, generateActivityId } from '../utils/helpers'
import * as api from '../services/api'

const CRMContext = createContext(null)

const INITIAL_STATE = {
  leads: [],
  opportunities: [],
  activities: [],
  currentUser: null,
  users: [],
  auditLog: [],
}

function loadStoredUser() {
  try {
    const u = JSON.parse(localStorage.getItem('so_user'))
    if (!u) return null
    return { name: u.name || `${u.firstName} ${u.lastName}`, role: u.role, email: u.email, designation: u.designation }
  } catch { return null }
}

function reducer(state, action) {
  switch (action.type) {

    case 'INIT_STATE':
      return {
        ...state,
        leads: action.leads,
        opportunities: action.opportunities,
        activities: action.activities,
        users: action.users || state.users,
        currentUser: state.currentUser || loadStoredUser(),
      }

    // ── Leads ──────────────────────────────────────────────────────────────
    case 'ADD_LEAD':
      return { ...state, leads: [action.payload, ...state.leads] }

    case 'REPLACE_LEAD':
      return { ...state, leads: state.leads.map(l => l.id === action.tempId ? action.lead : l) }

    case 'UPDATE_LEAD':
      return { ...state, leads: state.leads.map(l => l.id === action.payload.id ? { ...l, ...action.payload } : l) }

    case 'DELETE_LEAD':
      return { ...state, leads: state.leads.filter(l => l.id !== action.id) }

    case 'SET_LEADS':
      return { ...state, leads: action.leads }

    case 'BULK_IMPORT_LEADS':
      return { ...state, leads: [...action.payload, ...state.leads] }

    // ── Opportunities ──────────────────────────────────────────────────────
    case 'ADD_OPPORTUNITY':
      return { ...state, opportunities: [action.payload, ...state.opportunities] }

    case 'REPLACE_OPPORTUNITY':
      return { ...state, opportunities: state.opportunities.map(o => o.id === action.tempId ? action.opp : o) }

    case 'UPDATE_OPPORTUNITY':
      return { ...state, opportunities: state.opportunities.map(o => o.id === action.payload.id ? { ...o, ...action.payload } : o) }

    case 'DELETE_OPPORTUNITY':
      return { ...state, opportunities: state.opportunities.filter(o => o.id !== action.id) }

    case 'MOVE_STAGE': {
      const { id, newStage, note, lostReason, onHoldReviewDate } = action.payload
      const opp = state.opportunities.find(o => o.id === id)
      if (!opp) return state
      const now = new Date().toISOString()
      const updatedHistory = opp.stageHistory.map((s, idx) =>
        idx === opp.stageHistory.length - 1 ? { ...s, exitedAt: now } : s
      )
      updatedHistory.push({ stage: newStage, enteredAt: now, exitedAt: null, note, changedBy: state.currentUser?.name })
      const updated = { ...opp, stage: newStage, stageHistory: updatedHistory, lostReason: lostReason || opp.lostReason, onHoldReviewDate: onHoldReviewDate || opp.onHoldReviewDate }
      return { ...state, opportunities: state.opportunities.map(o => o.id === id ? updated : o) }
    }

    // ── Activities ─────────────────────────────────────────────────────────
    case 'ADD_ACTIVITY': {
      const act = action.payload
      const leads = state.leads.map(l =>
        l.id === act.entityId && act.entityType === 'lead'
          ? { ...l, lastActivityAt: act.dateTime, status: l.status === 'New' ? 'Contacted' : l.status }
          : l
      )
      return { ...state, activities: [act, ...state.activities], leads }
    }

    case 'REPLACE_ACTIVITY':
      return { ...state, activities: state.activities.map(a => a.id === action.tempId ? action.act : a) }

    case 'DELETE_ACTIVITY':
      return { ...state, activities: state.activities.filter(a => a.id !== action.id) }

    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload }

    default:
      return state
  }
}

export function CRMProvider({ children }) {
  const [state, realDispatch] = useReducer(reducer, INITIAL_STATE)
  const [crmLoading, setCrmLoading] = React.useState(true)
  const [crmError, setCrmError]     = React.useState(null)
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  // Set current user from stored session
  useEffect(() => {
    const user = loadStoredUser()
    if (user) realDispatch({ type: 'SET_CURRENT_USER', payload: user })
  }, [])

  // Initial data load from API
  useEffect(() => {
    Promise.all([
      api.leads.list({ limit: 500 }),
      api.opportunities.list({ limit: 500 }),
      api.activities.list({ limit: 500 }),
      api.users.list(),
    ]).then(([leadsRes, oppsRes, actsRes, usersRes]) => {
      realDispatch({
        type: 'INIT_STATE',
        leads: leadsRes.leads,
        opportunities: oppsRes.opportunities,
        activities: actsRes.activities,
        users: usersRes.users,
      })
    }).catch(err => {
      console.error('CRM initial load failed:', err)
      setCrmError(err.message === 'BACKEND_UNREACHABLE'
        ? 'Cannot reach the backend server. Make sure it is running on port 5001.'
        : 'Failed to load data: ' + err.message)
    }).finally(() => setCrmLoading(false))
  }, [])

  const dispatch = useCallback((action) => {
    const state = stateRef.current

    switch (action.type) {

      case 'ADD_LEAD': {
        const tempLead = {
          ...action.payload,
          id: generateLeadId(),
          createdAt: new Date().toISOString(),
          createdBy: state.currentUser?.name || '',
          status: action.payload.status || 'New',
          convertedAt: null,
          opportunityId: null,
          lastActivityAt: null,
        }
        realDispatch({ type: 'ADD_LEAD', payload: tempLead })

        const { id, createdAt, convertedAt, opportunityId, lastActivityAt, ...apiData } = tempLead
        api.leads.create(apiData).then(res => {
          realDispatch({ type: 'REPLACE_LEAD', tempId: tempLead.id, lead: res.lead })
        }).catch(err => {
          console.error('Failed to create lead:', err)
          realDispatch({ type: 'DELETE_LEAD', id: tempLead.id })
        })
        break
      }

      case 'UPDATE_LEAD': {
        realDispatch(action)
        api.leads.update(action.payload.id, action.payload).catch(err => {
          console.error('Failed to update lead:', err)
        })
        break
      }

      case 'DELETE_LEAD': {
        realDispatch(action)
        api.leads.remove(action.id).catch(err => {
          console.error('Failed to delete lead:', err)
        })
        break
      }

      case 'BULK_IMPORT_LEADS': {
        api.leads.bulk(action.payload).then(() =>
          api.leads.list({ limit: 500 })
        ).then(res => {
          realDispatch({ type: 'SET_LEADS', leads: res.leads })
        }).catch(err => {
          console.error('Failed to bulk import:', err)
        })
        break
      }

      case 'ADD_OPPORTUNITY': {
        const now = new Date().toISOString()
        const stageHistory = [{
          stage: action.payload.stage || 'Prospecting',
          enteredAt: now,
          exitedAt: null,
          note: action.payload.initialNote || (action.payload.leadId ? 'Converted from lead' : 'Opportunity created'),
          changedBy: state.currentUser?.name || '',
        }]

        if (action.payload.leadId) {
          // Lead conversion — use dedicated endpoint
          const tempOpp = {
            ...action.payload,
            id: generateOpportunityId(),
            createdAt: now,
            createdBy: state.currentUser?.name || '',
            stageHistory,
          }
          const originalLead = state.leads.find(l => l.id === action.payload.leadId)

          realDispatch({ type: 'ADD_OPPORTUNITY', payload: tempOpp })
          realDispatch({ type: 'UPDATE_LEAD', payload: {
            id: action.payload.leadId,
            status: 'Converted',
            convertedAt: now,
            opportunityId: tempOpp.id,
          }})

          api.leads.convert(action.payload.leadId, {
            opportunityName: action.payload.opportunityName,
            expectedMonthlyVolume: action.payload.expectedMonthlyVolume || 0,
            expectedMonthlyRevenue: action.payload.expectedMonthlyRevenue || 0,
            expectedCloseDate: action.payload.expectedCloseDate || null,
            decisionMaker: action.payload.decisionMaker || '',
            dealNotes: action.payload.dealNotes || '',
          }).then(res => {
            realDispatch({ type: 'REPLACE_OPPORTUNITY', tempId: tempOpp.id, opp: res.opportunity })
            realDispatch({ type: 'UPDATE_LEAD', payload: { ...res.lead } })
          }).catch(err => {
            console.error('Failed to convert lead:', err)
            realDispatch({ type: 'DELETE_OPPORTUNITY', id: tempOpp.id })
            if (originalLead) realDispatch({ type: 'UPDATE_LEAD', payload: originalLead })
          })

        } else {
          // Standalone opportunity
          const tempOpp = {
            ...action.payload,
            id: generateOpportunityId(),
            createdAt: now,
            createdBy: state.currentUser?.name || '',
            stageHistory,
          }
          realDispatch({ type: 'ADD_OPPORTUNITY', payload: tempOpp })

          const { id, createdAt, stageHistory: sh, initialNote, createdBy, ...apiData } = tempOpp
          api.opportunities.create(apiData).then(res => {
            realDispatch({ type: 'REPLACE_OPPORTUNITY', tempId: tempOpp.id, opp: res.opportunity })
          }).catch(err => {
            console.error('Failed to create opportunity:', err)
            realDispatch({ type: 'DELETE_OPPORTUNITY', id: tempOpp.id })
          })
        }
        break
      }

      case 'UPDATE_OPPORTUNITY': {
        realDispatch(action)
        const { id, createdAt, stageHistory, initialNote, createdBy, ...apiData } = action.payload
        api.opportunities.update(action.payload.id, apiData).catch(err => {
          console.error('Failed to update opportunity:', err)
        })
        break
      }

      case 'DELETE_OPPORTUNITY': {
        realDispatch(action)
        api.opportunities.remove(action.id).catch(err => {
          console.error('Failed to delete opportunity:', err)
        })
        break
      }

      case 'MOVE_STAGE': {
        realDispatch(action)
        const { id, newStage, note, lostReason, onHoldReviewDate } = action.payload
        api.opportunities.moveStage(id, { stage: newStage, note, lostReason, onHoldReviewDate }).catch(err => {
          console.error('Failed to move stage:', err)
        })
        break
      }

      case 'ADD_ACTIVITY': {
        const tempAct = {
          ...action.payload,
          id: generateActivityId(),
          createdAt: new Date().toISOString(),
          loggedBy: action.payload.loggedBy || state.currentUser?.name || '',
        }
        realDispatch({ type: 'ADD_ACTIVITY', payload: tempAct })

        api.activities.create({
          ...action.payload,
          loggedBy: tempAct.loggedBy,
        }).then(res => {
          realDispatch({ type: 'REPLACE_ACTIVITY', tempId: tempAct.id, act: res.activity })
        }).catch(err => {
          console.error('Failed to log activity:', err)
          realDispatch({ type: 'DELETE_ACTIVITY', id: tempAct.id })
        })
        break
      }

      default:
        realDispatch(action)
    }
  }, [])

  return (
    <CRMContext.Provider value={{ state, dispatch, crmLoading, crmError }}>
      {children}
    </CRMContext.Provider>
  )
}

export function useCRM() {
  const ctx = useContext(CRMContext)
  if (!ctx) throw new Error('useCRM must be used within CRMProvider')
  return ctx
}
