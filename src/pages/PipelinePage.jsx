import React, { useState } from 'react'
import { useCRM } from '../store/CRMContext'
import OpportunityDetail from '../components/opportunities/OpportunityDetail'
import OpportunityForm from '../components/opportunities/OpportunityForm'
import StageModal from '../components/opportunities/StageModal'
import { formatDate, formatCurrency, daysDiff } from '../utils/helpers'
import { OPPORTUNITY_STAGES, STAGE_COLORS } from '../data/constants'
import { PriorityBadge } from '../components/common/Badge'

// Stage display config
const STAGE_META = {
  Prospecting: { icon: '◎', dim: false },
  Won:         { icon: '✦', dim: false },
  Onboarded:   { icon: '✔', dim: false },
  Activated:   { icon: '⚡', dim: false },
  Lost:        { icon: '✕', dim: true  },
  'On Hold':   { icon: '⏸', dim: true  },
}

export default function PipelinePage() {
  const { state, dispatch } = useCRM()
  const [selected,  setSelected]  = useState(null)
  const [showForm,  setShowForm]  = useState(false)
  const [editOpp,   setEditOpp]   = useState(null)
  const [stageModal,setStageModal]= useState(null)
  const [collapsed, setCollapsed] = useState({ Lost: true, 'On Hold': true })

  const activeOpps    = state.opportunities.filter(o => !['Lost','On Hold'].includes(o.stage))
  const totalVolume   = activeOpps.reduce((s, o) => s + (o.expectedMonthlyVolume  || 0), 0)
  const totalRevenue  = activeOpps.reduce((s, o) => s + (o.expectedMonthlyRevenue || 0), 0)

  function toggle(stage) { setCollapsed(p => ({ ...p, [stage]: !p[stage] })) }

  function moveStage(id, args) {
    dispatch({ type: 'MOVE_STAGE', payload: { id, ...args } })
    setStageModal(null)
  }

  return (
    <div className="page">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>Pipeline</h2>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
            {activeOpps.length} active &nbsp;·&nbsp;
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--so-blue)' }}>{formatCurrency(totalVolume)}</span>
            &nbsp;volume &nbsp;·&nbsp;
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>{formatCurrency(totalRevenue)}</span>
            &nbsp;revenue
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ New Opportunity</button>
      </div>

      {/* ── Stage summary strip ───────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        flexShrink: 0,
      }}>
        {OPPORTUNITY_STAGES.map((stage, i) => {
          const opps = state.opportunities.filter(o => o.stage === stage)
          const rev  = opps.reduce((s, o) => s + (o.expectedMonthlyRevenue || 0), 0)
          const isLast = i === OPPORTUNITY_STAGES.length - 1
          const isDim  = STAGE_META[stage].dim

          return (
            <div
              key={stage}
              onClick={() => toggle(stage)}
              style={{
                padding: '14px 16px',
                borderRight: isLast ? 'none' : '1px solid var(--border-color)',
                borderTop: `3px solid ${isDim ? 'var(--border-color)' : STAGE_COLORS[stage]}`,
                cursor: 'pointer',
                opacity: isDim ? 0.7 : 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Stage label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 9, color: isDim ? 'var(--text-tertiary)' : STAGE_COLORS[stage] }}>
                  {STAGE_META[stage].icon}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  color: isDim ? 'var(--text-tertiary)' : STAGE_COLORS[stage],
                }}>
                  {stage}
                </span>
              </div>

              {/* Count */}
              <div style={{
                fontSize: 28, fontWeight: 800, lineHeight: 1,
                color: isDim ? 'var(--text-secondary)' : STAGE_COLORS[stage],
                fontVariantNumeric: 'tabular-nums',
                marginBottom: 4,
              }}>
                {opps.length}
              </div>

              {/* Revenue */}
              <div style={{
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

      {/* ── Stage sections ────────────────────────────────────────── */}
      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

        {OPPORTUNITY_STAGES.map(stage => {
          const opps   = state.opportunities.filter(o => o.stage === stage)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          const rev    = opps.reduce((s, o) => s + (o.expectedMonthlyRevenue || 0), 0)
          const vol    = opps.reduce((s, o) => s + (o.expectedMonthlyVolume  || 0), 0)
          const isOpen = !collapsed[stage]
          const isDim  = STAGE_META[stage].dim

          return (
            <div key={stage} style={{ borderBottom: '1px solid var(--border-color)' }}>

              {/* Stage header */}
              <div
                onClick={() => toggle(stage)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 20px', cursor: 'pointer', userSelect: 'none',
                  background: isOpen
                    ? `linear-gradient(90deg, ${STAGE_COLORS[stage]}0d, transparent)`
                    : 'var(--bg-secondary)',
                  borderLeft: `3px solid ${isDim ? 'var(--border-color)' : STAGE_COLORS[stage]}`,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'var(--bg-tertiary)' }}
                onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'var(--bg-secondary)' }}
              >
                {/* Left: stage info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
                    background: isDim ? 'var(--text-hint)' : STAGE_COLORS[stage],
                  }} />
                  <span style={{
                    fontSize: 13, fontWeight: 700,
                    color: isDim ? 'var(--text-secondary)' : STAGE_COLORS[stage],
                  }}>
                    {stage}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, minWidth: 22, textAlign: 'center',
                    padding: '1px 8px', borderRadius: 20,
                    background: isDim ? 'var(--bg-tertiary)' : `${STAGE_COLORS[stage]}18`,
                    color: isDim ? 'var(--text-tertiary)' : STAGE_COLORS[stage],
                    border: `1px solid ${isDim ? 'var(--border-color)' : STAGE_COLORS[stage]}40`,
                  }}>
                    {opps.length}
                  </span>
                </div>

                {/* Right: totals + chevron */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  {vol > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 9, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Volume</div>
                      <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--so-blue)' }}>
                        {formatCurrency(vol)}
                      </div>
                    </div>
                  )}
                  {rev > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 9, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Revenue</div>
                      <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--green)' }}>
                        {formatCurrency(rev)}
                      </div>
                    </div>
                  )}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="var(--text-tertiary)" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </div>

              {/* Rows */}
              {isOpen && (
                opps.length === 0 ? (
                  <div style={{
                    padding: '20px', textAlign: 'center',
                    fontSize: 12, color: 'var(--text-tertiary)',
                    background: 'var(--bg-card)',
                  }}>
                    No opportunities in this stage
                  </div>
                ) : (
                  <div style={{ background: 'var(--bg-card)' }}>
                    {/* Column headers */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 120px 120px 100px 80px 70px',
                      padding: '7px 20px',
                      background: 'var(--bg-tertiary)',
                      borderBottom: '1px solid var(--border-color)',
                      gap: 12,
                    }}>
                      {['Opportunity', 'Contact', 'Revenue / mo', 'Volume / mo', 'Close Date', 'Owner', ''].map((h, i) => (
                        <div key={i} style={{
                          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: '0.6px', color: 'var(--text-tertiary)',
                          textAlign: i >= 2 && i <= 4 ? 'right' : 'left',
                        }}>
                          {h}
                        </div>
                      ))}
                    </div>

                    {/* Deal rows */}
                    {opps.map((opp, idx) => {
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
                            gridTemplateColumns: '2fr 1fr 120px 120px 100px 80px 70px',
                            padding: '11px 20px',
                            gap: 12,
                            borderBottom: idx < opps.length - 1 ? '1px solid var(--border-color)' : 'none',
                            cursor: 'pointer',
                            transition: 'background 0.12s',
                            alignItems: 'center',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          {/* Opportunity name */}
                          <div>
                            <div style={{
                              fontWeight: 600, fontSize: 13,
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                              {opp.companyName}
                              {opp.clientId && (
                                <span style={{ fontWeight: 400, color: 'var(--text-tertiary)', fontSize: 11 }}>
                                  {' '}- {opp.clientId}
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                              <PriorityBadge priority={opp.priority} />
                              {age > 30 && (
                                <span style={{ fontSize: 10, color: 'var(--text-hint)', fontFamily: 'var(--font-mono)' }}>
                                  {age}d
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Contact */}
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {opp.contactPerson || '—'}
                          </div>

                          {/* Revenue */}
                          <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: 'var(--green)' }}>
                            {formatCurrency(opp.expectedMonthlyRevenue)}
                          </div>

                          {/* Volume */}
                          <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400 }}>
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
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {opp.leadOwner?.split(' ')[0] || '—'}
                          </div>

                          {/* Actions */}
                          <div
                            style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              className="btn-icon" title="Move Stage"
                              onClick={() => setStageModal(opp)}
                            >⟳</button>
                            <button
                              className="btn-icon" title="View Detail"
                              onClick={() => setSelected(opp)}
                            >↗</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              )}
            </div>
          )
        })}
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
