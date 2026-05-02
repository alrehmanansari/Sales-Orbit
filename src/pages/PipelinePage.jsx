import React, { useState } from 'react'
import { useCRM } from '../store/CRMContext'
import OpportunityDetail from '../components/opportunities/OpportunityDetail'
import OpportunityForm from '../components/opportunities/OpportunityForm'
import StageModal from '../components/opportunities/StageModal'
import { formatDate, formatCurrency, daysDiff } from '../utils/helpers'
import { OPPORTUNITY_STAGES, STAGE_COLORS } from '../data/constants'
import { StageBadge, PriorityBadge } from '../components/common/Badge'

const STAGE_HEADER_BG = {
  Prospecting: 'var(--so-blue-soft)',
  Won: 'var(--so-purple-soft)',
  Onboarded: 'rgba(30,142,62,0.08)',
  Activated: 'var(--so-pink-soft)',
  Lost: 'rgba(217,48,37,0.06)',
  'On Hold': 'var(--bg-tertiary)',
}

export default function PipelinePage() {
  const { state, dispatch } = useCRM()
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editOpp, setEditOpp] = useState(null)
  const [stageModal, setStageModal] = useState(null)
  const [collapsed, setCollapsed] = useState({ Lost: true, 'On Hold': true })

  const totalVolume = state.opportunities.filter(o => !['Lost', 'On Hold'].includes(o.stage)).reduce((s, o) => s + (o.expectedMonthlyVolume || 0), 0)
  const totalRevenue = state.opportunities.filter(o => !['Lost', 'On Hold'].includes(o.stage)).reduce((s, o) => s + (o.expectedMonthlyRevenue || 0), 0)

  function toggleCollapse(stage) {
    setCollapsed(p => ({ ...p, [stage]: !p[stage] }))
  }

  function moveStage(id, { newStage, note, lostReason, onHoldReviewDate, clientId }) {
    dispatch({ type: 'MOVE_STAGE', payload: { id, newStage, note, lostReason, onHoldReviewDate, clientId } })
    setStageModal(null)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>Pipeline</h2>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
            {state.opportunities.filter(o => !['Lost', 'On Hold'].includes(o.stage)).length} active deals
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ New Opportunity</button>
        </div>
      </div>

      {/* Minimal summary bar */}
      <div style={{ display: 'flex', gap: 0, background: 'var(--bg-secondary)', borderBottom: '0.5px solid var(--border-color)', overflowX: 'auto' }}>
        {OPPORTUNITY_STAGES.map((stage, i) => {
          const opps = state.opportunities.filter(o => o.stage === stage)
          const rev = opps.reduce((s, o) => s + (o.expectedMonthlyRevenue || 0), 0)
          const isLast = i === OPPORTUNITY_STAGES.length - 1
          return (
            <div key={stage} style={{
              flex: '1 1 0', minWidth: 100, padding: '10px 16px', textAlign: 'center',
              borderRight: isLast ? 'none' : '0.5px solid var(--border-color)',
              borderBottom: `2.5px solid ${STAGE_COLORS[stage]}`,
              cursor: 'pointer', transition: 'background var(--transition)',
            }}
              onClick={() => toggleCollapse(stage)}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontSize: 18, fontWeight: 700, color: STAGE_COLORS[stage], fontVariantNumeric: 'tabular-nums' }}>{opps.length}</div>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{stage}</div>
              {rev > 0 && <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--green)', fontWeight: 600, marginTop: 1 }}>{formatCurrency(rev)}</div>}
            </div>
          )
        })}
        {/* Pipeline totals */}
        <div style={{ padding: '10px 20px', borderLeft: '0.5px solid var(--border-color)', textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 }}>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.3px' }}>
            Vol: <span style={{ color: 'var(--so-blue)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{formatCurrency(totalVolume)}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.3px' }}>
            Rev: <span style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{formatCurrency(totalRevenue)}</span>
          </div>
        </div>
      </div>

      {/* Stage sections */}
      <div className="page-body">
        {OPPORTUNITY_STAGES.map(stage => {
          const opps = state.opportunities.filter(o => o.stage === stage).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          const stageRev = opps.reduce((s, o) => s + (o.expectedMonthlyRevenue || 0), 0)
          const stageVol = opps.reduce((s, o) => s + (o.expectedMonthlyVolume || 0), 0)
          const isCollapsed = collapsed[stage]

          return (
            <div key={stage} className="pipeline-stage-section" style={{ marginBottom: 14 }}>
              {/* Stage header */}
              <div
                className="pipeline-stage-header"
                style={{ background: STAGE_HEADER_BG[stage], borderLeft: `3px solid ${STAGE_COLORS[stage]}` }}
                onClick={() => toggleCollapse(stage)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: STAGE_COLORS[stage], display: 'inline-block' }} />
                  <span style={{ fontWeight: 600, fontSize: 13, color: STAGE_COLORS[stage] }}>{stage}</span>
                  <span style={{ background: 'var(--bg-card)', border: `1px solid ${STAGE_COLORS[stage]}44`, borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700, color: STAGE_COLORS[stage] }}>
                    {opps.length}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  {stageVol > 0 && (
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      Vol: <strong style={{ color: 'var(--so-blue)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(stageVol)}</strong>
                    </span>
                  )}
                  {stageRev > 0 && (
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      Rev: <strong style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(stageRev)}</strong>
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</span>
                </div>
              </div>

              {/* Stage rows */}
              {!isCollapsed && (
                opps.length === 0 ? (
                  <div style={{ padding: '16px 20px', fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic', background: 'var(--bg-card)' }}>
                    No opportunities in this stage.
                  </div>
                ) : (
                  <table className="data-table" style={{ borderRadius: 0 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 36 }}>#</th>
                        <th>Company</th>
                        <th>Contact</th>
                        <th>Monthly Vol.</th>
                        <th>Monthly Rev.</th>
                        <th>Priority</th>
                        <th>Close Date</th>
                        <th>Owner</th>
                        <th>NOB</th>
                        <th>Age</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {opps.map((opp, idx) => {
                        const age = daysDiff(opp.createdAt)
                        const isLate = opp.expectedCloseDate && new Date(opp.expectedCloseDate) < new Date() && !['Lost', 'Activated'].includes(opp.stage)
                        return (
                          <tr key={opp.id} onClick={() => setSelected(opp)}>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center' }}>{idx + 1}</td>
                            <td>
                              <div style={{ fontWeight: 700, fontSize: 13 }}>
                                {opp.companyName}
                                {opp.clientId && (
                                  <span style={{ fontWeight: 400, color: 'var(--text-tertiary)', fontSize: 11, marginLeft: 6 }}>— {opp.clientId}</span>
                                )}
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 1 }}>{opp.vertical}</div>
                            </td>
                            <td style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400 }}>{opp.contactPerson}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400 }}>{formatCurrency(opp.expectedMonthlyVolume)}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green)', fontWeight: 700 }}>{formatCurrency(opp.expectedMonthlyRevenue)}</td>
                            <td><PriorityBadge priority={opp.priority} /></td>
                            <td style={{ fontSize: 12, color: isLate ? 'var(--red)' : 'var(--text-secondary)', fontWeight: 400 }}>
                              {isLate && '⚠ '}{formatDate(opp.expectedCloseDate)}
                            </td>
                            <td style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400 }}>{opp.leadOwner?.split(' ')[0]}</td>
                            <td style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 400 }}>{opp.natureOfBusiness || '—'}</td>
                            <td style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', fontWeight: 400 }}>{age}d</td>
                            <td onClick={e => e.stopPropagation()}>
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button className="btn-icon" title="Move Stage" onClick={() => setStageModal(opp)}>⟳</button>
                                <button className="btn-icon" title="Open" onClick={() => setSelected(opp)}>↗</button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )
              )}
            </div>
          )
        })}
      </div>

      {showForm && <OpportunityForm onClose={() => setShowForm(false)} />}
      {editOpp && <OpportunityForm editOpp={editOpp} onClose={() => setEditOpp(null)} />}
      {stageModal && (
        <StageModal
          opportunity={stageModal}
          onClose={() => setStageModal(null)}
          onMove={args => moveStage(stageModal.id, args)}
        />
      )}
      {selected && (
        <OpportunityDetail
          opp={state.opportunities.find(o => o.id === selected.id) || selected}
          onClose={() => setSelected(null)}
          onEdit={() => { setEditOpp(selected); setSelected(null) }}
        />
      )}
    </div>
  )
}
