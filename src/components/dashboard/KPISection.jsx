import React, { useState, useRef, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LabelList
} from 'recharts'
import { useKPI, QUARTERS, KPI_WEIGHTS, calcScore } from '../../store/KPIContext'
import { useAuth } from '../../store/AuthContext'
import { useCRM } from '../../store/CRMContext'
import { OPPORTUNITY_STAGES } from '../../data/constants'
import { formatCurrency } from '../../utils/helpers'

const SO = { blue: '#4796E3', purple: '#9177C7', pink: '#CA6673', green: '#1E8E3E', orange: '#E37400' }
const ALL_TABS = ['Q2', 'Q3', 'Q4', 'Yearly']
const VERTICALS_SA = ['IT Services', 'Ecom Seller', 'B2B Seller', 'Freelancer']
const STAGE_COLORS_CH = {
  Prospecting: SO.blue, Won: SO.purple, Onboarded: SO.green,
  Activated: SO.pink, Lost: '#D93025', 'On Hold': '#9AA0A6',
}

/* ── Helpers ── */
function scoreColor(s) { return s >= 80 ? SO.green : s >= 50 ? SO.orange : SO.pink }
function pct(ach, target) { if (!target) return 0; return Math.min(Math.round((ach / target) * 100), 999) }
function fmt(n) {
  if (!n) return '—'
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000)    return `$${(n / 1000).toFixed(1)}k`
  return `$${n}`
}
function yearlyQ(data, name) {
  return QUARTERS.reduce((acc, q) => {
    const d = data.kpiData[name]?.[q] || {}
    return { tcTarget: acc.tcTarget + (d.tcTarget||0), tcAch: acc.tcAch + (d.tcAch||0), acTarget: acc.acTarget + (d.acTarget||0), acAch: acc.acAch + (d.acAch||0) }
  }, { tcTarget:0, tcAch:0, acTarget:0, acAch:0 })
}

/* ── Inline-editable cell ── */
function EditCell({ value, onChange, readOnly, isMoney }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value ?? 0))
  if (readOnly) return (
    <div style={{ textAlign:'right', fontFamily:'var(--font-mono)', fontSize:12, fontWeight:400, color: value>0?'var(--text-primary)':'var(--text-hint)', padding:'3px 8px' }}>
      {isMoney ? fmt(value) : (value||'—')}
    </div>
  )
  if (editing) return (
    <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
      onBlur={() => { setEditing(false); onChange(draft) }}
      onKeyDown={e => { if(e.key==='Enter'){setEditing(false);onChange(draft)} if(e.key==='Escape')setEditing(false) }}
      style={{ width:80, padding:'3px 8px', borderRadius:6, border:'1.5px solid var(--so-blue)', background:'var(--bg-tertiary)', color:'var(--text-primary)', fontFamily:'var(--font-mono)', fontSize:12, fontWeight:400, textAlign:'right', outline:'none' }}
    />
  )
  return (
    <div onClick={() => { setDraft(String(value??0)); setEditing(true) }} title="Click to edit"
      style={{ textAlign:'right', fontFamily:'var(--font-mono)', fontSize:12, fontWeight:400, color: value>0?'var(--text-primary)':'var(--text-hint)', padding:'3px 8px', borderRadius:6, cursor:'pointer', border:'1px dashed transparent', transition:'all 0.15s', minWidth:60 }}
      onMouseEnter={e => e.currentTarget.style.borderColor='var(--so-blue)'}
      onMouseLeave={e => e.currentTarget.style.borderColor='transparent'}
    >
      {isMoney ? fmt(value) : (value||'0')}
    </div>
  )
}

/* ── Progress bar ── */
function ProgressRow({ label, ach, target, isMoney, color }) {
  const p = pct(ach, target), col = color || scoreColor(p)
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
        <span style={{ fontSize:12, fontWeight:500, color:'var(--text-secondary)' }}>{label}</span>
        <div style={{ display:'flex', alignItems:'center', gap:12, fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-tertiary)' }}>
          <span>{isMoney ? fmt(ach) : ach} / {isMoney ? fmt(target) : target}</span>
          <span style={{ fontWeight:700, fontSize:13, color:col, minWidth:40, textAlign:'right' }}>{p}%</span>
        </div>
      </div>
      <div style={{ height:7, background:'var(--bg-tertiary)', borderRadius:6, overflow:'hidden', border:'1px solid var(--border-color)' }}>
        <div style={{ width:`${Math.min(p,100)}%`, height:'100%', borderRadius:6, background:`linear-gradient(90deg,${col}88,${col})`, transition:'width 0.7s cubic-bezier(0.4,0,0.2,1)' }} />
      </div>
    </div>
  )
}

/* ── Copy-to-image ── */
async function copyAsImage(el) {
  try {
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(el, { scale:2, useCORS:true, backgroundColor:null })
    canvas.toBlob(async blob => {
      if (!blob) return
      try { await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]); alert('Copied!') }
      catch { const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='kpi.png'; a.click(); URL.revokeObjectURL(url) }
    })
  } catch(e) { console.error(e) }
}
function CopyBtn({ targetRef }) {
  return (
    <button onClick={() => targetRef.current && copyAsImage(targetRef.current)} title="Copy as HD image"
      style={{ display:'flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:7, border:'1px solid var(--border-strong-color)', background:'var(--bg-tertiary)', cursor:'pointer', color:'var(--text-tertiary)', transition:'all 140ms ease', flexShrink:0 }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='var(--so-blue)'; e.currentTarget.style.color='var(--so-blue)'; e.currentTarget.style.background='var(--so-blue-soft)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-strong-color)'; e.currentTarget.style.color='var(--text-tertiary)'; e.currentTarget.style.background='var(--bg-tertiary)' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
    </button>
  )
}

/* ── Chart tooltip ── */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-color)', borderRadius:10, padding:'9px 13px', fontSize:11, boxShadow:'var(--shadow)' }}>
      <div style={{ fontWeight:700, marginBottom:5, color:'var(--text-primary)' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:p.fill||p.color, display:'inline-block', flexShrink:0 }} />
          <span style={{ color:'var(--text-secondary)' }}>{p.name}:</span>
          <span style={{ fontWeight:700, color:p.fill||p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Table styles ── */
const TH     = { padding:'7px 10px', fontSize:9.5, fontWeight:700, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'0.7px', borderBottom:'1px solid var(--border-color)', background:'linear-gradient(135deg,rgba(71,150,227,0.08) 0%,rgba(145,119,199,0.06) 55%,rgba(202,102,115,0.05) 100%)', whiteSpace:'nowrap', textAlign:'center' }
const THL    = { ...TH, textAlign:'left' }
const TD     = { padding:'6px 10px', fontSize:11, fontWeight:400, borderBottom:'0.5px solid var(--border-color)', fontFamily:'var(--font-mono)', textAlign:'center', color:'var(--text-secondary)' }
const TDL    = { ...TD, textAlign:'left', fontFamily:'var(--font)', fontWeight:500, color:'var(--text-primary)', fontSize:12 }
const TD_TOT = { ...TD, fontWeight:700, fontSize:12, color:'var(--text-primary)' }
const TDL_TOT= { ...TDL, fontWeight:800, fontSize:12 }

const TICK_STYLE = { fill:'var(--text-tertiary)', fontSize:11 }
const GRID_CFG   = { stroke:'var(--border-color)', strokeWidth:0.5, strokeDasharray:'2 4' }

/* ── Section heading: bigger, bold gradient ── */
function SectionLabel({ children }) {
  return (
    <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'1.4px', background:'var(--so-gradient)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', marginBottom:14 }}>
      {children}
    </div>
  )
}
function Separator() {
  return <div style={{ height:'1px', background:'var(--border-color)', margin:'28px 0 22px' }} />
}

/* ══════════════════════════════════════════════════════════════════ */

export default function KPISection({ filterOwner = '' }) {
  const { data, updateKPI } = useKPI()
  const { currentUser }     = useAuth()
  const { state }           = useCRM()
  const [quarter, setQuarter] = useState('Q2')
  const sectionRef = useRef()

  /* ── User list (deduplicated, no Head of MENA) ── */
  const baseUsers = (state.users||[]).filter(u => u.isActive!==false && u.designation!=='Head of MENA').map(u => u.name)
  const allUsers  = [...new Set(currentUser?.name ? [...baseUsers, currentUser.name] : baseUsers)]
  /* Apply owner filter for display */
  const displayUsers = filterOwner ? allUsers.filter(n => n === filterOwner) : allUsers
  const isYearly = quarter === 'Yearly'

  const KPI_ROWS = [
    { key:'tc', label:'TC',               targetKey:'tcTarget', achKey:'tcAch', weight:KPI_WEIGHTS.tc, isMoney:true,  color:SO.blue   },
    { key:'ac', label:'Activated Clients', targetKey:'acTarget', achKey:'acAch', weight:KPI_WEIGHTS.ac, isMoney:false, color:SO.purple },
  ]

  /* ── Sales Activity data ── */
  const entityVerticalMap = useMemo(() => {
    const map = {}
    state.leads.forEach(l => { if(l.id) map[l.id]=l.vertical })
    state.opportunities.forEach(o => { if(o.id) map[o.id]=o.vertical })
    return map
  }, [state.leads, state.opportunities])

  const salesActivityRows = useMemo(() => allUsers.map(name => {
    const calls = state.activities.filter(a => a.type==='Call' && a.loggedBy===name)
    return {
      name,
      discoveryCalls: calls.filter(a => a.callType==='Discovery Call').length,
      vertCalls: VERTICALS_SA.map(v => calls.filter(a => entityVerticalMap[a.entityId]===v).length),
      connected:    calls.filter(a => a.callOutcome?.startsWith('Connected')).length,
      notResponded: calls.filter(a => a.callOutcome==='Not Responded').length,
    }
  }), [allUsers, state.activities, entityVerticalMap])

  const displaySARows = salesActivityRows.filter(r => displayUsers.includes(r.name))

  /* ── Conversion Ratio data ── */
  const conversionRows = useMemo(() => allUsers.map(name => {
    const ul = state.leads.filter(l => l.leadOwner===name)
    const created   = ul.length
    const contacted = ul.filter(l => ['Contacted','Qualified','Converted'].includes(l.status)).length
    const opps      = state.opportunities.filter(o => o.leadOwner===name).length
    return { name, created, contacted, opps, conversion: contacted>0 ? Math.round((opps/contacted)*100) : 0 }
  }), [allUsers, state.leads, state.opportunities])

  const displayCRRows = conversionRows.filter(r => displayUsers.includes(r.name))

  /* ── Opportunities Progress data ── */
  const displayOPRows = useMemo(() => displayUsers.map(name => ({
    name,
    counts: OPPORTUNITY_STAGES.map(s => state.opportunities.filter(o => o.leadOwner===name && o.stage===s).length),
  })).filter(r => r.counts.some(c => c>0)), [displayUsers, state.opportunities])

  /* ── Chart data ── */
  const saChartData = useMemo(() => displayUsers.map(name => {
    const r = displaySARows.find(x => x.name===name) || {}
    return { bd:name.split(' ')[0], 'Calls Logged':r.discoveryCalls||0, 'Connected':r.connected||0, 'Not Responded':r.notResponded||0 }
  }), [displayUsers, displaySARows])

  const crChartData = useMemo(() => displayUsers.map(name => {
    const r = displayCRRows.find(x => x.name===name) || {}
    return { bd:name.split(' ')[0], 'Leads Created':r.created||0, 'Leads Contacted':r.contacted||0, 'Opportunities':r.opps||0 }
  }), [displayUsers, displayCRRows])

  const opChartData = useMemo(() => displayUsers.map(name => {
    const obj = { bd:name.split(' ')[0] }
    OPPORTUNITY_STAGES.forEach(s => { obj[s] = state.opportunities.filter(o => o.leadOwner===name && o.stage===s).length })
    return obj
  }), [displayUsers, state.opportunities])

  /* ── Inner KPI table for one metric row ── */
  function KpiTable({ row }) {
    const totTarget = displayUsers.reduce((s,n) => { const q=isYearly?yearlyQ(data,n):(data.kpiData[n]?.[quarter]||{}); return s+(q[row.targetKey]||0) },0)
    const totAch    = displayUsers.reduce((s,n) => { const q=isYearly?yearlyQ(data,n):(data.kpiData[n]?.[quarter]||{}); return s+(q[row.achKey]||0) },0)
    const totP = pct(totAch, totTarget)
    return (
      <div style={{ border:'1px solid var(--border-color)', borderRadius:12, overflow:'hidden', boxShadow:'var(--shadow-xs)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 12px', background:`linear-gradient(90deg,${row.color}12,transparent)`, borderBottom:'0.5px solid var(--border-color)' }}>
          <span style={{ fontSize:11, fontWeight:700, color:row.color }}>{row.label}</span>
          <span style={{ fontSize:9.5, color:'var(--text-hint)', background:'var(--bg-tertiary)', padding:'2px 7px', borderRadius:10 }}>{row.weight}% weight</span>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...THL, background:'linear-gradient(135deg,rgba(71,150,227,0.08) 0%,rgba(145,119,199,0.06) 55%,rgba(202,102,115,0.05) 100%)', padding:'5px 12px' }}>BD</th>
              <th style={{ ...TH, background:'linear-gradient(135deg,rgba(71,150,227,0.08) 0%,rgba(145,119,199,0.06) 55%,rgba(202,102,115,0.05) 100%)', padding:'5px 8px' }}>Target</th>
              <th style={{ ...TH, background:'linear-gradient(135deg,rgba(71,150,227,0.08) 0%,rgba(145,119,199,0.06) 55%,rgba(202,102,115,0.05) 100%)', padding:'5px 8px' }}>Achieved</th>
              <th style={{ ...TH, background:'linear-gradient(135deg,rgba(71,150,227,0.08) 0%,rgba(145,119,199,0.06) 55%,rgba(202,102,115,0.05) 100%)', padding:'5px 8px' }}>%</th>
            </tr>
          </thead>
          <tbody>
            {displayUsers.map((name, i) => {
              const q=isYearly?yearlyQ(data,name):(data.kpiData[name]?.[quarter]||{})
              const target=q[row.targetKey]||0, ach=q[row.achKey]||0, p=pct(ach,target)
              return (
                <tr key={name} style={{ borderBottom:i<displayUsers.length-1?'0.5px solid var(--border-color)':'none', transition:'background 120ms' }}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--bg-tertiary)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'5px 12px', fontSize:12, fontWeight:500, color:'var(--text-primary)' }}>{name.split(' ')[0]}</td>
                  <td style={{ padding:'3px 4px' }}><EditCell value={target} isMoney={row.isMoney} readOnly={isYearly} onChange={v=>updateKPI(name,quarter,row.targetKey,v)} /></td>
                  <td style={{ padding:'3px 4px' }}><EditCell value={ach}    isMoney={row.isMoney} readOnly={isYearly} onChange={v=>updateKPI(name,quarter,row.achKey,v)}    /></td>
                  <td style={{ padding:'4px 8px', textAlign:'right', fontFamily:'var(--font-mono)', fontSize:12, fontWeight:400, color:scoreColor(p) }}>{p}%</td>
                </tr>
              )
            })}
            {displayUsers.length>0 && (
              <tr style={{ background:'var(--bg-tertiary)', borderTop:'1px solid var(--border-color)' }}>
                <td style={{ padding:'5px 12px', fontSize:12, fontWeight:800, color:'var(--text-primary)' }}>Total</td>
                <td style={{ padding:'4px 8px', textAlign:'right', fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:'var(--text-secondary)' }}>{row.isMoney?fmt(totTarget):totTarget}</td>
                <td style={{ padding:'4px 8px', textAlign:'right', fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:row.color }}>{row.isMoney?fmt(totAch):totAch}</td>
                <td style={{ padding:'4px 8px', textAlign:'right', fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:scoreColor(totP) }}>{totP}%</td>
              </tr>
            )}
          </tbody>
        </table>
        {isYearly && <div style={{ fontSize:10, color:'var(--text-hint)', textAlign:'center', padding:'6px 0' }}>Switch to a quarter to edit values</div>}
      </div>
    )
  }

  /* ── Col 3: Team Aggregate ── */
  function TeamAggregateCol() {
    return (
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-color)', borderRadius:12, padding:'14px 16px', boxShadow:'var(--shadow-xs)', height:'100%' }}>
        <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--text-tertiary)', marginBottom:14 }}>Team Aggregate</div>
        {KPI_ROWS.map(row => {
          const totT = displayUsers.reduce((s,n)=>{const q=isYearly?yearlyQ(data,n):(data.kpiData[n]?.[quarter]||{});return s+(q[row.targetKey]||0)},0)
          const totA = displayUsers.reduce((s,n)=>{const q=isYearly?yearlyQ(data,n):(data.kpiData[n]?.[quarter]||{});return s+(q[row.achKey]||0)},0)
          return <ProgressRow key={row.key} label={row.label} ach={totA} target={totT||1} isMoney={row.isMoney} color={row.color} />
        })}
      </div>
    )
  }

  /* ══════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ marginBottom:20 }}>
      <div className="card">

        {/* ── KPI Achievement header (same gradient label style) ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10, marginBottom:20 }}>
          <SectionLabel>KPI Achievement</SectionLabel>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <div className="tabs">
              {ALL_TABS.map(q => <button key={q} className={`tab ${quarter===q?'active':''}`} onClick={() => setQuarter(q)}>{q}</button>)}
            </div>
            <CopyBtn targetRef={sectionRef} />
          </div>
        </div>

        <div ref={sectionRef}>

          {/* ── 3-col KPI grid ── */}
          <div className="kpi-grid-3col">
            <KpiTable row={KPI_ROWS[0]} />
            <KpiTable row={KPI_ROWS[1]} />
            <TeamAggregateCol />
          </div>

          {/* ══════ SALES ACTIVITY ══════ */}
          <Separator />
          <SectionLabel>Sales Activity</SectionLabel>
          <div className="kpi-grid-2col-bottom">

            {/* Table */}
            <div style={{ minWidth:0 }}>
              <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
                <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0, border:'1px solid var(--border-color)', borderRadius:10, overflow:'hidden', minWidth:500 }}>
                  <thead>
                    <tr>
                      <th style={THL}>BD Name</th>
                      <th style={TH}>Calls Logged</th>
                      <th style={TH}>IT Services</th>
                      <th style={TH}>Ecomm Seller</th>
                      <th style={TH}>B2B Seller</th>
                      <th style={TH}>Freelancer</th>
                      <th style={{ ...TH, color:SO.green }}>Connected</th>
                      <th style={{ ...TH, color:SO.pink  }}>Not Responded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displaySARows.map((row,i) => (
                      <tr key={row.name} style={{ background:i%2===0?'var(--bg-card)':'var(--bg-secondary)', transition:'background 120ms' }}
                        onMouseEnter={e=>e.currentTarget.style.background='var(--so-blue-soft)'}
                        onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'var(--bg-card)':'var(--bg-secondary)'}>
                        <td style={TDL}>{row.name}</td>
                        <td style={{ ...TD, color:row.discoveryCalls>0?SO.blue:'var(--text-hint)' }}>{row.discoveryCalls||'—'}</td>
                        {row.vertCalls.map((cnt,vi) => <td key={vi} style={{ ...TD, color:cnt>0?'var(--text-primary)':'var(--text-hint)' }}>{cnt||'—'}</td>)}
                        <td style={{ ...TD, color:row.connected>0?SO.green:'var(--text-hint)' }}>{row.connected||'—'}</td>
                        <td style={{ ...TD, color:row.notResponded>0?SO.pink:'var(--text-hint)' }}>{row.notResponded||'—'}</td>
                      </tr>
                    ))}
                    <tr style={{ background:'var(--bg-tertiary)', borderTop:'1px solid var(--border-strong-color)' }}>
                      <td style={{ ...TDL_TOT, borderTop:'1px solid var(--border-strong-color)' }}>Total</td>
                      <td style={{ ...TD_TOT, color:SO.blue, borderTop:'1px solid var(--border-strong-color)' }}>{displaySARows.reduce((s,r)=>s+r.discoveryCalls,0)||'—'}</td>
                      {VERTICALS_SA.map((_,vi) => <td key={vi} style={{ ...TD_TOT, borderTop:'1px solid var(--border-strong-color)' }}>{displaySARows.reduce((s,r)=>s+r.vertCalls[vi],0)||'—'}</td>)}
                      <td style={{ ...TD_TOT, color:SO.green, borderTop:'1px solid var(--border-strong-color)' }}>{displaySARows.reduce((s,r)=>s+r.connected,0)||'—'}</td>
                      <td style={{ ...TD_TOT, color:SO.pink,  borderTop:'1px solid var(--border-strong-color)' }}>{displaySARows.reduce((s,r)=>s+r.notResponded,0)||'—'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bar Chart: Calls Logged vs Connected vs Not Responded */}
            <div style={{ minWidth:0, display:'flex', flexDirection:'column', justifyContent:'center' }}>
              <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--text-tertiary)', marginBottom:10 }}>BD Call Comparison</div>
              {saChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={saChartData} margin={{ top:10, right:10, left:-10, bottom:0 }} barCategoryGap="30%">
                    <CartesianGrid {...GRID_CFG} />
                    <XAxis dataKey="bd" tick={TICK_STYLE} />
                    <YAxis tick={TICK_STYLE} allowDecimals={false} />
                    <Tooltip content={<ChartTip />} />
                    <Legend formatter={v => <span style={{ fontSize:10, color:'var(--text-secondary)' }}>{v}</span>} iconSize={7} />
                    <Bar dataKey="Calls Logged"  fill={SO.blue}  radius={[4,4,0,0]}>
                      <LabelList dataKey="Calls Logged"  position="top" style={{ fill:SO.blue,  fontSize:10, fontWeight:700 }} formatter={v=>v>0?v:''} />
                    </Bar>
                    <Bar dataKey="Connected"     fill={SO.green} radius={[4,4,0,0]}>
                      <LabelList dataKey="Connected"     position="top" style={{ fill:SO.green, fontSize:10, fontWeight:700 }} formatter={v=>v>0?v:''} />
                    </Bar>
                    <Bar dataKey="Not Responded" fill={SO.pink}  radius={[4,4,0,0]}>
                      <LabelList dataKey="Not Responded" position="top" style={{ fill:SO.pink,  fontSize:10, fontWeight:700 }} formatter={v=>v>0?v:''} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign:'center', color:'var(--text-hint)', fontSize:12, padding:'40px 0' }}>No call data</div>
              )}
            </div>

          </div>{/* end kpi-grid-2col-bottom SA */}

          {/* ══════ CONVERSION RATIO ══════ */}
          <Separator />
          <SectionLabel>Conversion Ratio</SectionLabel>
          <div className="kpi-grid-2col-bottom">

            {/* Table */}
            <div style={{ minWidth:0 }}>
              <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
                <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0, border:'1px solid var(--border-color)', borderRadius:10, overflow:'hidden', minWidth:320 }}>
                  <thead>
                    <tr>
                      <th style={THL}>BD Name</th>
                      <th style={TH}>Leads Created</th>
                      <th style={TH}>Leads Contacted</th>
                      <th style={TH}>Opportunities</th>
                      <th style={{ ...TH, color:SO.blue }}>Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayCRRows.map((row,i) => (
                      <tr key={row.name} style={{ background:i%2===0?'var(--bg-card)':'var(--bg-secondary)', transition:'background 120ms' }}
                        onMouseEnter={e=>e.currentTarget.style.background='var(--so-blue-soft)'}
                        onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'var(--bg-card)':'var(--bg-secondary)'}>
                        <td style={TDL}>{row.name}</td>
                        <td style={{ ...TD, color:row.created>0?'var(--text-primary)':'var(--text-hint)' }}>{row.created||'—'}</td>
                        <td style={{ ...TD, color:row.contacted>0?SO.purple:'var(--text-hint)' }}>{row.contacted||'—'}</td>
                        <td style={{ ...TD, color:row.opps>0?SO.green:'var(--text-hint)' }}>{row.opps||'—'}</td>
                        <td style={{ ...TD, color:row.contacted>0?scoreColor(row.conversion):'var(--text-hint)' }}>{row.contacted>0?`${row.conversion}%`:'—'}</td>
                      </tr>
                    ))}
                    {(() => {
                      const totC=displayCRRows.reduce((s,r)=>s+r.created,0)
                      const totK=displayCRRows.reduce((s,r)=>s+r.contacted,0)
                      const totO=displayCRRows.reduce((s,r)=>s+r.opps,0)
                      const totV=totK>0?Math.round((totO/totK)*100):0
                      return (
                        <tr style={{ background:'var(--bg-tertiary)', borderTop:'1px solid var(--border-strong-color)' }}>
                          <td style={{ ...TDL_TOT, borderTop:'1px solid var(--border-strong-color)' }}>Total</td>
                          <td style={{ ...TD_TOT, borderTop:'1px solid var(--border-strong-color)' }}>{totC||'—'}</td>
                          <td style={{ ...TD_TOT, color:SO.purple, borderTop:'1px solid var(--border-strong-color)' }}>{totK||'—'}</td>
                          <td style={{ ...TD_TOT, color:SO.green,  borderTop:'1px solid var(--border-strong-color)' }}>{totO||'—'}</td>
                          <td style={{ ...TD_TOT, color:scoreColor(totV), borderTop:'1px solid var(--border-strong-color)' }}>{totK>0?`${totV}%`:'—'}</td>
                        </tr>
                      )
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Funnel-style grouped bar chart */}
            <div style={{ minWidth:0, display:'flex', flexDirection:'column', justifyContent:'center' }}>
              <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--text-tertiary)', marginBottom:10 }}>BD Conversion Funnel</div>
              {crChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={crChartData} margin={{ top:10, right:10, left:-10, bottom:0 }} barCategoryGap="28%">
                    <CartesianGrid {...GRID_CFG} />
                    <XAxis dataKey="bd" tick={TICK_STYLE} />
                    <YAxis tick={TICK_STYLE} allowDecimals={false} />
                    <Tooltip content={<ChartTip />} />
                    <Legend formatter={v => <span style={{ fontSize:10, color:'var(--text-secondary)' }}>{v}</span>} iconSize={7} />
                    <Bar dataKey="Leads Created"   fill={SO.blue}   radius={[4,4,0,0]}>
                      <LabelList dataKey="Leads Created"   position="top" style={{ fill:SO.blue,   fontSize:10, fontWeight:700 }} formatter={v=>v>0?v:''} />
                    </Bar>
                    <Bar dataKey="Leads Contacted" fill={SO.purple} radius={[4,4,0,0]}>
                      <LabelList dataKey="Leads Contacted" position="top" style={{ fill:SO.purple, fontSize:10, fontWeight:700 }} formatter={v=>v>0?v:''} />
                    </Bar>
                    <Bar dataKey="Opportunities"   fill={SO.green}  radius={[4,4,0,0]}>
                      <LabelList dataKey="Opportunities"   position="top" style={{ fill:SO.green,  fontSize:10, fontWeight:700 }} formatter={v=>v>0?v:''} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign:'center', color:'var(--text-hint)', fontSize:12, padding:'40px 0' }}>No lead data</div>
              )}
            </div>

          </div>{/* end kpi-grid-2col-bottom CR */}

          {/* ══════ OPPORTUNITIES PROGRESS ══════ */}
          <Separator />
          <SectionLabel>Opportunities Progress</SectionLabel>
          <div className="kpi-grid-2col-bottom">

            {/* Table */}
            <div style={{ minWidth:0 }}>
              <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
                <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0, border:'1px solid var(--border-color)', borderRadius:10, overflow:'hidden', minWidth:340 }}>
                  <thead>
                    <tr>
                      <th style={THL}>BD</th>
                      {OPPORTUNITY_STAGES.map(s => <th key={s} style={TH}>{s}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {displayOPRows.map((u,i) => (
                      <tr key={u.name} style={{ background:i%2===0?'var(--bg-card)':'var(--bg-secondary)', transition:'background 120ms' }}
                        onMouseEnter={e=>e.currentTarget.style.background='var(--so-blue-soft)'}
                        onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'var(--bg-card)':'var(--bg-secondary)'}>
                        <td style={TDL}>{u.name}</td>
                        {u.counts.map((cnt,si) => <td key={si} style={{ ...TD, color:cnt>0?'var(--text-primary)':'var(--text-hint)' }}>{cnt||'—'}</td>)}
                      </tr>
                    ))}
                    <tr style={{ background:'var(--bg-tertiary)', borderTop:'1px solid var(--border-strong-color)' }}>
                      <td style={{ ...TDL_TOT, borderTop:'1px solid var(--border-strong-color)' }}>Total</td>
                      {OPPORTUNITY_STAGES.map((s,si) => {
                        const cnt=displayOPRows.reduce((a,r)=>a+(r.counts[si]||0),0)
                        return <td key={s} style={{ ...TD_TOT, color:cnt>0?SO.blue:'var(--text-hint)', borderTop:'1px solid var(--border-strong-color)' }}>{cnt||'—'}</td>
                      })}
                    </tr>
                    <tr style={{ background:'var(--bg-tertiary)' }}>
                      <td style={{ ...TDL_TOT, color:SO.blue, fontWeight:700 }}>Total Vol</td>
                      {OPPORTUNITY_STAGES.map(s => {
                        const v=state.opportunities.filter(o=>o.stage===s&&(filterOwner?o.leadOwner===filterOwner:true)).reduce((a,o)=>a+(o.expectedMonthlyVolume||0),0)
                        return <td key={s} style={{ ...TD_TOT, color:v>0?SO.blue:'var(--text-hint)', fontWeight:700 }}>{v>0?formatCurrency(v):'—'}</td>
                      })}
                    </tr>
                    <tr style={{ background:'var(--bg-tertiary)' }}>
                      <td style={{ ...TDL_TOT, color:SO.green, fontWeight:700 }}>Total TC</td>
                      {OPPORTUNITY_STAGES.map(s => {
                        const v=state.opportunities.filter(o=>o.stage===s&&(filterOwner?o.leadOwner===filterOwner:true)).reduce((a,o)=>a+(o.expectedMonthlyRevenue||0),0)
                        return <td key={s} style={{ ...TD_TOT, color:v>0?SO.green:'var(--text-hint)', fontWeight:700 }}>{v>0?formatCurrency(v):'—'}</td>
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Stacked bar chart per BD per stage */}
            <div style={{ minWidth:0, display:'flex', flexDirection:'column', justifyContent:'center' }}>
              <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--text-tertiary)', marginBottom:10 }}>Pipeline by BD</div>
              {opChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={opChartData} margin={{ top:10, right:10, left:-10, bottom:0 }} barCategoryGap="30%">
                    <CartesianGrid {...GRID_CFG} />
                    <XAxis dataKey="bd" tick={TICK_STYLE} />
                    <YAxis tick={TICK_STYLE} allowDecimals={false} />
                    <Tooltip content={<ChartTip />} />
                    <Legend formatter={v => <span style={{ fontSize:10, color:'var(--text-secondary)' }}>{v}</span>} iconSize={7} />
                    {OPPORTUNITY_STAGES.map(s => (
                      <Bar key={s} dataKey={s} stackId="a" fill={STAGE_COLORS_CH[s]} radius={s==='On Hold'?[4,4,0,0]:[0,0,0,0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign:'center', color:'var(--text-hint)', fontSize:12, padding:'40px 0' }}>No opportunity data</div>
              )}
            </div>

          </div>{/* end kpi-grid-2col-bottom OP */}

        </div>{/* end sectionRef */}
      </div>
    </div>
  )
}
