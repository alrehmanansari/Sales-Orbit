import React, { useState, useMemo } from 'react'
import { useCRM } from '../store/CRMContext'
import OpportunityDetail from '../components/opportunities/OpportunityDetail'
import OpportunityForm from '../components/opportunities/OpportunityForm'
import StageModal from '../components/opportunities/StageModal'
import { formatDate, formatCurrency, daysDiff, getDateRange, filterByDateRange } from '../utils/helpers'
import { OPPORTUNITY_STAGES, STAGE_COLORS, TIME_FILTERS } from '../data/constants'
import { PriorityBadge } from '../components/common/Badge'

// SVG action icons — consistent stroke style
const IconMoveStage = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
)
const IconViewDetail = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
)

// Grid columns: Opportunity | Contact | Priority | Phone | Email | Rev | Vol | Close | Owner | Actions
const GRID = '2fr 1fr 120px 1fr 52px 105px 105px 100px 70px 56px'

export default function PipelinePage() {
  const { state, dispatch } = useCRM()
  const [activeStage,  setActiveStage]  = useState(OPPORTUNITY_STAGES[0])
  const [selected,     setSelected]     = useState(null)
  const [showForm,     setShowForm]     = useState(false)
  const [editOpp,      setEditOpp]      = useState(null)
  const [stageModal,   setStageModal]   = useState(null)
  const [dateFilter,   setDateFilter]   = useState('this-month')
  const [customFrom,   setCustomFrom]   = useState('')
  const [customTo,     setCustomTo]     = useState('')

  // Apply date filter (uses shared getDateRange from helpers)
  const allOpps = useMemo(() => {
    if (dateFilter === 'custom') {
      return state.opportunities.filter(o => {
        const d = new Date(o.createdAt)
        if (customFrom && d < new Date(customFrom)) return false
        if (customTo   && d > new Date(customTo + 'T23:59:59')) return false
        return true
      })
    }
    return filterByDateRange(state.opportunities, 'createdAt', dateFilter)
  }, [state.opportunities, dateFilter, customFrom, customTo])

  const activeOpps   = allOpps.filter(o => !['Lost','On Hold'].includes(o.stage))
  const totalVolume  = activeOpps.reduce((s, o) => s + (o.expectedMonthlyVolume  || 0), 0)
  const totalRevenue = activeOpps.reduce((s, o) => s + (o.expectedMonthlyRevenue || 0), 0)

  function moveStage(id, args) {
    dispatch({ type: 'MOVE_STAGE', payload: { id, ...args } })
    setStageModal(null)
  }

  const stageOpps    = allOpps.filter(o => o.stage === activeStage).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const stageRevenue = stageOpps.reduce((s, o) => s + (o.expectedMonthlyRevenue || 0), 0)
  const stageVolume  = stageOpps.reduce((s, o) => s + (o.expectedMonthlyVolume  || 0), 0)

  const tabStyle = (v) => ({
    padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
    fontFamily: 'var(--font)', fontSize: 12, fontWeight: dateFilter === v ? 600 : 400,
    background: dateFilter === v ? 'var(--so-blue)' : 'transparent',
    color: dateFilter === v ? '#fff' : 'var(--text-secondary)',
    transition: 'all 0.15s', whiteSpace: 'nowrap',
  })

  return (
    <div className="page" style={{ overflow: 'hidden' }}>

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="page-header" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ margin: 0 }}>Pipeline</h2>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
            {activeOpps.length} active &nbsp;·&nbsp;
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--so-blue)' }}>{formatCurrency(totalVolume)}</span>
            &nbsp;vol &nbsp;·&nbsp;
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>{formatCurrency(totalRevenue)}</span>
            &nbsp;TC
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Date filter tabs */}
          <div style={{ display: 'flex', gap: 2, background: 'var(--bg-tertiary)', borderRadius: 22, padding: 3, border: '1px solid var(--border-color)' }}>
            {TIME_FILTERS.map(f => (
              <button key={f.value} style={tabStyle(f.value)} onClick={() => setDateFilter(f.value)}
                onMouseEnter={e => { if (dateFilter !== f.value) e.currentTarget.style.background = 'var(--bg-card)' }}
                onMouseLeave={e => { if (dateFilter !== f.value) e.currentTarget.style.background = 'transparent' }}
              >{f.label}</button>
            ))}
          </div>

          {/* Custom date range */}
          {dateFilter === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 12, fontFamily: 'var(--font)', outline: 'none' }}
              />
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>to</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 12, fontFamily: 'var(--font)', outline: 'none' }}
              />
            </div>
          )}

          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ New Opportunity</button>
        </div>
      </div>

      {/* ── Opportunities Progress Table ─────────────────────────────── */}
      {(() => {
        const allTeamUsers = (state.users || []).filter(u => u.isActive !== false)
        if (!allTeamUsers.length) return null
        const stages = OPPORTUNITY_STAGES
        const TH = { fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--text-tertiary)', padding: '6px 10px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', textAlign: 'center', whiteSpace: 'nowrap' }
        const TD = { fontSize: 11, padding: '6px 10px', borderBottom: '0.5px solid var(--border-color)', textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }
        return (
          <div style={{ padding: '10px 20px 0', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', flexShrink: 0, overflowX: 'auto' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-hint)', marginBottom: 8 }}>Opportunities Progress</div>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden', minWidth: 500 }}>
              <thead>
                <tr>
                  <th style={{ ...TH, textAlign: 'left' }}>BD</th>
                  {stages.map(s => <th key={s} style={TH}>{s}</th>)}
                </tr>
              </thead>
              <tbody>
                {allTeamUsers.map((u, i) => {
                  const counts = stages.map(s => allOpps.filter(o => o.leadOwner === u.name && o.stage === s).length)
                  const hasAny = counts.some(c => c > 0)
                  if (!hasAny) return null
                  return (
                    <tr key={u.userId} style={{ background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)' }}>
                      <td style={{ ...TD, textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font)', fontSize: 12 }}>{u.name}</td>
                      {counts.map((cnt, si) => (
                        <td key={si} style={{ ...TD, color: cnt > 0 ? 'var(--text-primary)' : 'var(--text-hint)', fontWeight: cnt > 0 ? 700 : 400 }}>{cnt || '—'}</td>
                      ))}
                    </tr>
                  )
                })}
                {/* Totals row */}
                <tr style={{ background: 'var(--bg-tertiary)', borderTop: '2px solid var(--border-strong-color)' }}>
                  <td style={{ ...TD, textAlign: 'left', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font)', fontSize: 11, borderTop: '1px solid var(--border-strong-color)' }}>Total</td>
                  {stages.map(s => {
                    const cnt = allOpps.filter(o => o.stage === s).length
                    return <td key={s} style={{ ...TD, fontWeight: 800, color: cnt > 0 ? 'var(--so-blue)' : 'var(--text-hint)', borderTop: '1px solid var(--border-strong-color)' }}>{cnt || '—'}</td>
                  })}
                </tr>
                {/* Vol row */}
                <tr style={{ background: 'var(--bg-tertiary)' }}>
                  <td style={{ ...TD, textAlign: 'left', fontWeight: 700, color: 'var(--so-blue)', fontFamily: 'var(--font)', fontSize: 11 }}>Total Vol</td>
                  {stages.map(s => {
                    const v = allOpps.filter(o => o.stage === s).reduce((a, o) => a + (o.expectedMonthlyVolume || 0), 0)
                    return <td key={s} style={{ ...TD, fontWeight: 700, color: v > 0 ? 'var(--so-blue)' : 'var(--text-hint)' }}>{v > 0 ? formatCurrency(v) : '—'}</td>
                  })}
                </tr>
                {/* TC row */}
                <tr style={{ background: 'var(--bg-tertiary)' }}>
                  <td style={{ ...TD, textAlign: 'left', fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font)', fontSize: 11 }}>Total TC</td>
                  {stages.map(s => {
                    const v = allOpps.filter(o => o.stage === s).reduce((a, o) => a + (o.expectedMonthlyRevenue || 0), 0)
                    return <td key={s} style={{ ...TD, fontWeight: 700, color: v > 0 ? 'var(--green)' : 'var(--text-hint)' }}>{v > 0 ? formatCurrency(v) : '—'}</td>
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )
      })()}

      {/* ── Separator ─────────────────────────────────────────────────── */}
      <div style={{ height: '0.5px', background: 'linear-gradient(90deg, transparent, var(--border-strong-color) 20%, var(--border-strong-color) 80%, transparent)', flexShrink: 0, margin: '4px 0' }} />

      {/* ── Opportunities Details label + Stage tabs ──────────────────── */}
      <div style={{ padding: '10px 20px 0', background: 'var(--bg-secondary)', flexShrink: 0, borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '1.6px', textTransform: 'uppercase', background: 'var(--so-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 8 }}>
          Opportunities Details
        </div>
        <div style={{ display: 'flex', gap: 2, overflowX: 'auto', paddingBottom: 0 }}>
          {OPPORTUNITY_STAGES.map(stage => {
            const count    = allOpps.filter(o => o.stage === stage).length
            const isActive = activeStage === stage
            const isDim    = ['Lost','On Hold'].includes(stage)
            return (
              <button key={stage} onClick={() => setActiveStage(stage)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '8px 14px 10px', border: 'none', cursor: 'pointer',
                  borderRadius: '10px 10px 0 0',
                  background: isActive ? 'var(--bg-card)' : 'transparent',
                  fontFamily: 'var(--font)', fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? STAGE_COLORS[stage] : 'var(--text-secondary)',
                  opacity: isDim && !isActive ? 0.55 : 1,
                  transition: 'all 0.15s', flexShrink: 0,
                  borderTop: isActive ? `2px solid ${STAGE_COLORS[stage]}` : '2px solid transparent',
                  borderLeft: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
                  borderRight: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
                  marginBottom: isActive ? -1 : 0,
                  position: 'relative', zIndex: isActive ? 1 : 0,
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)' } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' } }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: STAGE_COLORS[stage], flexShrink: 0 }} />
                {stage}
                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: isActive ? `${STAGE_COLORS[stage]}18` : 'var(--bg-tertiary)', color: isActive ? STAGE_COLORS[stage] : 'var(--text-tertiary)', border: `1px solid ${isActive ? STAGE_COLORS[stage] + '30' : 'var(--border-color)'}` }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Deals for selected stage ──────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, height: '100%' }}>

          {/* Stage sub-header */}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: STAGE_COLORS[activeStage], flexShrink: 0 }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: STAGE_COLORS[activeStage] }}>{activeStage}</span>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                background: `${STAGE_COLORS[activeStage]}18`, color: STAGE_COLORS[activeStage],
                border: `1px solid ${STAGE_COLORS[activeStage]}40`,
              }}>
                {stageOpps.length} {stageOpps.length === 1 ? 'deal' : 'deals'}
              </span>
            </div>
            {(stageVolume > 0 || stageRevenue > 0) && (
              <div style={{ display: 'flex', gap: 20 }}>
                {stageVolume > 0 && (
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Volume / mo</div>
                    <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--so-blue)' }}>{formatCurrency(stageVolume)}</div>
                  </div>
                )}
                {stageRevenue > 0 && (
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TC / mo</div>
                    <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>{formatCurrency(stageRevenue)}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Deals */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {stageOpps.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10 }}>
                <div style={{ fontSize: 32, opacity: 0.2 }}>◎</div>
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                  No opportunities in <strong>{activeStage}</strong>
                  {dateFilter !== 'this-month' && <span style={{ color: 'var(--text-hint)' }}> for this period</span>}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(true)}>+ Add One</button>
              </div>
            ) : (
              <>
                {/* Column headers */}
                <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '8px 20px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', gap: 10, position: 'sticky', top: 0, zIndex: 1 }}>
                  {[
                    { label: 'Opportunity',  align: 'left'  },
                    { label: 'Contact',      align: 'left'  },
                    { label: 'Phone',        align: 'left'  },
                    { label: 'Email',        align: 'left'  },
                    { label: 'Age',          align: 'right' },
                    { label: 'TC/mo',   align: 'right' },
                    { label: 'Volume/mo',    align: 'right' },
                    { label: 'Close Date',   align: 'right' },
                    { label: 'Owner',        align: 'left'  },
                    { label: '',             align: 'right' },
                  ].map((col, i) => (
                    <div key={i} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-tertiary)', textAlign: col.align }}>
                      {col.label}
                    </div>
                  ))}
                </div>

                {/* Deal rows */}
                {stageOpps.map(opp => {
                  const age    = daysDiff(opp.createdAt)
                  const isLate = opp.expectedCloseDate && new Date(opp.expectedCloseDate) < new Date() && !['Lost','Activated'].includes(opp.stage)

                  return (
                    <div
                      key={opp.id}
                      onClick={() => setSelected(opp)}
                      style={{ display: 'grid', gridTemplateColumns: GRID, padding: '12px 20px', gap: 10, borderBottom: '1px solid var(--border-color)', cursor: 'pointer', alignItems: 'center', transition: 'background 0.12s', background: 'var(--bg-card)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
                    >
                      {/* Opportunity */}
                      <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {opp.companyName}
                        {opp.clientId && <span style={{ fontWeight: 400, color: 'var(--text-tertiary)', fontSize: 11 }}> - {opp.clientId}</span>}
                      </div>

                      {/* Contact */}
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {opp.contactPerson || '—'}
                      </div>

                      {/* Phone */}
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {opp.phone || '—'}
                      </div>

                      {/* Email */}
                      <div style={{ fontSize: 11, color: 'var(--so-blue)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        onClick={e => { if (opp.email) { e.stopPropagation(); window.location.href = `mailto:${opp.email}` } }}
                      >
                        {opp.email || '—'}
                      </div>

                      {/* Age */}
                      <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', fontWeight: 400 }}>
                        {age}d
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
                      <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 400, color: isLate ? 'var(--red)' : 'var(--text-secondary)' }}>
                        {isLate && <span style={{ marginRight: 3 }}>⚠</span>}
                        {formatDate(opp.expectedCloseDate) || '—'}
                      </div>

                      {/* Owner */}
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {opp.leadOwner?.split(' ')[0] || '—'}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                        <button
                          className="btn-icon" title="Move Stage"
                          onClick={() => setStageModal(opp)}
                        >
                          <IconMoveStage />
                        </button>
                        <button
                          className="btn-icon" title="View Detail"
                          onClick={() => setSelected(opp)}
                        >
                          <IconViewDetail />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
            {/* Stage totals footer */}
            {stageOpps.length > 0 && (
              <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', display: 'flex', gap: 24, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}><strong style={{ color: 'var(--text-primary)' }}>{stageOpps.length}</strong> opportunities</span>
                {stageVolume > 0 && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Vol <strong style={{ color: 'var(--so-blue)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(stageVolume)}</strong></span>}
                {stageRevenue > 0 && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>TC <strong style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(stageRevenue)}</strong></span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────── */}
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
