import React, { useState } from 'react'
import { useCRM } from '../store/CRMContext'
import OpportunityDetail from '../components/opportunities/OpportunityDetail'
import OpportunityForm from '../components/opportunities/OpportunityForm'
import StageModal from '../components/opportunities/StageModal'
import { formatDate, formatCurrency, daysDiff } from '../utils/helpers'
import { OPPORTUNITY_STAGES, STAGE_COLORS } from '../data/constants'
import { PriorityBadge } from '../components/common/Badge'

export default function PipelinePage() {
  const { state, dispatch } = useCRM()
  const [activeStage,  setActiveStage]  = useState(OPPORTUNITY_STAGES[0])
  const [selected,     setSelected]     = useState(null)
  const [showForm,     setShowForm]     = useState(false)
  const [editOpp,      setEditOpp]      = useState(null)
  const [stageModal,   setStageModal]   = useState(null)

  const activeOpps   = state.opportunities.filter(o => !['Lost','On Hold'].includes(o.stage))
  const totalVolume  = activeOpps.reduce((s, o) => s + (o.expectedMonthlyVolume  || 0), 0)
  const totalRevenue = activeOpps.reduce((s, o) => s + (o.expectedMonthlyRevenue || 0), 0)

  function moveStage(id, args) {
    dispatch({ type: 'MOVE_STAGE', payload: { id, ...args } })
    setStageModal(null)
  }

  // Opportunities for the currently selected stage
  const stageOpps = state.opportunities
    .filter(o => o.stage === activeStage)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const stageRevenue = stageOpps.reduce((s, o) => s + (o.expectedMonthlyRevenue || 0), 0)
  const stageVolume  = stageOpps.reduce((s, o) => s + (o.expectedMonthlyVolume  || 0), 0)

  return (
    <div className="page" style={{ overflow: 'hidden' }}>

      {/* ── Page header ────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>Pipeline</h2>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
            {activeOpps.length} active &nbsp;·&nbsp;
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--so-blue)' }}>{formatCurrency(totalVolume)}</span>
            &nbsp;vol &nbsp;·&nbsp;
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>{formatCurrency(totalRevenue)}</span>
            &nbsp;rev
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ New Opportunity</button>
      </div>

      {/* ── Split layout ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* ── LEFT: stage list ─────────────────────────────────────── */}
        <div style={{
          width: 210, flexShrink: 0,
          borderRight: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '10px 14px 6px',
            fontSize: 9, fontWeight: 700, letterSpacing: '1.4px',
            textTransform: 'uppercase', color: 'var(--text-hint)',
          }}>
            Stages
          </div>

          {OPPORTUNITY_STAGES.map(stage => {
            const opps    = state.opportunities.filter(o => o.stage === stage)
            const rev     = opps.reduce((s, o) => s + (o.expectedMonthlyRevenue || 0), 0)
            const isActive = activeStage === stage
            const isDim    = ['Lost','On Hold'].includes(stage)

            return (
              <div
                key={stage}
                onClick={() => setActiveStage(stage)}
                style={{
                  padding: '11px 16px',
                  cursor: 'pointer',
                  borderLeft: `3px solid ${isActive ? STAGE_COLORS[stage] : 'transparent'}`,
                  background: isActive
                    ? `linear-gradient(90deg, ${STAGE_COLORS[stage]}14, ${STAGE_COLORS[stage]}06)`
                    : 'transparent',
                  opacity: isDim && !isActive ? 0.65 : 1,
                  transition: 'background 0.14s',
                  borderBottom: '0.5px solid var(--border-color)',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-tertiary)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                {/* Stage name row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: STAGE_COLORS[stage],
                    }} />
                    <span style={{
                      fontSize: 13, fontWeight: isActive ? 700 : 500,
                      color: isActive ? STAGE_COLORS[stage] : 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                    }}>
                      {stage}
                    </span>
                  </div>
                  {/* Count badge */}
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    minWidth: 20, textAlign: 'center',
                    padding: '1px 7px', borderRadius: 20,
                    background: isActive ? `${STAGE_COLORS[stage]}22` : 'var(--bg-tertiary)',
                    color: isActive ? STAGE_COLORS[stage] : 'var(--text-tertiary)',
                    border: isActive ? `1px solid ${STAGE_COLORS[stage]}44` : '1px solid var(--border-color)',
                    flexShrink: 0,
                  }}>
                    {opps.length}
                  </span>
                </div>

                {/* Revenue */}
                <div style={{
                  marginTop: 4, marginLeft: 16,
                  fontSize: 11, fontFamily: 'var(--font-mono)',
                  color: rev > 0 ? 'var(--green)' : 'var(--text-hint)',
                  fontWeight: rev > 0 ? 600 : 400,
                }}>
                  {rev > 0 ? formatCurrency(rev) : '—'}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── RIGHT: opportunities for selected stage ───────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Stage sub-header */}
          <div style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0, flexWrap: 'wrap', gap: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: STAGE_COLORS[activeStage], flexShrink: 0 }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: STAGE_COLORS[activeStage] }}>{activeStage}</span>
              <span style={{
                fontSize: 12, fontWeight: 700,
                padding: '2px 10px', borderRadius: 20,
                background: `${STAGE_COLORS[activeStage]}18`,
                color: STAGE_COLORS[activeStage],
                border: `1px solid ${STAGE_COLORS[activeStage]}40`,
              }}>
                {stageOpps.length} {stageOpps.length === 1 ? 'deal' : 'deals'}
              </span>
            </div>

            {/* Stage totals */}
            {(stageVolume > 0 || stageRevenue > 0) && (
              <div style={{ display: 'flex', gap: 20 }}>
                {stageVolume > 0 && (
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Volume / mo</div>
                    <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--so-blue)' }}>
                      {formatCurrency(stageVolume)}
                    </div>
                  </div>
                )}
                {stageRevenue > 0 && (
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Revenue / mo</div>
                    <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>
                      {formatCurrency(stageRevenue)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Opportunities list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {stageOpps.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: '100%', gap: 10,
              }}>
                <div style={{ fontSize: 32, opacity: 0.25 }}>◎</div>
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No opportunities in <strong>{activeStage}</strong></div>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(true)}>+ Add One</button>
              </div>
            ) : (
              <>
                {/* Column headers */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 120px 120px 110px 80px 68px',
                  padding: '8px 20px',
                  background: 'var(--bg-tertiary)',
                  borderBottom: '1px solid var(--border-color)',
                  gap: 12, position: 'sticky', top: 0, zIndex: 1,
                }}>
                  {[
                    { label: 'Opportunity', align: 'left' },
                    { label: 'Contact',     align: 'left' },
                    { label: 'Revenue/mo',  align: 'right' },
                    { label: 'Volume/mo',   align: 'right' },
                    { label: 'Close Date',  align: 'right' },
                    { label: 'Owner',       align: 'left' },
                    { label: '',            align: 'right' },
                  ].map((col, i) => (
                    <div key={i} style={{
                      fontSize: 10, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.6px',
                      color: 'var(--text-tertiary)',
                      textAlign: col.align,
                    }}>
                      {col.label}
                    </div>
                  ))}
                </div>

                {/* Deal rows */}
                {stageOpps.map((opp, idx) => {
                  const age    = daysDiff(opp.createdAt)
                  const isLate = opp.expectedCloseDate
                    && new Date(opp.expectedCloseDate) < new Date()
                    && !['Lost','Activated'].includes(opp.stage)

                  return (
                    <div
                      key={opp.id}
                      onClick={() => setSelected(opp)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 120px 120px 110px 80px 68px',
                        padding: '13px 20px',
                        gap: 12,
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        alignItems: 'center',
                        transition: 'background 0.12s',
                        background: 'var(--bg-card)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
                    >
                      {/* Opportunity */}
                      <div>
                        <div style={{
                          fontWeight: 600, fontSize: 13,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          color: 'var(--text-primary)',
                        }}>
                          {opp.companyName}
                          {opp.clientId && (
                            <span style={{ fontWeight: 400, color: 'var(--text-tertiary)', fontSize: 11 }}>
                              {' '}- {opp.clientId}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                          <PriorityBadge priority={opp.priority} />
                          <span style={{ fontSize: 10, color: 'var(--text-hint)', fontFamily: 'var(--font-mono)' }}>
                            {age}d
                          </span>
                        </div>
                      </div>

                      {/* Contact */}
                      <div style={{
                        fontSize: 12, color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {opp.contactPerson || '—'}
                      </div>

                      {/* Revenue */}
                      <div style={{
                        textAlign: 'right', fontFamily: 'var(--font-mono)',
                        fontWeight: 700, fontSize: 13, color: 'var(--green)',
                      }}>
                        {formatCurrency(opp.expectedMonthlyRevenue)}
                      </div>

                      {/* Volume */}
                      <div style={{
                        textAlign: 'right', fontFamily: 'var(--font-mono)',
                        fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400,
                      }}>
                        {formatCurrency(opp.expectedMonthlyVolume)}
                      </div>

                      {/* Close date */}
                      <div style={{
                        textAlign: 'right', fontSize: 12, fontWeight: 400,
                        color: isLate ? 'var(--red)' : 'var(--text-secondary)',
                      }}>
                        {isLate && <span style={{ marginRight: 3 }}>⚠</span>}
                        {formatDate(opp.expectedCloseDate) || '—'}
                      </div>

                      {/* Owner */}
                      <div style={{
                        fontSize: 12, color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {opp.leadOwner?.split(' ')[0] || '—'}
                      </div>

                      {/* Actions */}
                      <div
                        style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <button className="btn-icon" title="Move Stage" onClick={() => setStageModal(opp)}>⟳</button>
                        <button className="btn-icon" title="View Detail" onClick={() => setSelected(opp)}>↗</button>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────── */}
      {showForm && <OpportunityForm onClose={() => setShowForm(false)} />}
      {editOpp  && <OpportunityForm editOpp={editOpp} onClose={() => setEditOpp(null)} />}
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
