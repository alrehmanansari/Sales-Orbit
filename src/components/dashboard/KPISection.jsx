import React, { useState } from 'react'
import { useKPI, QUARTERS, KPI_WEIGHTS, calcScore } from '../../store/KPIContext'
import { useAuth } from '../../store/AuthContext'
import { useCRM } from '../../store/CRMContext'
import { MANAGER_DESIGNATIONS } from '../../data/constants'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell, LabelList
} from 'recharts'

const SO = { blue: '#4796E3', purple: '#9177C7', pink: '#CA6673', green: '#1E8E3E', orange: '#E37400' }
const BRAND = [SO.blue, SO.purple, SO.pink, SO.green, SO.orange]
const ALL_TABS = ['Q2', 'Q3', 'Q4', 'Yearly']

function scoreColor(s) {
  if (s >= 80) return SO.green
  if (s >= 50) return SO.orange
  return SO.pink
}

function pct(ach, target) {
  if (!target) return 0
  return Math.min(Math.round((ach / target) * 100), 999)
}

function fmt(n) {
  if (!n) return '—'
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`
  return `$${n}`
}

/* Yearly aggregate for one user */
function yearlyQ(data, name) {
  return QUARTERS.reduce((acc, q) => {
    const d = data.kpiData[name]?.[q] || {}
    return {
      tcTarget: acc.tcTarget + (d.tcTarget || 0),
      tcAch:    acc.tcAch    + (d.tcAch    || 0),
      acTarget: acc.acTarget + (d.acTarget || 0),
      acAch:    acc.acAch    + (d.acAch    || 0),
    }
  }, { tcTarget: 0, tcAch: 0, acTarget: 0, acAch: 0 })
}

/* Inline editable number cell */
function EditCell({ value, onChange, readOnly, isMoney }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value ?? 0))

  if (readOnly) {
    return (
      <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: value > 0 ? 'var(--text-primary)' : 'var(--text-hint)', padding: '3px 6px' }}>
        {isMoney ? fmt(value) : (value || '—')}
      </div>
    )
  }

  if (editing) {
    return (
      <input autoFocus value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => { setEditing(false); onChange(draft) }}
        onKeyDown={e => { if (e.key === 'Enter') { setEditing(false); onChange(draft) } if (e.key === 'Escape') setEditing(false) }}
        style={{
          width: 90, padding: '3px 8px', borderRadius: 6,
          border: '1.5px solid var(--so-blue)',
          background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
          fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
          textAlign: 'right', outline: 'none'
        }}
      />
    )
  }

  return (
    <div onClick={() => { setDraft(String(value ?? 0)); setEditing(true) }}
      title="Click to edit"
      style={{
        textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
        color: value > 0 ? 'var(--text-primary)' : 'var(--text-hint)',
        padding: '3px 8px', borderRadius: 6, cursor: 'pointer',
        border: '1px dashed transparent', transition: 'all 0.15s',
        minWidth: 80
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--so-blue)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
    >
      {isMoney ? fmt(value) : (value || '0')}
    </div>
  )
}

/* Achievement bar */
function AchBar({ label, ach, target, weight, isMoney }) {
  const p = pct(ach, target)
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
          {label}
          <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 400 }}>({weight}% weight)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          <span>{isMoney ? fmt(ach) : ach} / {isMoney ? fmt(target) : target}</span>
          <span style={{ fontWeight: 800, fontSize: 13, color: scoreColor(p), minWidth: 40, textAlign: 'right' }}>{p}%</span>
        </div>
      </div>
      <div style={{ height: 8, background: 'var(--border-color)', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{
          width: `${Math.min(p, 100)}%`, height: '100%', borderRadius: 6,
          background: `linear-gradient(90deg, ${scoreColor(p)}88, ${scoreColor(p)})`,
          transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)'
        }} />
      </div>
    </div>
  )
}

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '8px 12px', fontSize: 11, boxShadow: 'var(--shadow)' }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.fill }}>{p.name}: {p.value}%</div>)}
    </div>
  )
}

export default function KPISection() {
  const { data, updateKPI } = useKPI()
  const { currentUser } = useAuth()
  const { state } = useCRM()
  const [quarter, setQuarter] = useState('Q2')
  const [view, setView] = useState('my')

  /* Signed-up BD users (Reps) — excludes managers */
  const bdUsers = (state.users || [])
    .filter(u => u.isActive !== false && u.role === 'Rep')
    .map(u => u.name)

  const isManager = MANAGER_DESIGNATIONS.includes(currentUser?.designation) || currentUser?.role === 'Manager'
  const userName  = currentUser?.name || ''
  const isYearly  = quarter === 'Yearly'

  /* Current user's KPI data for selected period */
  const myQ = isYearly
    ? yearlyQ(data, userName)
    : (data.kpiData[userName]?.[quarter] || {})

  const myScore = calcScore(myQ)

  /* Team chart data — signed-up BDs only */
  const teamChart = bdUsers.map((name, i) => {
    const q = isYearly ? yearlyQ(data, name) : (data.kpiData[name]?.[quarter] || {})
    return { name: name.split(' ')[0], score: calcScore(q), color: BRAND[i % BRAND.length] }
  })

  const KPI_ROWS = [
    { key: 'tc', label: 'TC',               targetKey: 'tcTarget', achKey: 'tcAch', weight: KPI_WEIGHTS.tc, isMoney: true },
    { key: 'ac', label: 'Activated Clients', targetKey: 'acTarget', achKey: 'acAch', weight: KPI_WEIGHTS.ac, isMoney: false },
  ]

  /* Column header style */
  const TH = { padding: '6px 10px', fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid var(--border-color)', textAlign: 'right', background: 'var(--bg-tertiary)' }
  const THL = { ...TH, textAlign: 'left' }

  return (
    <div style={{ marginBottom: 20 }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          padding: '14px 20px',
          background: 'linear-gradient(135deg, rgba(71,150,227,0.05), rgba(145,119,199,0.05))',
          borderBottom: '0.5px solid var(--border-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🎯</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.2px' }}>KPIs Achievement</div>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 1 }}>
                Click any value to edit · {isYearly ? 'Yearly totals — edit per quarter (Q2/Q3/Q4)' : `Quarter ${quarter}`}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {isManager && (
              <div className="tabs" style={{ marginRight: 6 }}>
                <button className={`tab ${view === 'my' ? 'active' : ''}`} onClick={() => setView('my')}>My KPIs</button>
                <button className={`tab ${view === 'team' ? 'active' : ''}`} onClick={() => setView('team')}>Team KPIs</button>
              </div>
            )}
            <div className="tabs">
              {ALL_TABS.map(q => (
                <button key={q} className={`tab ${quarter === q ? 'active' : ''}`} onClick={() => setQuarter(q)}>{q}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: 20 }}>
          <div className="kpi-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

            {/* ── LEFT: Input table ── */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
                {view === 'team' && isManager ? 'Team Targets & Achievements' : `${userName || 'Your'} KPIs`}
                {' — '}{isYearly ? 'Full Year' : quarter}
              </div>

              {/* MY KPIs table */}
              {view === 'my' && (
                <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <thead>
                    <tr>
                      <th style={THL}>KPI</th>
                      <th style={TH}>Target</th>
                      <th style={TH}>Achieved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {KPI_ROWS.map((row, i) => {
                      const target = myQ[row.targetKey] || 0
                      const ach    = myQ[row.achKey]    || 0
                      return (
                        <tr key={row.key} style={{ borderBottom: i < KPI_ROWS.length - 1 ? '0.5px solid var(--border-color)' : 'none' }}>
                          <td style={{ padding: '10px 10px', fontSize: 13, fontWeight: 600 }}>{row.label}</td>
                          <td style={{ padding: '6px 4px' }}>
                            <EditCell value={target} isMoney={row.isMoney} readOnly={isYearly}
                              onChange={v => updateKPI(userName, quarter, row.targetKey, v)} />
                          </td>
                          <td style={{ padding: '6px 4px' }}>
                            <EditCell value={ach} isMoney={row.isMoney} readOnly={isYearly}
                              onChange={v => updateKPI(userName, quarter, row.achKey, v)} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}

              {/* TEAM KPIs — grouped by KPI (TC section, then Activated Clients section) */}
              {view === 'team' && isManager && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {KPI_ROWS.map(row => (
                    <div key={row.key} style={{ border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden' }}>

                      {/* KPI section header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: 'var(--bg-tertiary)', borderBottom: '0.5px solid var(--border-color)' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{row.label}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{row.weight}% weight</span>
                      </div>

                      {/* All BDs for this KPI */}
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ ...THL, background: 'transparent', padding: '5px 14px' }}>BD</th>
                            <th style={{ ...TH,  background: 'transparent', padding: '5px 8px'  }}>Target</th>
                            <th style={{ ...TH,  background: 'transparent', padding: '5px 8px'  }}>Achieved</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bdUsers.map((name, i) => {
                            const q      = isYearly ? yearlyQ(data, name) : (data.kpiData[name]?.[quarter] || {})
                            const target = q[row.targetKey] || 0
                            const ach    = q[row.achKey]    || 0
                            const p      = pct(ach, target)
                            return (
                              <tr key={name} style={{ borderBottom: i < bdUsers.length - 1 ? '0.5px solid var(--border-color)' : 'none' }}>
                                <td style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600 }}>{name.split(' ')[0]}</td>
                                <td style={{ padding: '4px 4px' }}>
                                  <EditCell value={target} isMoney={row.isMoney} readOnly={isYearly}
                                    onChange={v => updateKPI(name, quarter, row.targetKey, v)} />
                                </td>
                                <td style={{ padding: '4px 4px' }}>
                                  <EditCell value={ach} isMoney={row.isMoney} readOnly={isYearly}
                                    onChange={v => updateKPI(name, quarter, row.achKey, v)} />
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  ))}
                  {isYearly && (
                    <div style={{ fontSize: 10, color: 'var(--text-hint)' }}>
                      📊 Yearly totals — switch to Q2 / Q3 / Q4 to edit
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── RIGHT: Achievement visualization ── */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>
                Achievement — {isYearly ? 'Full Year' : quarter}
              </div>

              {/* MY achievement bars */}
              {view === 'my' && (
                <>
                  <AchBar label="TC"               ach={myQ.tcAch||0} target={myQ.tcTarget||1} weight={KPI_WEIGHTS.tc} isMoney />
                  <AchBar label="Activated Clients" ach={myQ.acAch||0} target={myQ.acTarget||1} weight={KPI_WEIGHTS.ac} />
                </>
              )}

              {/* TEAM — achievement bars per KPI */}
              {view === 'team' && isManager && (
                <>
                  {KPI_ROWS.map(row => {
                    const totTarget = bdUsers.reduce((s, n) => { const q = isYearly ? yearlyQ(data, n) : (data.kpiData[n]?.[quarter] || {}); return s + (q[row.targetKey] || 0) }, 0)
                    const totAch    = bdUsers.reduce((s, n) => { const q = isYearly ? yearlyQ(data, n) : (data.kpiData[n]?.[quarter] || {}); return s + (q[row.achKey]    || 0) }, 0)
                    return <AchBar key={row.key} label={row.label} ach={totAch} target={totTarget || 1} weight={row.weight} isMoney={row.isMoney} />
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
