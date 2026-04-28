import React, { useState, useMemo, useRef } from 'react'
import { useCRM } from '../store/CRMContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LabelList
} from 'recharts'
import { filterByDateRange, formatCurrency, getDailyVolume, isOverdue, daysDiff } from '../utils/helpers'
import { TIME_FILTERS, ACTIVE_STAGES, TEAM_MEMBERS, MANAGER_DESIGNATIONS } from '../data/constants'
import { useAuth } from '../store/AuthContext'
import KPISection from '../components/dashboard/KPISection'

const SO = { blue: '#4796E3', purple: '#9177C7', pink: '#CA6673', green: '#1E8E3E', teal: '#129EAF', orange: '#E37400', indigo: '#5C6BC0' }
const BRAND = [SO.blue, SO.purple, SO.pink, SO.green, SO.teal, SO.orange, SO.indigo]
const STAGE_BRAND = { Prospecting: SO.blue, Won: SO.purple, Onboarded: SO.green, Activated: SO.pink, Lost: '#D93025', 'On Hold': '#9AA0A6' }

const ORDER_KEY = 'so_dashboard_order_v1'
const DEFAULT_ORDER = ['activity-type', 'trending-nob', 'call-volume', 'call-outcomes', 'call-types', 'funnel', 'source', 'verticals', 'leaderboard']

function loadOrder() {
  try { return JSON.parse(localStorage.getItem(ORDER_KEY)) || DEFAULT_ORDER } catch { return DEFAULT_ORDER }
}
function saveOrder(o) { localStorage.setItem(ORDER_KEY, JSON.stringify(o)) }

function calcAvgDaysToStage(opps, leads, targetStage) {
  const relevant = opps.filter(o => o.stageHistory?.some(s => s.stage === targetStage))
  if (!relevant.length) return null
  const vals = relevant.map(opp => {
    const lead = opp.leadId ? leads.find(l => l.id === opp.leadId) : null
    const start = lead ? lead.createdAt : opp.createdAt
    const entry = opp.stageHistory.find(s => s.stage === targetStage)
    if (!entry) return null
    return Math.max(0, daysDiff(start, entry.enteredAt))
  }).filter(v => v !== null)
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
}

/* ── Tooltip ── */
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

/* ── KPI Card ── */
function KPI({ label, children, accent }) {
  return (
    <div className="stat-card so-hover-card" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-tertiary)' }}>{label}</div>
      <div style={{ color: accent || 'var(--text-primary)' }}>{children}</div>
    </div>
  )
}

/* ── Draggable chart section ── */
function DragSection({ id, dragId, onDragStart, onDragOver, onDrop, children }) {
  const isOver = dragId === id
  return (
    <div
      draggable
      onDragStart={() => onDragStart(id)}
      onDragOver={e => { e.preventDefault(); onDragOver(id) }}
      onDrop={() => onDrop(id)}
      style={{
        cursor: 'grab', outline: isOver ? `2px dashed ${SO.blue}` : 'none',
        background: isOver ? `rgba(71,150,227,0.04)` : 'transparent',
        borderRadius: 14, transition: 'outline 0.15s, background 0.15s'
      }}
    >
      {children}
    </div>
  )
}

const tickStyle = { fill: 'var(--text-tertiary)', fontSize: 11 }
const gridCfg = { stroke: 'var(--border-color)', strokeWidth: 0.5 }

export default function Dashboard() {
  const { state } = useCRM()
  const { currentUser } = useAuth()
  const [timeFilter, setTimeFilter] = useState('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [order, setOrder] = useState(loadOrder)
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  const { leads, opportunities, activities } = state

  // Role-based data filter
  const isManager = MANAGER_DESIGNATIONS.includes(currentUser?.designation) || currentUser?.role === 'Manager'
  const myLeads = isManager ? leads : leads.filter(l => l.leadOwner === currentUser?.name)
  const myOpps  = isManager ? opportunities : opportunities.filter(o => o.leadOwner === currentUser?.name)
  const myActs  = isManager ? activities : activities.filter(a => a.loggedBy === currentUser?.name)

  function filterRange(items, field) {
    if (timeFilter === 'custom') {
      if (!customFrom && !customTo) return items
      return items.filter(item => {
        const d = new Date(item[field])
        if (customFrom && d < new Date(customFrom)) return false
        if (customTo && d > new Date(customTo + 'T23:59:59')) return false
        return true
      })
    }
    return filterByDateRange(items, field, timeFilter)
  }

  const fLeads = useMemo(() => filterRange(myLeads, 'createdAt'), [myLeads, timeFilter, customFrom, customTo])
  const fActs  = useMemo(() => filterRange(myActs, 'dateTime'), [myActs, timeFilter, customFrom, customTo])
  const fOpps  = useMemo(() => filterRange(myOpps, 'createdAt'), [myOpps, timeFilter, customFrom, customTo])

  // KPI 1
  const totalLeads      = fLeads.length
  const convertedLeads  = fLeads.filter(l => l.status === 'Converted').length

  // KPI 2 — Lead → Onboarded %
  const onboardedOpps   = myOpps.filter(o => ['Onboarded','Activated'].includes(o.stage))
  const onboardedRate   = totalLeads ? Math.round((onboardedOpps.length / totalLeads) * 100) : 0

  // KPI 3 — Volume + Revenue of Onboarded + Activated
  const onboardedVol = myOpps.filter(o => o.stage === 'Onboarded').reduce((s, o) => s + (o.expectedMonthlyVolume || 0), 0)
  const onboardedRev = myOpps.filter(o => o.stage === 'Onboarded').reduce((s, o) => s + (o.expectedMonthlyRevenue || 0), 0)
  const transactedVol = myOpps.filter(o => o.stage === 'Activated').reduce((s, o) => s + (o.expectedMonthlyVolume || 0), 0)
  const transactedRev = myOpps.filter(o => o.stage === 'Activated').reduce((s, o) => s + (o.expectedMonthlyRevenue || 0), 0)

  // KPI 4 — Sales Velocity (avg days lead → stage)
  const avgToOnboarded   = calcAvgDaysToStage(myOpps, myLeads, 'Onboarded')
  const avgToActivated  = calcAvgDaysToStage(myOpps, myLeads, 'Activated')

  // KPI 5+6 already fine
  const totalCalls      = fActs.filter(a => a.type === 'Call').length
  const newLeadsCount   = fLeads.filter(l => l.status === 'New').length
  const overdueFollowUps = myActs.filter(a => a.nextFollowUpDate && isOverdue(a.nextFollowUpDate)).length

  // KPI 7 — total opps scored (all opps that reached Won or beyond)
  const scoredOpps = myOpps.filter(o => ['Won','Onboarded','Activated'].includes(o.stage)).length

  // KPI 8 fine
  const totalOpps = myOpps.length

  // Chart data
  const dailyCalls = getDailyVolume(fActs.filter(a => a.type === 'Call'), 14)

  const outcomeMap = {}
  fActs.filter(a => a.type === 'Call' && a.callOutcome).forEach(a => { outcomeMap[a.callOutcome] = (outcomeMap[a.callOutcome] || 0) + 1 })
  const outcomeData = Object.entries(outcomeMap).map(([name, value]) => ({ name, value }))

  const callTypeMap = {}
  fActs.filter(a => a.type === 'Call' && a.callType).forEach(a => { callTypeMap[a.callType] = (callTypeMap[a.callType] || 0) + 1 })
  const callTypeData = Object.entries(callTypeMap).map(([name, value]) => ({ name, value }))

  const sourceMap = {}
  fLeads.forEach(l => { sourceMap[l.leadSource || 'Unknown'] = (sourceMap[l.leadSource || 'Unknown'] || 0) + 1 })
  const sourceData = Object.entries(sourceMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))

  const vertMap = {}
  fLeads.forEach(l => { if (l.vertical) vertMap[l.vertical] = (vertMap[l.vertical] || 0) + 1 })
  const vertData = Object.entries(vertMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))

  const funnelData = ACTIVE_STAGES.map(stage => ({
    stage,
    count: myOpps.filter(o => o.stage === stage).length,
    volume: myOpps.filter(o => o.stage === stage).reduce((s, o) => s + (o.expectedMonthlyVolume || 0), 0),
    revenue: myOpps.filter(o => o.stage === stage).reduce((s, o) => s + (o.expectedMonthlyRevenue || 0), 0)
  }))
  const funnelMax = Math.max(...funnelData.map(f => f.count), 1)

  const actTypeMap = {}
  fActs.forEach(a => { actTypeMap[a.type] = (actTypeMap[a.type] || 0) + 1 })
  const actTypeData = Object.entries(actTypeMap).map(([name, value]) => ({ name, value }))

  const nobMap = {}
  fOpps.forEach(o => { if (o.natureOfBusiness) nobMap[o.natureOfBusiness] = (nobMap[o.natureOfBusiness] || 0) + 1 })
  const nobData = Object.entries(nobMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))

  const repData = TEAM_MEMBERS.map(name => ({
    name: name.split(' ')[0],
    leads: leads.filter(l => l.leadOwner === name).length,
    calls: activities.filter(a => a.loggedBy === name && a.type === 'Call').length,
    opps: opportunities.filter(o => o.leadOwner === name).length,
    scored: opportunities.filter(o => o.leadOwner === name && ['Won','Onboarded','Activated'].includes(o.stage)).length,
    transacted: opportunities.filter(o => o.leadOwner === name && o.stage === 'Activated').length,
  })).filter(r => r.leads + r.calls + r.opps > 0).sort((a, b) => b.calls - a.calls)

  // Drag-and-drop
  function onDragStart(id) { setDragging(id) }
  function onDragOver(id) { setDragOver(id) }
  function onDrop(targetId) {
    if (!dragging || dragging === targetId) { setDragging(null); setDragOver(null); return }
    setOrder(prev => {
      const arr = [...prev]
      const fromIdx = arr.indexOf(dragging)
      const toIdx   = arr.indexOf(targetId)
      if (fromIdx < 0 || toIdx < 0) return prev
      arr.splice(fromIdx, 1)
      arr.splice(toIdx, 0, dragging)
      saveOrder(arr)
      return arr
    })
    setDragging(null)
    setDragOver(null)
  }

  function ChartCard({ id, title, children, gridSpan }) {
    return (
      <DragSection id={id} dragId={dragOver} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}>
        <div className="card so-hover-card" style={gridSpan === 3 ? { gridColumn: '1/-1' } : {}}>
          <div style={{ marginBottom: 14, paddingBottom: 10, borderBottom: '0.5px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, letterSpacing: '-0.2px' }}>{title}</h3>
            <span style={{ fontSize: 10, color: 'var(--text-hint)', cursor: 'grab' }}>⠿ drag</span>
          </div>
          {children}
        </div>
      </DragSection>
    )
  }

  // Charts map
  const CHARTS = {
    'activity-type': (
      <ChartCard key="activity-type" id="activity-type" title="Sales Activity Type">
        {actTypeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={actTypeData} margin={{ top: 20, right: 4, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" {...gridCfg} />
              <XAxis dataKey="name" tick={tickStyle} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="value" radius={[6,6,0,0]} name="Count">
                {actTypeData.map((_, i) => <Cell key={i} fill={BRAND[i % BRAND.length]} />)}
                <LabelList dataKey="value" position="top" style={{ fill: 'var(--text-primary)', fontWeight: 700, fontSize: 12 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <div className="empty-state" style={{ padding: '30px 0' }}><div style={{ fontSize: 12 }}>No data.</div></div>}
      </ChartCard>
    ),

    'trending-nob': (
      <ChartCard key="trending-nob" id="trending-nob" title="Trending Nature of Businesses">
        {nobData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={nobData} margin={{ top: 20, right: 4, left: 4, bottom: 40 }}>
              <CartesianGrid strokeDasharray="2 4" {...gridCfg} />
              <XAxis dataKey="name" tick={{ ...tickStyle, fontSize: 9 }} angle={-35} textAnchor="end" interval={0} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="value" radius={[6,6,0,0]} name="Opportunities">
                {nobData.map((_, i) => <Cell key={i} fill={BRAND[(i+2) % BRAND.length]} />)}
                <LabelList dataKey="value" position="top" style={{ fill: 'var(--text-primary)', fontWeight: 700, fontSize: 12 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <div className="empty-state" style={{ padding: '30px 0' }}><div style={{ fontSize: 12 }}>No data.</div></div>}
      </ChartCard>
    ),

    'call-volume': (
      <ChartCard key="call-volume" id="call-volume" title="Daily Call Volume — 14 days">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={dailyCalls} margin={{ top: 24, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={SO.blue}   stopOpacity={0.28}/>
                <stop offset="100%" stopColor={SO.purple}  stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" {...gridCfg} />
            <XAxis dataKey="date" tick={tickStyle} />
            <Tooltip content={<Tip />} />
            <Area type="monotone" dataKey="calls" stroke={SO.blue} fill="url(#areaG)" strokeWidth={2.5}
              dot={false} activeDot={{ r: 5, fill: SO.blue, stroke: '#fff', strokeWidth: 2 }} name="Calls">
              <LabelList dataKey="calls" position="top" style={{ fill: SO.blue, fontWeight: 800, fontSize: 11 }} formatter={v => v > 0 ? v : ''} />
            </Area>
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    ),

    'call-outcomes': (
      <ChartCard key="call-outcomes" id="call-outcomes" title="Call Outcomes">
        {outcomeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={outcomeData} cx="50%" cy="50%" innerRadius={52} outerRadius={88} paddingAngle={3} dataKey="value" stroke="none"
                label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                  const r = innerRadius + (outerRadius - innerRadius) * 0.5
                  const x = cx + r * Math.cos(-midAngle * Math.PI / 180)
                  const y = cy + r * Math.sin(-midAngle * Math.PI / 180)
                  return <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={800}>{value}</text>
                }}
                labelLine={false}>
                {outcomeData.map((_, i) => <Cell key={i} fill={BRAND[i % BRAND.length]} />)}
              </Pie>
              <Tooltip content={<Tip />} />
              <Legend formatter={v => <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{v}</span>} iconType="circle" iconSize={7} />
            </PieChart>
          </ResponsiveContainer>
        ) : <div className="empty-state" style={{ padding: '40px 0' }}><div style={{ fontSize: 12 }}>No call data.</div></div>}
      </ChartCard>
    ),

    'call-types': (
      <ChartCard key="call-types" id="call-types" title="Call Types">
        {callTypeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={callTypeData} cx="50%" cy="50%" outerRadius={88} paddingAngle={3} dataKey="value" stroke="none"
                label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                  const r = (outerRadius - innerRadius) * 0.55 + innerRadius
                  const x = cx + r * Math.cos(-midAngle * Math.PI / 180)
                  const y = cy + r * Math.sin(-midAngle * Math.PI / 180)
                  return <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={800}>{value}</text>
                }}
                labelLine={false}>
                {callTypeData.map((_, i) => <Cell key={i} fill={[SO.blue, SO.purple, SO.pink, SO.green][i % 4]} />)}
              </Pie>
              <Tooltip content={<Tip />} />
              <Legend formatter={v => <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{v}</span>} iconType="circle" iconSize={7} />
            </PieChart>
          </ResponsiveContainer>
        ) : <div className="empty-state" style={{ padding: '40px 0' }}><div style={{ fontSize: 12 }}>No call type data.</div></div>}
      </ChartCard>
    ),

    'funnel': (
      <ChartCard key="funnel" id="funnel" title="Pipeline Funnel">
        <div style={{ padding: '4px 0' }}>
          {funnelData.map((f, i) => {
            const pct = funnelMax > 0 ? Math.max((f.count / funnelMax) * 100, f.count > 0 ? 8 : 0) : 0
            const color = STAGE_BRAND[f.stage]
            return (
              <div key={f.stage} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                  <span style={{ fontWeight: 600, color }}>{f.stage}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    {f.count} deals · Vol {formatCurrency(f.volume)} · Rev {formatCurrency(f.revenue)}
                  </span>
                </div>
                <div style={{ height: 28, background: 'var(--border-color)', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: `linear-gradient(90deg, ${color}cc, ${color})`,
                    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)'
                  }}>
                    {f.count > 0 && <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>{f.count}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </ChartCard>
    ),

    'source': (
      <ChartCard key="source" id="source" title="Lead Source Breakdown">
        {sourceData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sourceData} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="srcGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor={SO.blue}   />
                  <stop offset="100%" stopColor={SO.purple}  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" {...gridCfg} horizontal={false} />
              <YAxis dataKey="name" type="category" tick={tickStyle} width={120} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="value" fill="url(#srcGrad)" name="Leads" radius={[0,6,6,0]}>
                <LabelList dataKey="value" position="right" style={{ fill: 'var(--text-primary)', fontWeight: 700, fontSize: 12 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <div className="empty-state" style={{ padding: '40px 0' }}><div style={{ fontSize: 12 }}>No data.</div></div>}
      </ChartCard>
    ),

    'verticals': (
      <ChartCard key="verticals" id="verticals" title="Trending Verticals">
        {vertData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={vertData} margin={{ top: 20, right: 4, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" {...gridCfg} />
              <XAxis dataKey="name" tick={tickStyle} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="value" radius={[6,6,0,0]} name="Leads">
                {vertData.map((_, i) => <Cell key={i} fill={BRAND[i % BRAND.length]} />)}
                <LabelList dataKey="value" position="top" style={{ fill: 'var(--text-primary)', fontWeight: 700, fontSize: 13 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <div className="empty-state" style={{ padding: '40px 0' }}><div style={{ fontSize: 12 }}>No data.</div></div>}
      </ChartCard>
    ),

    'leaderboard': (
      <ChartCard key="leaderboard" id="leaderboard" title="BDs Performance Leaderboard">
        {repData.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th><th>BD</th><th>Leads</th><th>Calls</th>
                  <th>Opportunities Scored</th><th>Activated Opp.</th><th>Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {repData.map((rep, i) => {
                  const totalOppForRate = rep.opps || 0
                  const wr = totalOppForRate > 0 ? Math.round((rep.transacted / totalOppForRate) * 100) : 0
                  const barColor = wr > 60 ? SO.green : wr > 30 ? SO.purple : SO.pink
                  return (
                    <tr key={rep.name}>
                      <td style={{ fontWeight: 700, color: i === 0 ? SO.blue : 'var(--text-tertiary)' }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                      </td>
                      <td style={{ fontWeight: 600 }}>{rep.name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{rep.leads}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: SO.blue, fontWeight: 700 }}>{rep.calls}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: SO.purple, fontWeight: 700 }}>{rep.scored}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: SO.green, fontWeight: 700 }}>{rep.transacted}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 5, background: 'var(--border-color)', borderRadius: 3, minWidth: 60, overflow: 'hidden' }}>
                            <div style={{ width: `${wr}%`, height: '100%', background: `linear-gradient(90deg,${SO.blue},${barColor})`, borderRadius: 3, transition: 'width 0.8s ease' }} />
                          </div>
                          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: barColor, fontWeight: 700, flexShrink: 0 }}>{wr}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : <div className="empty-state" style={{ padding: '30px 0' }}><div style={{ fontSize: 12 }}>No data.</div></div>}
      </ChartCard>
    ),
  }

  // Ordered charts, 3-column grid layout mapping
  const FULL_WIDTH = new Set(['funnel', 'leaderboard'])
  const THREE_COL  = new Set(['call-volume', 'call-outcomes', 'call-types'])

  // Group charts into rows by order
  const orderedCharts = order.filter(id => CHARTS[id])

  // Build rows: 3-col group, 2-col pairs, full-width singles
  const rows = []
  let i = 0
  while (i < orderedCharts.length) {
    const id = orderedCharts[i]
    if (FULL_WIDTH.has(id)) { rows.push({ type: 'full', ids: [id] }); i++; continue }
    // Try to group call charts together as 3-col
    const tri = orderedCharts.slice(i, i+3).filter(x => THREE_COL.has(x))
    if (tri.length === 3) { rows.push({ type: 'tri', ids: tri }); i += 3; continue }
    // Default: pair
    const pair = [id]
    if (i + 1 < orderedCharts.length && !FULL_WIDTH.has(orderedCharts[i+1])) { pair.push(orderedCharts[i+1]); i += 2 }
    else i++
    rows.push({ type: 'pair', ids: pair })
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>Dashboard</h2>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {!isManager && <span style={{ marginLeft: 10, color: 'var(--so-blue)', fontWeight: 600 }}>· {currentUser?.name}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="tabs">
            {TIME_FILTERS.map(f => (
              <button key={f.value} className={`tab ${timeFilter === f.value ? 'active' : ''}`} onClick={() => setTimeFilter(f.value)}>
                {f.label}
              </button>
            ))}
          </div>
          {timeFilter === 'custom' && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                style={{ width: 130, fontSize: 12, padding: '5px 8px', borderRadius: 8 }} />
              <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>→</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                style={{ width: 130, fontSize: 12, padding: '5px 8px', borderRadius: 8 }} />
            </div>
          )}
        </div>
      </div>

      <div className="page-body">
        <KPISection />

        {/* KPI Row 1 */}
        <div className="grid-4 so-stagger" style={{ marginBottom: 14 }}>
          <KPI label="Total Leads" accent={SO.blue}>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>{totalLeads}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{convertedLeads} converted</div>
          </KPI>
          <KPI label="Lead → Onboarded %" accent={SO.purple}>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>{onboardedRate}%</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{onboardedOpps.length} onboarded / transacted</div>
          </KPI>
          <KPI label="Active Pipeline" accent={SO.green}>
            <div style={{ fontSize: 16, fontWeight: 700, color: SO.blue, fontFamily: 'var(--font-mono)' }}>{formatCurrency(onboardedVol + transactedVol)}<span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginLeft: 4 }}>vol</span></div>
            <div style={{ fontSize: 16, fontWeight: 700, color: SO.green, fontFamily: 'var(--font-mono)' }}>{formatCurrency(onboardedRev + transactedRev)}<span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginLeft: 4 }}>rev</span></div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>Onboarded + Activated</div>
          </KPI>
          <KPI label="Sales Velocity" accent={SO.pink}>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>
              <span style={{ color: SO.blue, fontFamily: 'var(--font-mono)' }}>{avgToOnboarded ?? '—'} days</span>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginLeft: 6 }}>→ Onboarded</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>
              <span style={{ color: SO.pink, fontFamily: 'var(--font-mono)' }}>{avgToActivated ?? '—'} days</span>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginLeft: 6 }}>→ Activated</span>
            </div>
          </KPI>
        </div>

        {/* KPI Row 2 */}
        <div className="grid-4 so-stagger" style={{ marginBottom: 20 }}>
          <KPI label="Calls Logged" accent={SO.purple}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{totalCalls}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>This period</div>
          </KPI>
          <KPI label="New Leads" accent={SO.teal}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{newLeadsCount}</div>
          </KPI>
          <KPI label="Overdue Follow-ups" accent={overdueFollowUps > 0 ? '#D93025' : SO.green}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{overdueFollowUps}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>Needs attention</div>
          </KPI>
          <KPI label="Total Opportunities Scored" accent={SO.blue}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{scoredOpps}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>Won + Onboarded + Activated</div>
          </KPI>
        </div>

        {/* Draggable charts */}
        <div style={{ fontSize: 11, color: 'var(--text-hint)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>⠿</span> Drag chart cards to rearrange your dashboard layout
        </div>

        {rows.map((row, ri) => {
          if (row.type === 'full') return (
            <div key={ri} style={{ marginBottom: 14 }}>
              {CHARTS[row.ids[0]]}
            </div>
          )
          if (row.type === 'tri') return (
            <div key={ri} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
              {row.ids.map(id => CHARTS[id])}
            </div>
          )
          return (
            <div key={ri} style={{ display: 'grid', gridTemplateColumns: row.ids.length === 2 ? '1fr 1fr' : '1fr', gap: 12, marginBottom: 14 }}>
              {row.ids.map(id => CHARTS[id])}
            </div>
          )
        })}
      </div>
    </div>
  )
}
