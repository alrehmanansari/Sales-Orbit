import React, { useState, useRef, useMemo } from 'react'
import { useKPI, QUARTERS, KPI_WEIGHTS, calcScore } from '../../store/KPIContext'
import { useAuth } from '../../store/AuthContext'
import { useCRM } from '../../store/CRMContext'
import { OPPORTUNITY_STAGES } from '../../data/constants'
import { formatCurrency } from '../../utils/helpers'

const SO = { blue: '#4796E3', purple: '#9177C7', pink: '#CA6673', green: '#1E8E3E', orange: '#E37400' }
const ALL_TABS = ['Q2', 'Q3', 'Q4', 'Yearly']
const VERTICALS_SA = ['IT Services', 'Ecom Seller', 'B2B Seller', 'Freelancer']

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
      style={{ width: 80, padding: '3px 8px', borderRadius: 6, border: '1.5px solid var(--so-blue)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, textAlign: 'right', outline: 'none' }}
    />
  )

  return (
    <div onClick={() => { setDraft(String(value ?? 0)); setEditing(true) }} title="Click to edit"
      style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: value > 0 ? 'var(--text-primary)' : 'var(--text-hint)', padding: '3px 8px', borderRadius: 6, cursor: 'pointer', border: '1px dashed transparent', transition: 'all 0.15s', minWidth: 60 }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--so-blue)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
    >
      {isMoney ? fmt(value) : (value || '0')}
    </div>
  )
}

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

function ScoreRing({ score, size = 56, stroke = 4 }) {
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

/* Shared table header / cell styles */
const TH = {
  padding: '7px 10px', fontSize: 9.5, fontWeight: 700, color: 'var(--text-tertiary)',
  textTransform: 'uppercase', letterSpacing: '0.7px',
  borderBottom: '1px solid var(--border-color)',
  background: 'linear-gradient(to bottom, var(--bg-secondary), var(--bg-tertiary))',
  whiteSpace: 'nowrap', textAlign: 'center',
}
const THL = { ...TH, textAlign: 'left' }
const TD = {
  padding: '6px 10px', fontSize: 11,
  borderBottom: '0.5px solid var(--border-color)',
  fontFamily: 'var(--font-mono)', textAlign: 'center', color: 'var(--text-secondary)',
}
const TDL = { ...TD, textAlign: 'left', fontFamily: 'var(--font)', fontWeight: 600, color: 'var(--text-primary)' }

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--text-hint)', marginBottom: 10 }}>
      {children}
    </div>
  )
}

function Separator() {
  return <div style={{ height: '1px', background: 'var(--border-color)', margin: '28px 0 24px' }} />
}

export default function KPISection() {
  const { data, updateKPI } = useKPI()
  const { currentUser } = useAuth()
  const { state } = useCRM()
  const [quarter, setQuarter] = useState('Q2')
  const sectionRef = useRef()

  /* ── User list (deduplicated) ── */
  const baseUsers = (state.users || [])
    .filter(u => u.isActive !== false && u.designation !== 'Head of MENA')
    .map(u => u.name)
  const allUsers = [...new Set(currentUser?.name ? [...baseUsers, currentUser.name] : baseUsers)]
  const isYearly = quarter === 'Yearly'

  const KPI_ROWS = [
    { key: 'tc', label: 'TC',               targetKey: 'tcTarget', achKey: 'tcAch', weight: KPI_WEIGHTS.tc, isMoney: true,  color: SO.blue   },
    { key: 'ac', label: 'Activated Clients', targetKey: 'acTarget', achKey: 'acAch', weight: KPI_WEIGHTS.ac, isMoney: false, color: SO.purple },
  ]

  /* ── Sales Activity data ── */
  const entityVerticalMap = useMemo(() => {
    const map = {}
    state.leads.forEach(l => { if (l.id) map[l.id] = l.vertical })
    state.opportunities.forEach(o => { if (o.id) map[o.id] = o.vertical })
    return map
  }, [state.leads, state.opportunities])

  const salesActivityRows = useMemo(() => allUsers.map(name => {
    const calls = state.activities.filter(a => a.type === 'Call' && a.loggedBy === name)
    return {
      name,
      discoveryCalls: calls.filter(a => a.callType === 'Discovery Call').length,
      vertCalls: VERTICALS_SA.map(v => calls.filter(a => entityVerticalMap[a.entityId] === v).length),
      connected: calls.filter(a => a.callOutcome?.startsWith('Connected')).length,
      notResponded: calls.filter(a => a.callOutcome === 'Not Responded').length,
    }
  }), [allUsers, state.activities, entityVerticalMap])

  /* ── Conversion Ratio data ── */
  const conversionRows = useMemo(() => allUsers.map(name => {
    const userLeads = state.leads.filter(l => l.leadOwner === name)
    const created = userLeads.length
    const contacted = userLeads.filter(l => ['Contacted', 'Qualified', 'Converted'].includes(l.status)).length
    const opps = state.opportunities.filter(o => o.leadOwner === name).length
    const conversion = contacted > 0 ? Math.round((opps / contacted) * 100) : 0
    return { name, created, contacted, opps, conversion }
  }), [allUsers, state.leads, state.opportunities])

  /* ── Opportunities Progress data (all-time, same as Pipeline table) ── */
  const allActiveUserNames = useMemo(() =>
    [...new Set((state.users || []).filter(u => u.isActive !== false).map(u => u.name))]
  , [state.users])

  const oppProgressRows = useMemo(() =>
    allActiveUserNames.map(name => ({
      name,
      counts: OPPORTUNITY_STAGES.map(s =>
        state.opportunities.filter(o => o.leadOwner === name && o.stage === s).length
      ),
    })).filter(r => r.counts.some(c => c > 0))
  , [allActiveUserNames, state.opportunities])

  /* ── KPI table for one row (TC or AC) ── */
  function KpiTable({ row }) {
    const totTarget = allUsers.reduce((s, n) => {
      const q = isYearly ? yearlyQ(data, n) : (data.kpiData[n]?.[quarter] || {})
      return s + (q[row.targetKey] || 0)
    }, 0)
    const totAch = allUsers.reduce((s, n) => {
      const q = isYearly ? yearlyQ(data, n) : (data.kpiData[n]?.[quarter] || {})
      return s + (q[row.achKey] || 0)
    }, 0)
    const totP = pct(totAch, totTarget)

    return (
      <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', background: `linear-gradient(90deg, ${row.color}10, transparent)`, borderBottom: '0.5px solid var(--border-color)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: row.color }}>{row.label}</span>
          <span style={{ fontSize: 9.5, color: 'var(--text-hint)', background: 'var(--bg-tertiary)', padding: '2px 7px', borderRadius: 10 }}>{row.weight}% weight</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...THL, background: 'transparent', padding: '5px 12px' }}>BD</th>
              <th style={{ ...TH, background: 'transparent', padding: '5px 8px' }}>Target</th>
              <th style={{ ...TH, background: 'transparent', padding: '5px 8px' }}>Achieved</th>
              <th style={{ ...TH, background: 'transparent', padding: '5px 8px' }}>%</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((name, i) => {
              const q = isYearly ? yearlyQ(data, name) : (data.kpiData[name]?.[quarter] || {})
              const target = q[row.targetKey] || 0
              const ach    = q[row.achKey]    || 0
              const p      = pct(ach, target)
              const col    = scoreColor(p)
              return (
                <tr key={name}
                  style={{ borderBottom: i < allUsers.length - 1 ? '0.5px solid var(--border-color)' : 'none', transition: 'background 120ms' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '5px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{name.split(' ')[0]}</td>
                  <td style={{ padding: '3px 4px' }}>
                    <EditCell value={target} isMoney={row.isMoney} readOnly={isYearly} onChange={v => updateKPI(name, quarter, row.targetKey, v)} />
                  </td>
                  <td style={{ padding: '3px 4px' }}>
                    <EditCell value={ach} isMoney={row.isMoney} readOnly={isYearly} onChange={v => updateKPI(name, quarter, row.achKey, v)} />
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 800, color: col }}>{p}%</td>
                </tr>
              )
            })}
            {/* Totals */}
            {allUsers.length > 0 && (
              <tr style={{ background: 'var(--bg-tertiary)', borderTop: '1px solid var(--border-color)' }}>
                <td style={{ padding: '5px 12px', fontSize: 11, fontWeight: 800, color: 'var(--text-primary)' }}>Total</td>
                <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {row.isMoney ? fmt(totTarget) : totTarget}
                </td>
                <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: row.color }}>
                  {row.isMoney ? fmt(totAch) : totAch}
                </td>
                <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 800, color: scoreColor(totP) }}>
                  {totP}%
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {isYearly && <div style={{ fontSize: 10, color: 'var(--text-hint)', textAlign: 'center', padding: '6px 0' }}>📊 Yearly totals — switch to a quarter to edit</div>}
      </div>
    )
  }

  /* ── Col-3: Score cards + Team Aggregate ── */
  function AchievementCol() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Score cards per BD */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {allUsers.map((name) => {
            const q = isYearly ? yearlyQ(data, name) : (data.kpiData[name]?.[quarter] || {})
            const score = calcScore(q)
            return (
              <div key={name} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow-xs)', minWidth: 110 }}>
                <ScoreRing score={score} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{name.split(' ')[0]}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 1 }}>{name.split(' ').slice(1).join(' ')}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Team Aggregate */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '14px 16px', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-tertiary)', marginBottom: 12 }}>Team Aggregate</div>
          {KPI_ROWS.map(row => {
            const totTarget = allUsers.reduce((s, n) => { const q = isYearly ? yearlyQ(data, n) : (data.kpiData[n]?.[quarter] || {}); return s + (q[row.targetKey] || 0) }, 0)
            const totAch    = allUsers.reduce((s, n) => { const q = isYearly ? yearlyQ(data, n) : (data.kpiData[n]?.[quarter] || {}); return s + (q[row.achKey]    || 0) }, 0)
            return <ProgressRow key={row.key} label={row.label} ach={totAch} target={totTarget || 1} isMoney={row.isMoney} color={row.color} />
          })}
        </div>
      </div>
    )
  }

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
            <CopyBtn targetRef={sectionRef} />
          </div>
        </div>

        <div ref={sectionRef} style={{ padding: '20px' }}>

          {/* ── 3-column KPI grid ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>

            {/* Column 1 — TC */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
                TC — {isYearly ? 'Full Year' : quarter}
              </div>
              <KpiTable row={KPI_ROWS[0]} />
            </div>

            {/* Column 2 — Activated Clients */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
                Activated Clients — {isYearly ? 'Full Year' : quarter}
              </div>
              <KpiTable row={KPI_ROWS[1]} />
            </div>

            {/* Column 3 — Achievement + Team Aggregate */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
                Achievement — {isYearly ? 'Full Year' : quarter}
              </div>
              <AchievementCol />
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          <Separator />

          {/* ── SALES ACTIVITY ── */}
          <SectionLabel>Sales Activity</SectionLabel>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden', minWidth: 700 }}>
              <thead>
                <tr>
                  <th style={{ ...THL }}>BD Name</th>
                  <th style={{ ...TH }}>Calls Logged<br/><span style={{ fontSize: 8, fontWeight: 400, textTransform: 'none', letterSpacing: 0, opacity: 0.7 }}>Discovery only</span></th>
                  <th style={{ ...TH }}>IT Services</th>
                  <th style={{ ...TH }}>Ecomm Seller</th>
                  <th style={{ ...TH }}>B2B Seller</th>
                  <th style={{ ...TH }}>Freelancer</th>
                  <th style={{ ...TH, color: SO.green }}>Calls Connected</th>
                  <th style={{ ...TH, color: SO.pink }}>Not Responded</th>
                </tr>
              </thead>
              <tbody>
                {salesActivityRows.map((row, i) => (
                  <tr key={row.name}
                    style={{ background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)', transition: 'background 120ms' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--so-blue-soft)'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)'}>
                    <td style={{ ...TDL, fontSize: 12 }}>{row.name}</td>
                    <td style={{ ...TD, fontWeight: row.discoveryCalls > 0 ? 700 : 400, color: row.discoveryCalls > 0 ? SO.blue : 'var(--text-hint)' }}>
                      {row.discoveryCalls || '—'}
                    </td>
                    {row.vertCalls.map((cnt, vi) => (
                      <td key={vi} style={{ ...TD, fontWeight: cnt > 0 ? 600 : 400, color: cnt > 0 ? 'var(--text-primary)' : 'var(--text-hint)' }}>
                        {cnt || '—'}
                      </td>
                    ))}
                    <td style={{ ...TD, fontWeight: row.connected > 0 ? 700 : 400, color: row.connected > 0 ? SO.green : 'var(--text-hint)' }}>
                      {row.connected || '—'}
                    </td>
                    <td style={{ ...TD, fontWeight: row.notResponded > 0 ? 700 : 400, color: row.notResponded > 0 ? SO.pink : 'var(--text-hint)' }}>
                      {row.notResponded || '—'}
                    </td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr style={{ background: 'var(--bg-tertiary)', borderTop: '1px solid var(--border-strong-color)' }}>
                  <td style={{ ...TDL, fontSize: 11, fontWeight: 800, borderTop: '1px solid var(--border-strong-color)' }}>Total</td>
                  <td style={{ ...TD, fontWeight: 800, color: SO.blue, borderTop: '1px solid var(--border-strong-color)' }}>
                    {salesActivityRows.reduce((s, r) => s + r.discoveryCalls, 0) || '—'}
                  </td>
                  {VERTICALS_SA.map((_, vi) => (
                    <td key={vi} style={{ ...TD, fontWeight: 700, color: 'var(--text-primary)', borderTop: '1px solid var(--border-strong-color)' }}>
                      {salesActivityRows.reduce((s, r) => s + r.vertCalls[vi], 0) || '—'}
                    </td>
                  ))}
                  <td style={{ ...TD, fontWeight: 800, color: SO.green, borderTop: '1px solid var(--border-strong-color)' }}>
                    {salesActivityRows.reduce((s, r) => s + r.connected, 0) || '—'}
                  </td>
                  <td style={{ ...TD, fontWeight: 800, color: SO.pink, borderTop: '1px solid var(--border-strong-color)' }}>
                    {salesActivityRows.reduce((s, r) => s + r.notResponded, 0) || '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          <Separator />

          {/* ── CONVERSION RATIO ── */}
          <SectionLabel>Conversion Ratio</SectionLabel>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden', minWidth: 500 }}>
              <thead>
                <tr>
                  <th style={{ ...THL }}>BD Name</th>
                  <th style={{ ...TH }}>Leads Created</th>
                  <th style={{ ...TH }}>Leads Contacted</th>
                  <th style={{ ...TH }}>Opportunities</th>
                  <th style={{ ...TH, color: SO.blue }}>Conversion</th>
                </tr>
              </thead>
              <tbody>
                {conversionRows.map((row, i) => (
                  <tr key={row.name}
                    style={{ background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)', transition: 'background 120ms' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--so-blue-soft)'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)'}>
                    <td style={{ ...TDL, fontSize: 12 }}>{row.name}</td>
                    <td style={{ ...TD, color: row.created > 0 ? 'var(--text-primary)' : 'var(--text-hint)', fontWeight: row.created > 0 ? 600 : 400 }}>
                      {row.created || '—'}
                    </td>
                    <td style={{ ...TD, color: row.contacted > 0 ? SO.purple : 'var(--text-hint)', fontWeight: row.contacted > 0 ? 600 : 400 }}>
                      {row.contacted || '—'}
                    </td>
                    <td style={{ ...TD, color: row.opps > 0 ? SO.green : 'var(--text-hint)', fontWeight: row.opps > 0 ? 700 : 400 }}>
                      {row.opps || '—'}
                    </td>
                    <td style={{ ...TD, fontWeight: 800, color: scoreColor(row.conversion) }}>
                      {row.contacted > 0 ? `${row.conversion}%` : '—'}
                    </td>
                  </tr>
                ))}
                {/* Totals row */}
                {(() => {
                  const totCreated   = conversionRows.reduce((s, r) => s + r.created, 0)
                  const totContacted = conversionRows.reduce((s, r) => s + r.contacted, 0)
                  const totOpps      = conversionRows.reduce((s, r) => s + r.opps, 0)
                  const totConv      = totContacted > 0 ? Math.round((totOpps / totContacted) * 100) : 0
                  return (
                    <tr style={{ background: 'var(--bg-tertiary)', borderTop: '1px solid var(--border-strong-color)' }}>
                      <td style={{ ...TDL, fontSize: 11, fontWeight: 800, borderTop: '1px solid var(--border-strong-color)' }}>Total</td>
                      <td style={{ ...TD, fontWeight: 800, color: 'var(--text-primary)', borderTop: '1px solid var(--border-strong-color)' }}>{totCreated || '—'}</td>
                      <td style={{ ...TD, fontWeight: 800, color: SO.purple, borderTop: '1px solid var(--border-strong-color)' }}>{totContacted || '—'}</td>
                      <td style={{ ...TD, fontWeight: 800, color: SO.green, borderTop: '1px solid var(--border-strong-color)' }}>{totOpps || '—'}</td>
                      <td style={{ ...TD, fontWeight: 800, color: scoreColor(totConv), borderTop: '1px solid var(--border-strong-color)' }}>
                        {totContacted > 0 ? `${totConv}%` : '—'}
                      </td>
                    </tr>
                  )
                })()}
              </tbody>
            </table>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          <Separator />

          {/* ── OPPORTUNITIES PROGRESS ── */}
          <SectionLabel>Opportunities Progress</SectionLabel>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden', minWidth: 500 }}>
              <thead>
                <tr>
                  <th style={{ ...THL }}>BD</th>
                  {OPPORTUNITY_STAGES.map(s => <th key={s} style={{ ...TH }}>{s}</th>)}
                </tr>
              </thead>
              <tbody>
                {oppProgressRows.map((u, i) => (
                  <tr key={u.name} style={{ background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)', transition: 'background 120ms' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--so-blue-soft)'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)'}>
                    <td style={{ ...TDL, fontSize: 12 }}>{u.name}</td>
                    {u.counts.map((cnt, si) => (
                      <td key={si} style={{ ...TD, color: cnt > 0 ? 'var(--text-primary)' : 'var(--text-hint)', fontWeight: cnt > 0 ? 700 : 400 }}>
                        {cnt || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Totals row — count */}
                <tr style={{ background: 'var(--bg-tertiary)', borderTop: '2px solid var(--border-strong-color)' }}>
                  <td style={{ ...TDL, fontSize: 11, fontWeight: 800, borderTop: '1px solid var(--border-strong-color)' }}>Total</td>
                  {OPPORTUNITY_STAGES.map(s => {
                    const cnt = state.opportunities.filter(o => o.stage === s).length
                    return <td key={s} style={{ ...TD, fontWeight: 800, color: cnt > 0 ? SO.blue : 'var(--text-hint)', borderTop: '1px solid var(--border-strong-color)' }}>{cnt || '—'}</td>
                  })}
                </tr>
                {/* Vol row */}
                <tr style={{ background: 'var(--bg-tertiary)' }}>
                  <td style={{ ...TDL, fontSize: 11, fontWeight: 700, color: SO.blue }}>Total Vol</td>
                  {OPPORTUNITY_STAGES.map(s => {
                    const v = state.opportunities.filter(o => o.stage === s).reduce((a, o) => a + (o.expectedMonthlyVolume || 0), 0)
                    return <td key={s} style={{ ...TD, fontWeight: 700, color: v > 0 ? SO.blue : 'var(--text-hint)' }}>{v > 0 ? formatCurrency(v) : '—'}</td>
                  })}
                </tr>
                {/* TC row */}
                <tr style={{ background: 'var(--bg-tertiary)' }}>
                  <td style={{ ...TDL, fontSize: 11, fontWeight: 700, color: SO.green }}>Total TC</td>
                  {OPPORTUNITY_STAGES.map(s => {
                    const v = state.opportunities.filter(o => o.stage === s).reduce((a, o) => a + (o.expectedMonthlyRevenue || 0), 0)
                    return <td key={s} style={{ ...TD, fontWeight: 700, color: v > 0 ? SO.green : 'var(--text-hint)' }}>{v > 0 ? formatCurrency(v) : '—'}</td>
                  })}
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  )
}
