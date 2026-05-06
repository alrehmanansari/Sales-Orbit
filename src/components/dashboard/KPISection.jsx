import React, { useState, useRef, useCallback } from 'react'
import { useKPI, QUARTERS, KPI_WEIGHTS, calcScore } from '../../store/KPIContext'
import { useAuth } from '../../store/AuthContext'
import { useCRM } from '../../store/CRMContext'

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

/* Inline editable cell */
function EditCell({ value, onChange, readOnly, isMoney }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value ?? 0))

  if (readOnly) return (
    <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: value > 0 ? 'var(--text-primary)' : 'var(--text-hint)', padding: '3px 8px' }}>
      {isMoney ? fmt(value) : (value || '—')}
    </div>
  )

  if (editing) return (
    <input autoFocus value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={() => { setEditing(false); onChange(draft) }}
      onKeyDown={e => { if (e.key === 'Enter') { setEditing(false); onChange(draft) } if (e.key === 'Escape') setEditing(false) }}
      style={{ width: 90, padding: '3px 8px', borderRadius: 6, border: '1.5px solid var(--so-blue)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, textAlign: 'right', outline: 'none' }}
    />
  )

  return (
    <div onClick={() => { setDraft(String(value ?? 0)); setEditing(true) }} title="Click to edit"
      style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: value > 0 ? 'var(--text-primary)' : 'var(--text-hint)', padding: '3px 8px', borderRadius: 6, cursor: 'pointer', border: '1px dashed transparent', transition: 'all 0.15s', minWidth: 80 }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--so-blue)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
    >
      {isMoney ? fmt(value) : (value || '0')}
    </div>
  )
}

/* Progress bar row */
function ProgressRow({ label, ach, target, isMoney, color }) {
  const p = pct(ach, target)
  const col = color || scoreColor(p)
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' }}>
          <span>{isMoney ? fmt(ach) : ach} / {isMoney ? fmt(target) : target}</span>
          <span style={{ fontWeight: 800, fontSize: 13, color: col, minWidth: 40, textAlign: 'right' }}>{p}%</span>
        </div>
      </div>
      <div style={{ height: 7, background: 'var(--bg-tertiary)', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        <div style={{ width: `${Math.min(p, 100)}%`, height: '100%', borderRadius: 6, background: `linear-gradient(90deg, ${col}88, ${col})`, transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)' }} />
      </div>
    </div>
  )
}

/* Score ring */
function ScoreRing({ score, size = 64, stroke = 5 }) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const col = scoreColor(score)
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border-color)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ - dash} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        style={{ transform: 'rotate(90deg)', transformOrigin: `${size/2}px ${size/2}px`, fontFamily: 'var(--font)', fontSize: size * 0.22, fontWeight: 800, fill: col }}>
        {score}%
      </text>
    </svg>
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

/* Copy section as image */
async function copyAsImage(el) {
  try {
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: null })
    canvas.toBlob(async blob => {
      if (!blob) return
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        alert('Copied to clipboard!')
      } catch {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = 'kpi.png'; a.click()
        URL.revokeObjectURL(url)
      }
    })
  } catch (e) { console.error('Copy failed:', e) }
}

function CopyBtn({ targetRef }) {
  return (
    <button onClick={() => targetRef.current && copyAsImage(targetRef.current)}
      title="Copy as HD image"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border-strong-color)', background: 'var(--bg-tertiary)', cursor: 'pointer', color: 'var(--text-tertiary)', transition: 'all 140ms ease', flexShrink: 0 }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--so-blue)'; e.currentTarget.style.color = 'var(--so-blue)'; e.currentTarget.style.background = 'var(--so-blue-soft)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong-color)'; e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = 'var(--bg-tertiary)' }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
    </button>
  )
}

export default function KPISection() {
  const { data, updateKPI } = useKPI()
  const { currentUser } = useAuth()
  const { state } = useCRM()
  const [quarter, setQuarter] = useState('Q2')
  const tableRef = useRef()
  const chartRef  = useRef()

  // Exclude only Head of MENA (no KPI targets); all other roles incl. Head of Sales can add KPIs
  const allUsers = (state.users || [])
    .filter(u => u.isActive !== false && u.designation !== 'Head of MENA')
    .map(u => u.name)
  const isYearly = quarter === 'Yearly'

  const KPI_ROWS = [
    { key: 'tc', label: 'TC',               targetKey: 'tcTarget', achKey: 'tcAch', weight: KPI_WEIGHTS.tc, isMoney: true,  color: SO.blue   },
    { key: 'ac', label: 'Activated Clients', targetKey: 'acTarget', achKey: 'acAch', weight: KPI_WEIGHTS.ac, isMoney: false, color: SO.purple },
  ]

  const TH  = { padding: '8px 12px', fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid var(--border-color)', textAlign: 'right', background: 'linear-gradient(to bottom, var(--bg-secondary), var(--bg-tertiary))' }
  const THL = { ...TH, textAlign: 'left' }

  return (
    <div style={{ marginBottom: 20 }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

        {/* ── Header ── */}
        <div style={{ padding: '14px 20px', background: 'linear-gradient(135deg, rgba(71,150,227,0.06), rgba(145,119,199,0.06))', borderBottom: '0.5px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--so-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(71,150,227,0.3)' }}>
              <span style={{ fontSize: 18 }}>🎯</span>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.2px', color: 'var(--text-primary)' }}>KPI Achievement</div>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 1 }}>
                {isYearly ? 'Yearly totals — switch to a quarter to edit' : `Quarter ${quarter} · Click any value to edit`}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="tabs">
              {ALL_TABS.map(q => (
                <button key={q} className={`tab ${quarter === q ? 'active' : ''}`} onClick={() => setQuarter(q)}>{q}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          <div className="kpi-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

            {/* ── LEFT: Editable team table ── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Team Targets &amp; Achievements — {isYearly ? 'Full Year' : quarter}
                </div>
                <CopyBtn targetRef={tableRef} label="Copy Table" />
              </div>

              <div ref={tableRef} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {KPI_ROWS.map(row => (
                  <div key={row.key} style={{ border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: `linear-gradient(90deg, ${row.color}10, transparent)`, borderBottom: '0.5px solid var(--border-color)' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: row.color }}>{row.label}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-hint)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 10 }}>{row.weight}% weight</span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ ...THL, background: 'transparent', padding: '6px 14px', borderBottom: '1px solid var(--border-color)' }}>BD</th>
                          <th style={{ ...TH, background: 'transparent', padding: '6px 8px', borderBottom: '1px solid var(--border-color)' }}>Target</th>
                          <th style={{ ...TH, background: 'transparent', padding: '6px 8px', borderBottom: '1px solid var(--border-color)' }}>Achieved</th>
                          <th style={{ ...TH, background: 'transparent', padding: '6px 8px', borderBottom: '1px solid var(--border-color)' }}>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allUsers.map((name, i) => {
                          const q      = isYearly ? yearlyQ(data, name) : (data.kpiData[name]?.[quarter] || {})
                          const target = q[row.targetKey] || 0
                          const ach    = q[row.achKey]    || 0
                          const p      = pct(ach, target)
                          const col    = scoreColor(p)
                          return (
                            <tr key={name} style={{ borderBottom: i < allUsers.length - 1 ? '0.5px solid var(--border-color)' : 'none', transition: 'background 120ms' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              <td style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{name.split(' ')[0]}</td>
                              <td style={{ padding: '4px 4px' }}>
                                <EditCell value={target} isMoney={row.isMoney} readOnly={isYearly} onChange={v => updateKPI(name, quarter, row.targetKey, v)} />
                              </td>
                              <td style={{ padding: '4px 4px' }}>
                                <EditCell value={ach} isMoney={row.isMoney} readOnly={isYearly} onChange={v => updateKPI(name, quarter, row.achKey, v)} />
                              </td>
                              <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 800, color: col }}>{p}%</td>
                            </tr>
                          )
                        })}
                        {/* Totals */}
                        {allUsers.length > 0 && (
                          <tr style={{ background: 'var(--bg-tertiary)', borderTop: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '6px 14px', fontSize: 11, fontWeight: 800, color: 'var(--text-primary)' }}>Total</td>
                            <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                              {row.isMoney ? fmt(allUsers.reduce((s, n) => { const q = isYearly ? yearlyQ(data, n) : (data.kpiData[n]?.[quarter] || {}); return s + (q[row.targetKey] || 0) }, 0)) : allUsers.reduce((s, n) => { const q = isYearly ? yearlyQ(data, n) : (data.kpiData[n]?.[quarter] || {}); return s + (q[row.targetKey] || 0) }, 0)}
                            </td>
                            <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: row.color }}>
                              {row.isMoney ? fmt(allUsers.reduce((s, n) => { const q = isYearly ? yearlyQ(data, n) : (data.kpiData[n]?.[quarter] || {}); return s + (q[row.achKey] || 0) }, 0)) : allUsers.reduce((s, n) => { const q = isYearly ? yearlyQ(data, n) : (data.kpiData[n]?.[quarter] || {}); return s + (q[row.achKey] || 0) }, 0)}
                            </td>
                            <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 800, color: scoreColor(pct(
                              allUsers.reduce((s, n) => { const q = isYearly ? yearlyQ(data, n) : (data.kpiData[n]?.[quarter] || {}); return s + (q[row.achKey] || 0) }, 0),
                              allUsers.reduce((s, n) => { const q = isYearly ? yearlyQ(data, n) : (data.kpiData[n]?.[quarter] || {}); return s + (q[row.targetKey] || 0) }, 0)
                            )) }}>
                              {pct(allUsers.reduce((s, n) => { const q = isYearly ? yearlyQ(data, n) : (data.kpiData[n]?.[quarter] || {}); return s + (q[row.achKey] || 0) }, 0), allUsers.reduce((s, n) => { const q = isYearly ? yearlyQ(data, n) : (data.kpiData[n]?.[quarter] || {}); return s + (q[row.targetKey] || 0) }, 0))}%
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ))}
                {isYearly && <div style={{ fontSize: 10, color: 'var(--text-hint)', textAlign: 'center' }}>📊 Yearly totals — switch to Q2 / Q3 / Q4 to edit</div>}
              </div>
            </div>

            {/* ── RIGHT: Visualizations ── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Achievement — {isYearly ? 'Full Year' : quarter}
                </div>
                <CopyBtn targetRef={chartRef} label="Copy Chart" />
              </div>

              <div ref={chartRef} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Score cards per BD */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {allUsers.map((name, i) => {
                    const q = isYearly ? yearlyQ(data, name) : (data.kpiData[name]?.[quarter] || {})
                    const score = calcScore(q)
                    return (
                      <div key={name} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, boxShadow: 'var(--shadow-xs)', minWidth: 130 }}>
                        <ScoreRing score={score} size={52} stroke={4} />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{name.split(' ')[0]}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>{name.split(' ').slice(1).join(' ')}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Progress bars — team aggregate */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '16px 18px', boxShadow: 'var(--shadow-xs)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-tertiary)', marginBottom: 12 }}>Team Aggregate</div>
                  {KPI_ROWS.map(row => {
                    const totTarget = allUsers.reduce((s, n) => { const q = isYearly ? yearlyQ(data, n) : (data.kpiData[n]?.[quarter] || {}); return s + (q[row.targetKey] || 0) }, 0)
                    const totAch    = allUsers.reduce((s, n) => { const q = isYearly ? yearlyQ(data, n) : (data.kpiData[n]?.[quarter] || {}); return s + (q[row.achKey]    || 0) }, 0)
                    return <ProgressRow key={row.key} label={row.label} ach={totAch} target={totTarget || 1} isMoney={row.isMoney} color={row.color} />
                  })}
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
