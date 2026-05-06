import React, { useState, useMemo, useRef } from 'react'
import { useCRM } from '../store/CRMContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LabelList
} from 'recharts'
import { filterByDateRange, formatCurrency, daysDiff, getStageVelocity, exportToCSV } from '../utils/helpers'
import { TIME_FILTERS, STAGE_COLORS, ACTIVE_STAGES, TEAM_MEMBERS } from '../data/constants'
import { CopyImgBtn } from '../utils/copyImage'

const SO = { blue: '#4796E3', purple: '#9177C7', pink: '#CA6673', green: '#1E8E3E', teal: '#129EAF', orange: '#E37400', indigo: '#5C6BC0' }
const BRAND = [SO.blue, SO.purple, SO.pink, SO.green, SO.teal, SO.orange]

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '10px 14px', fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
      {label && <div style={{ color: 'var(--text-tertiary)', marginBottom: 6, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < payload.length - 1 ? 3 : 0 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          <span style={{ color: 'var(--text-secondary)' }}>{p.name}:</span>
          <span style={{ color: p.color, fontWeight: 700 }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function Section({ title, children, action }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 10, borderBottom: '0.5px solid var(--border-color)' }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>{title}</h2>
        {action}
      </div>
      {children}
    </div>
  )
}

function SCard({ label, value, sub, accent }) {
  return (
    <div className="stat-card so-hover-card">
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-tertiary)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: accent || 'var(--text-primary)', letterSpacing: '-0.5px' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function CCard({ title, children }) {
  const ref = useRef()
  return (
    <div ref={ref} className="card so-hover-card">
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14, paddingBottom: 10, borderBottom: '0.5px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span>{title}</span>
        <CopyImgBtn targetRef={ref} />
      </div>
      {children}
    </div>
  )
}

function calcAvgDays(opps, leads, targetStage) {
  const relevant = opps.filter(o => o.stageHistory?.some(s => s.stage === targetStage))
  if (!relevant.length) return null
  const vals = relevant.map(o => {
    const lead = o.leadId ? leads.find(l => l.id === o.leadId) : null
    const start = lead ? lead.createdAt : o.createdAt
    const entry = o.stageHistory.find(s => s.stage === targetStage)
    if (!entry) return null
    return Math.max(0, daysDiff(start, entry.enteredAt))
  }).filter(v => v !== null)
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
}

const tick = { fill: 'var(--text-tertiary)', fontSize: 11 }
const grid = { stroke: 'var(--border-color)', strokeWidth: 0.5 }

export default function ReportsPage() {
  const { state } = useCRM()
  const [timeFilter, setTimeFilter] = useState('this-month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo,   setCustomTo]   = useState('')

  const { leads, opportunities, activities } = state

  function filterRange(items, field) {
    if (timeFilter === 'custom') {
      return items.filter(item => {
        const d = new Date(item[field])
        if (customFrom && d < new Date(customFrom)) return false
        if (customTo && d > new Date(customTo + 'T23:59:59')) return false
        return true
      })
    }
    return filterByDateRange(items, field, timeFilter)
  }

  const fLeads = useMemo(() => filterRange(leads, 'createdAt'), [leads, timeFilter, customFrom, customTo])
  const fActs  = useMemo(() => filterRange(activities, 'dateTime'), [activities, timeFilter, customFrom, customTo])
  const fOpps  = useMemo(() => filterRange(opportunities, 'createdAt'), [opportunities, timeFilter, customFrom, customTo])

  // ── Lead Analytics ──
  const totalLeads    = fLeads.length
  const convertedLeads = fLeads.filter(l => l.status === 'Converted').length
  const newLeads      = fLeads.filter(l => l.status === 'New').length
  const qualifiedLeads = fLeads.filter(l => l.status === 'Qualified').length
  const deadLeads     = fLeads.filter(l => l.status === 'Lost').length

  const leadStatusData = [
    { name: 'New',       value: newLeads,       color: SO.blue   },
    { name: 'Contacted', value: fLeads.filter(l => l.status === 'Contacted').length, color: SO.teal },
    { name: 'Qualified', value: qualifiedLeads, color: SO.green  },
    { name: 'Converted', value: convertedLeads, color: SO.purple },
    { name: 'Lost',      value: deadLeads,      color: SO.pink   },
  ].filter(d => d.value > 0)

  const sourceMap = {}
  fLeads.forEach(l => { sourceMap[l.leadSource || 'Unknown'] = (sourceMap[l.leadSource || 'Unknown'] || 0) + 1 })
  const sourceData = Object.entries(sourceMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))

  const vertMap = {}
  fLeads.forEach(l => { if (l.vertical) vertMap[l.vertical] = (vertMap[l.vertical] || 0) + 1 })
  const vertData = Object.entries(vertMap).map(([name, value]) => ({ name, value }))

  const agingBuckets = { '0–7d': 0, '8–30d': 0, '31–60d': 0, '60+d': 0 }
  leads.forEach(l => {
    const age = daysDiff(l.createdAt)
    if (age <= 7) agingBuckets['0–7d']++
    else if (age <= 30) agingBuckets['8–30d']++
    else if (age <= 60) agingBuckets['31–60d']++
    else agingBuckets['60+d']++
  })
  const agingData = Object.entries(agingBuckets).map(([name, value]) => ({ name, value }))

  const convFunnel = [
    { name: 'Total Leads',    value: leads.length,          fill: SO.blue   },
    { name: 'Converted',      value: convertedLeads,        fill: SO.purple },
    { name: 'Onboarded+',     value: opportunities.filter(o => ['Onboarded','Activated'].includes(o.stage)).length, fill: SO.green },
    { name: 'Activated',     value: opportunities.filter(o => o.stage === 'Activated').length, fill: SO.pink },
  ]

  // ── Pipeline ──
  const stageData = ACTIVE_STAGES.map(stage => ({
    stage,
    count: opportunities.filter(o => o.stage === stage).length,
    value: opportunities.filter(o => o.stage === stage).reduce((s, o) => s + (o.expectedMonthlyRevenue || 0), 0)
  }))
  const lossMap = {}
  opportunities.filter(o => o.stage === 'Lost' && o.lostReason).forEach(o => { lossMap[o.lostReason] = (lossMap[o.lostReason] || 0) + 1 })
  const lossData = Object.entries(lossMap).map(([name, value]) => ({ name, value }))
  const wonCount  = opportunities.filter(o => ['Won','Onboarded','Activated'].includes(o.stage)).length
  const lostCount = opportunities.filter(o => o.stage === 'Lost').length

  // ── Vertical & NOB ──
  const vertOppMap = {}
  opportunities.forEach(o => { if (o.vertical) { if (!vertOppMap[o.vertical]) vertOppMap[o.vertical] = { count: 0, revenue: 0 }; vertOppMap[o.vertical].count++; vertOppMap[o.vertical].revenue += o.expectedMonthlyRevenue || 0 } })
  const vertOppData = Object.entries(vertOppMap).map(([name, d]) => ({ name, count: d.count, revenue: Math.round(d.revenue) }))
  const nobMap = {}
  opportunities.forEach(o => { if (o.natureOfBusiness) { if (!nobMap[o.natureOfBusiness]) nobMap[o.natureOfBusiness] = { count: 0, revenue: 0 }; nobMap[o.natureOfBusiness].count++; nobMap[o.natureOfBusiness].revenue += o.expectedMonthlyRevenue || 0 } })
  const nobData = Object.entries(nobMap).map(([name, d]) => ({ name, count: d.count, revenue: Math.round(d.revenue) })).sort((a, b) => b.revenue - a.revenue)

  // ── Sales Velocity ──
  const avgToOnboarded  = calcAvgDays(opportunities, leads, 'Onboarded')
  const avgToActivated = calcAvgDays(opportunities, leads, 'Activated')
  const transactedOpps  = opportunities.filter(o => o.stage === 'Activated')
  const allDealsWithRev = opportunities.filter(o => (o.expectedMonthlyRevenue || 0) > 0)
  const avgDeal = allDealsWithRev.length ? Math.round(allDealsWithRev.reduce((s, o) => s + (o.expectedMonthlyRevenue || 0), 0) / allDealsWithRev.length) : 0
  const winRate = (wonCount + lostCount) > 0 ? Math.round((transactedOpps.length / (wonCount + lostCount)) * 100) : 0
  const stageVelocity = getStageVelocity(opportunities)

  const repVelocity = TEAM_MEMBERS.map(name => {
    const repOpps = opportunities.filter(o => o.leadOwner === name)
    const transacted = repOpps.filter(o => o.stage === 'Activated')
    if (!transacted.length) return null
    const cycles = transacted.map(o => {
      const lead = o.leadId ? leads.find(l => l.id === o.leadId) : null
      const start = lead ? lead.createdAt : o.createdAt
      const entry = o.stageHistory.find(s => s.stage === 'Activated')
      return entry ? Math.max(0, daysDiff(start, entry.enteredAt)) : null
    }).filter(Boolean)
    const avg = cycles.length ? Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length) : null
    return avg != null ? { name: name.split(' ')[0], avgDays: avg, count: transacted.length } : null
  }).filter(Boolean)

  // ── Rep Scorecard ──
  const repScorecard = TEAM_MEMBERS.map(name => {
    const myL = leads.filter(l => l.leadOwner === name)
    const myO = opportunities.filter(o => o.leadOwner === name)
    const myC = activities.filter(a => a.loggedBy === name && a.type === 'Call')
    const prospecting = myO.filter(o => o.stage === 'Prospecting').length
    const won         = myO.filter(o => o.stage === 'Won').length
    const onboarded   = myO.filter(o => o.stage === 'Onboarded').length
    const transacted  = myO.filter(o => o.stage === 'Activated').length
    const closedTotal = myO.filter(o => !['On Hold', 'Prospecting'].includes(o.stage)).length
    const wr = closedTotal > 0 ? Math.round((transacted / closedTotal) * 100) : 0
    return { name, leads: myL.length, calls: myC.length, prospecting, won, onboarded, transacted, winRate: wr }
  }).filter(r => r.leads + r.calls > 0)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>Analytics &amp; Reports</h2>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Comprehensive Sales Intelligence</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="tabs">
            {TIME_FILTERS.map(f => (
              <button key={f.value} className={`tab ${timeFilter === f.value ? 'active' : ''}`} onClick={() => setTimeFilter(f.value)}>{f.label}</button>
            ))}
          </div>
          {timeFilter === 'custom' && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={{ width: 130, fontSize: 12, padding: '5px 8px', borderRadius: 8 }} />
              <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>→</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} style={{ width: 130, fontSize: 12, padding: '5px 8px', borderRadius: 8 }} />
            </div>
          )}
        </div>
      </div>

      <div className="page-body">

        {/* Lead Analytics */}
        <Section title="Lead Analytics" action={
          <button className="btn btn-ghost btn-sm" onClick={() => exportToCSV(fLeads.map(l => ({ id: l.id, company: l.companyName, status: l.status, source: l.leadSource, vertical: l.vertical })), 'lead-analytics')}>⬇ Export</button>
        }>
          <div className="grid-4 so-stagger" style={{ marginBottom: 14 }}>
            <SCard label="Total Leads" value={totalLeads} accent={SO.blue} />
            <SCard label="New" value={newLeads} accent={SO.teal} />
            <SCard label="Converted" value={convertedLeads} accent={SO.purple} />
            <SCard label="Conversion Rate" value={totalLeads ? `${Math.round(convertedLeads/totalLeads*100)}%` : '0%'} accent={SO.green} />
          </div>
          <div className="grid-2" style={{ marginBottom: 14 }}>
            <CCard title="Conversion Funnel">
              {convFunnel.map((item, i) => {
                const maxV = convFunnel[0].value || 1
                const pct = Math.max((item.value / maxV) * 100, item.value > 0 ? 5 : 0)
                const cr = i > 0 && convFunnel[i-1].value ? Math.round((item.value / convFunnel[i-1].value) * 100) : null
                return (
                  <div key={item.name} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                      <span style={{ fontWeight: 600, color: item.fill }}>{item.name}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', fontSize: 11 }}>
                        {item.value}{cr != null && <span style={{ color: item.fill, marginLeft: 8, fontWeight: 700 }}>({cr}%)</span>}
                      </span>
                    </div>
                    <div style={{ height: 18, background: 'var(--border-color)', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg,${item.fill}cc,${item.fill})`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'width 0.6s ease' }}>
                        {item.value > 0 && <span style={{ color: '#fff', fontWeight: 800, fontSize: 11 }}>{item.value}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </CCard>
            <CCard title="Lead Status Distribution">
              {leadStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={leadStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" stroke="none"
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                        const r = (outerRadius - innerRadius) * 0.5 + innerRadius
                        const x = cx + r * Math.cos(-midAngle * Math.PI / 180)
                        const y = cy + r * Math.sin(-midAngle * Math.PI / 180)
                        return <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={800}>{value}</text>
                      }} labelLine={false}>
                      {leadStatusData.map((item, i) => <Cell key={i} fill={item.color} />)}
                    </Pie>
                    <Tooltip content={<Tip />} />
                    <Legend formatter={v => <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{v}</span>} iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><div style={{ fontSize: 12 }}>No data.</div></div>}
            </CCard>
          </div>
          <div className="grid-2">
            <CCard title="Lead Source Breakdown">
              {sourceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={sourceData} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                    <defs><linearGradient id="rSrc" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={SO.blue}/><stop offset="100%" stopColor={SO.purple}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="2 4" {...grid} horizontal={false} />
                    <YAxis dataKey="name" type="category" tick={tick} width={120} />
                    <Tooltip content={<Tip />} />
                    <Bar dataKey="value" fill="url(#rSrc)" name="Leads" radius={[0,6,6,0]}>
                      <LabelList dataKey="value" position="right" style={{ fill: 'var(--text-primary)', fontWeight: 700, fontSize: 12 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><div style={{ fontSize: 12 }}>No data.</div></div>}
            </CCard>
            <CCard title="Lead Aging Report">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={agingData} margin={{ top: 20, right: 4, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" {...grid} />
                  <XAxis dataKey="name" tick={tick} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="value" name="Leads" radius={[6,6,0,0]}>
                    {agingData.map((_, i) => <Cell key={i} fill={[SO.green, SO.orange, SO.pink, '#D93025'][i]} />)}
                    <LabelList dataKey="value" position="top" style={{ fill: 'var(--text-primary)', fontWeight: 700, fontSize: 12 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CCard>
          </div>
        </Section>

        {/* Pipeline & Stage Analysis */}
        <Section title="Pipeline &amp; Stage Analysis">
          <div className="grid-4 so-stagger" style={{ marginBottom: 14 }}>
            <SCard label="Total Opportunities" value={opportunities.length} accent={SO.blue} />
            <SCard label="Active Pipeline" value={formatCurrency(opportunities.filter(o => !['Lost','On Hold'].includes(o.stage)).reduce((s, o) => s + (o.expectedMonthlyRevenue || 0), 0))} accent={SO.green} />
            <SCard label="Total Won + Onboarded + Activated" value={wonCount} accent={SO.purple} />
            <SCard label="Total Lost" value={lostCount} accent="#D93025" />
          </div>
          {/* Opportunity detail table — above charts */}
          <div style={{ marginBottom: 20 }}>
            <CCard title="Opportunity Details">
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ minWidth: 700 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}>#</th>
                      <th>BD Name</th>
                      <th>Opportunity</th>
                      <th>Stage</th>
                      <th>Monthly Volume</th>
                      <th>Monthly TC</th>
                      <th>Nature of Business</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opportunities
                      .slice()
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .slice(0, 10)
                      .map((o, i) => (
                        <tr key={o.id} style={{ cursor: 'default' }}>
                          <td style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>{i + 1}</td>
                          <td style={{ fontWeight: 600 }}>{o.leadOwner?.split(' ')[0] || '—'}</td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 12 }}>{o.companyName}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 1 }}>{o.vertical}</div>
                          </td>
                          <td>
                            <span className={`badge badge-${o.stage?.toLowerCase().replace(' ', '-')}`}>{o.stage}</span>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{formatCurrency(o.expectedMonthlyVolume)}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: SO.green }}>{formatCurrency(o.expectedMonthlyRevenue)}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{o.natureOfBusiness || '—'}</td>
                        </tr>
                      ))
                    }
                    {opportunities.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)' }}>No opportunities yet.</td></tr>
                    )}
                  </tbody>
                  {/* Totals footer row */}
                  {opportunities.length > 0 && (
                    <tfoot>
                      <tr>
                        <td colSpan={4} style={{ padding: '8px 14px', fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', borderTop: '1.5px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                          Total ({opportunities.length} opportunities)
                        </td>
                        <td style={{ padding: '8px 14px', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 13, color: SO.blue, borderTop: '1.5px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                          {formatCurrency(opportunities.reduce((s, o) => s + (o.expectedMonthlyVolume || 0), 0))}
                        </td>
                        <td style={{ padding: '8px 14px', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 13, color: SO.green, borderTop: '1.5px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                          {formatCurrency(opportunities.reduce((s, o) => s + (o.expectedMonthlyRevenue || 0), 0))}
                        </td>
                        <td style={{ padding: '8px 14px', borderTop: '1.5px solid var(--border-color)', background: 'var(--bg-tertiary)' }} />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
              {opportunities.length > 10 && (
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'right' }}>
                  Showing 10 of {opportunities.length} · scroll right to see all columns
                </div>
              )}
            </CCard>
          </div>

          <div className="grid-2">
            <CCard title="Stage Count &amp; Revenue">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stageData} margin={{ top: 20, right: 4, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" {...grid} />
                  <XAxis dataKey="stage" tick={tick} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="count" name="Deals" radius={[6,6,0,0]}>
                    {stageData.map((d, i) => <Cell key={i} fill={STAGE_COLORS[d.stage]} />)}
                    <LabelList dataKey="count" position="top" style={{ fill: 'var(--text-primary)', fontWeight: 700, fontSize: 12 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CCard>
            <CCard title="Loss Reason Breakdown">
              {lossData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={lossData} cx="50%" cy="50%" outerRadius={80} dataKey="value" stroke="none"
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                        const r = (outerRadius - innerRadius) * 0.5 + innerRadius
                        const x = cx + r * Math.cos(-midAngle * Math.PI / 180)
                        const y = cy + r * Math.sin(-midAngle * Math.PI / 180)
                        return <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={800}>{value}</text>
                      }} labelLine={false}>
                      {lossData.map((_, i) => <Cell key={i} fill={BRAND[i % BRAND.length]} />)}
                    </Pie>
                    <Tooltip content={<Tip />} />
                    <Legend formatter={v => <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{v}</span>} iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="empty-state" style={{ padding: '40px 0' }}><div style={{ fontSize: 12 }}>No lost deals. 🎉</div></div>}
            </CCard>
          </div>
        </Section>

        {/* Vertical & Business Analysis */}
        <Section title="Vertical &amp; Business Analysis">
          <div className="grid-2">
            <CCard title="Opportunities by Vertical">
              {vertOppData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={vertOppData} margin={{ top: 20, right: 4, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" {...grid} />
                    <XAxis dataKey="name" tick={tick} />
                    <Tooltip content={<Tip />} />
                    <Bar dataKey="count" name="Deals" fill={SO.blue} radius={[6,6,0,0]}>
                      <LabelList dataKey="count" position="top" style={{ fill: 'var(--text-primary)', fontWeight: 700, fontSize: 12 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><div style={{ fontSize: 12 }}>No data.</div></div>}
            </CCard>
            <CCard title="Revenue by Nature of Business">
              {nobData.length > 0 ? (
                <div style={{ overflowY: 'auto', maxHeight: 220 }}>
                  {nobData.map((item, i) => {
                    const maxR = nobData[0]?.revenue || 1
                    return (
                      <div key={item.name} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{item.name}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', color: SO.green, fontWeight: 700 }}>{formatCurrency(item.revenue)}/mo</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${(item.revenue / maxR) * 100}%`, height: '100%', background: BRAND[i % BRAND.length], borderRadius: 3, transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : <div className="empty-state"><div style={{ fontSize: 12 }}>No data.</div></div>}
            </CCard>
          </div>
        </Section>

        {/* Sales Velocity */}
        <Section title="Sales Velocity Metrics">
          <div className="grid-3 so-stagger" style={{ marginBottom: 14 }}>
            <div className="stat-card so-hover-card">
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-tertiary)', marginBottom: 6 }}>AVG Sales Cycle</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 24, fontWeight: 700, color: SO.blue, fontFamily: 'var(--font-mono)' }}>{avgToOnboarded ?? '—'}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>days → Onboarded</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 24, fontWeight: 700, color: SO.pink, fontFamily: 'var(--font-mono)' }}>{avgToActivated ?? '—'}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>days → Activated</span>
                </div>
              </div>
            </div>
            <SCard label="AVG Deal Size" value={formatCurrency(avgDeal)} sub="Based on Activated opportunities" accent={SO.purple} />
            <SCard label="Win Rate" value={`${winRate}%`} sub={`${transactedOpps.length} transacted of ${wonCount + lostCount} closed`} accent={winRate > 50 ? SO.green : SO.pink} />
          </div>
          <div className="grid-2">
            <CCard title="Average Time in Each Stage (Days)">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stageVelocity} margin={{ top: 20, right: 4, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" {...grid} />
                  <XAxis dataKey="stage" tick={tick} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="avgDays" name="Avg Days" radius={[6,6,0,0]}>
                    {stageVelocity.map((d, i) => <Cell key={i} fill={STAGE_COLORS[d.stage]} />)}
                    <LabelList dataKey="avgDays" position="top" style={{ fill: 'var(--text-primary)', fontWeight: 700, fontSize: 12 }} formatter={v => `${v}d`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CCard>
            <CCard title="Close Velocity by BD (Avg Days to Activated)">
              {repVelocity.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={repVelocity} layout="vertical" margin={{ top: 0, right: 50, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" {...grid} horizontal={false} />
                    <YAxis dataKey="name" type="category" tick={tick} width={60} />
                    <Tooltip content={<Tip />} />
                    <Bar dataKey="avgDays" name="Avg Days" radius={[0,6,6,0]}>
                      {repVelocity.map((_, i) => <Cell key={i} fill={BRAND[i % BRAND.length]} />)}
                      <LabelList dataKey="avgDays" position="right" style={{ fill: 'var(--text-primary)', fontWeight: 700, fontSize: 12 }} formatter={v => `${v}d`} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><div style={{ fontSize: 12 }}>Insufficient data.</div></div>}
            </CCard>
          </div>
        </Section>

        {/* BD Scorecard */}
        <Section title="BD Performance Scorecard" action={
          <button className="btn btn-ghost btn-sm" onClick={() => exportToCSV(repScorecard, 'bd-scorecard')}>⬇ Export</button>
        }>
          <CCard title="">
            {repScorecard.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>BD</th><th>Leads</th><th>Calls</th>
                      <th>Prospecting</th><th>Won</th><th>Onboarded</th><th>Activated</th>
                      <th>Win Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repScorecard.sort((a, b) => b.transacted - a.transacted).map(rep => {
                      const bar = rep.winRate > 60 ? SO.green : rep.winRate > 30 ? SO.purple : SO.pink
                      return (
                        <tr key={rep.name}>
                          <td style={{ fontWeight: 600 }}>{rep.name}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{rep.leads}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', color: SO.blue, fontWeight: 700 }}>{rep.calls}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', color: SO.blue }}>{rep.prospecting}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', color: SO.purple }}>{rep.won}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', color: SO.teal }}>{rep.onboarded}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', color: SO.green, fontWeight: 700 }}>{rep.transacted}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 4, background: 'var(--border-color)', borderRadius: 3, minWidth: 50, overflow: 'hidden' }}>
                                <div style={{ width: `${rep.winRate}%`, height: '100%', background: `linear-gradient(90deg,${SO.blue},${bar})`, borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: bar, fontWeight: 700, flexShrink: 0 }}>{rep.winRate}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : <div className="empty-state"><div style={{ fontSize: 12 }}>No BD data yet.</div></div>}
          </CCard>
        </Section>

      </div>
    </div>
  )
}
