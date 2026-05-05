import React, { useState, useMemo } from 'react'
import * as XLSX from 'xlsx'
import { useCRM } from '../store/CRMContext'
import { useAuth } from '../store/AuthContext'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, AreaChart, Area, LabelList, Legend
} from 'recharts'
import { formatCurrency, formatDate, daysDiff, filterByDateRange } from '../utils/helpers'
import {
  LEAD_STATUSES, OPPORTUNITY_STAGES, VERTICALS, NATURE_OF_BUSINESS,
  PRIORITIES, TEAM_MEMBERS
} from '../data/constants'

const SO = { blue: '#4796E3', purple: '#9177C7', pink: '#CA6673', green: '#1E8E3E', teal: '#129EAF', orange: '#E37400', indigo: '#5C6BC0' }
const BRAND = [SO.blue, SO.purple, SO.pink, SO.green, SO.teal, SO.orange, SO.indigo]

const SAVED_KEY = 'salesorbit_custom_reports_v1'
function loadSaved() { try { return JSON.parse(localStorage.getItem(SAVED_KEY)) || [] } catch { return [] } }
function saveSaved(r) { localStorage.setItem(SAVED_KEY, JSON.stringify(r)) }

/* ── Column definitions ── */
const LEAD_COLS = [
  { key: 'companyName',       label: 'Company',         def: true  },
  { key: 'contactPerson',     label: 'Contact',         def: true  },
  { key: 'email',             label: 'Email',           def: true  },
  { key: 'phone',             label: 'Phone',           def: false },
  { key: 'city',              label: 'City',            def: false },
  { key: 'leadSource',        label: 'Lead Source',     def: true  },
  { key: 'vertical',          label: 'Vertical',        def: true  },
  { key: 'natureOfBusiness',  label: 'Nature of Business', def: false },
  { key: 'priority',          label: 'Priority',        def: true  },
  { key: 'status',            label: 'Status',          def: true  },
  { key: 'leadOwner',         label: 'Owner',           def: true  },
  { key: 'createdAt',         label: 'Created Date',    def: true  },
]
const OPP_COLS = [
  { key: 'companyName',           label: 'Company',           def: true  },
  { key: 'opportunityName',       label: 'Opportunity',       def: true  },
  { key: 'stage',                 label: 'Stage',             def: true  },
  { key: 'expectedMonthlyVolume', label: 'Monthly Volume',    def: true  },
  { key: 'expectedMonthlyRevenue',label: 'Monthly TC',   def: true  },
  { key: 'priority',              label: 'Priority',          def: true  },
  { key: 'expectedCloseDate',     label: 'Close Date',        def: true  },
  { key: 'leadOwner',             label: 'Owner',             def: true  },
  { key: 'vertical',              label: 'Vertical',          def: false },
  { key: 'natureOfBusiness',      label: 'Nature of Business',def: false },
  { key: 'decisionMaker',         label: 'Decision Maker',    def: false },
  { key: 'competitors',           label: 'Competitors',       def: false },
  { key: 'createdAt',             label: 'Created Date',      def: false },
]

const REPORT_TYPES = [
  { id: 'leads',         label: 'Leads Report',              icon: '◈', desc: 'Lead volume, sources, status & conversion analysis' },
  { id: 'pipeline',      label: 'Pipeline Report',           icon: '⋮⋮', desc: 'Stage funnel, deal values & win/loss breakdown' },
  { id: 'opportunities', label: 'Opportunities Analysis',    icon: '◆', desc: 'TC analysis, NOB breakdown & deal insights' },
]

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '8px 12px', fontSize: 11, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
      {label && <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)' }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          <span style={{ color: 'var(--text-secondary)' }}>{p.name}:</span>
          <span style={{ fontWeight: 700, color: p.color }}>{typeof p.value === 'number' && p.value > 999 ? formatCurrency(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

function SCard({ label, value, accent }) {
  return (
    <div className="stat-card" style={{ padding: '12px 16px' }}>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: accent || 'var(--text-primary)', letterSpacing: '-0.3px' }}>{value}</div>
    </div>
  )
}

function CCard({ title, children }) {
  return (
    <div className="card">
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12, paddingBottom: 10, borderBottom: '0.5px solid var(--border-color)' }}>{title}</div>
      {children}
    </div>
  )
}

const tick = { fill: 'var(--text-tertiary)', fontSize: 10 }
const grid = { stroke: 'var(--border-color)', strokeWidth: 0.5 }

/* ── XLS Download ── */
function downloadXLS(reportName, summaryData, tableData, chartsData) {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Summary
  const summaryRows = summaryData.map(r => ({ Metric: r.label, Value: r.raw ?? r.value }))
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  // Sheet 2: Data
  if (tableData.length) {
    const wsData = XLSX.utils.json_to_sheet(tableData)
    XLSX.utils.book_append_sheet(wb, wsData, 'Data')
  }

  // Sheet 3: Chart Data
  if (chartsData && chartsData.length) {
    chartsData.forEach((cd, i) => {
      if (cd.data?.length) {
        const ws = XLSX.utils.json_to_sheet(cd.data)
        XLSX.utils.book_append_sheet(wb, ws, cd.title.slice(0, 31))
      }
    })
  }

  XLSX.writeFile(wb, `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

/* ── Empty filter defaults ── */
function defaultConfig(type) {
  return {
    dateFrom: '', dateTo: '',
    status: [], priority: [], vertical: [], owner: [], stage: [], nob: [],
    columns: (type === 'leads' ? LEAD_COLS : OPP_COLS).filter(c => c.def).map(c => c.key)
  }
}

export default function CustomReportsPage() {
  const { state } = useCRM()
  const { currentUser } = useAuth()
  const { leads, opportunities, activities } = state

  const [savedReports, setSavedReports] = useState(loadSaved)
  const [view, setView] = useState('list')   // list | builder | preview
  const [editReport, setEditReport] = useState(null)

  // Builder state
  const [name, setName]         = useState('')
  const [type, setType]         = useState('')
  const [config, setConfig]     = useState({})
  const [previewData, setPreview] = useState(null)

  function startNew() {
    setName(''); setType(''); setConfig({}); setPreview(null)
    setEditReport(null); setView('builder')
  }

  function openReport(r) {
    setName(r.name); setType(r.type); setConfig(r.config)
    generatePreview(r.type, r.config)
    setEditReport(r); setView('preview')
  }

  function deleteReport(id) {
    if (!confirm('Delete this report?')) return
    const updated = savedReports.filter(r => r.id !== id)
    setSavedReports(updated); saveSaved(updated)
  }

  function setC(k, v) { setConfig(prev => ({ ...prev, [k]: v })) }

  function toggleMulti(k, val) {
    setConfig(prev => {
      const arr = prev[k] || []
      return { ...prev, [k]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] }
    })
  }

  function toggleCol(key) {
    setConfig(prev => {
      const cols = prev.columns || []
      return { ...prev, columns: cols.includes(key) ? cols.filter(x => x !== key) : [...cols, key] }
    })
  }

  function selectType(t) {
    setType(t)
    setConfig(defaultConfig(t))
    setPreview(null)
  }

  // ── Apply filters ──
  function applyFilters(type, cfg) {
    const from = cfg.dateFrom ? new Date(cfg.dateFrom) : null
    const to   = cfg.dateTo   ? new Date(cfg.dateTo + 'T23:59:59') : null

    function inRange(item, field) {
      if (!from && !to) return true
      const d = new Date(item[field])
      if (from && d < from) return false
      if (to   && d > to)   return false
      return true
    }

    if (type === 'leads') {
      return leads.filter(l => {
        if (!inRange(l, 'createdAt')) return false
        if (cfg.status?.length  && !cfg.status.includes(l.status))   return false
        if (cfg.priority?.length && !cfg.priority.includes(l.priority)) return false
        if (cfg.vertical?.length && !cfg.vertical.includes(l.vertical)) return false
        if (cfg.owner?.length   && !cfg.owner.includes(l.leadOwner))  return false
        return true
      })
    }
    return opportunities.filter(o => {
      if (!inRange(o, 'createdAt')) return false
      if (cfg.stage?.length    && !cfg.stage.includes(o.stage))              return false
      if (cfg.priority?.length && !cfg.priority.includes(o.priority))        return false
      if (cfg.vertical?.length && !cfg.vertical.includes(o.vertical))        return false
      if (cfg.owner?.length    && !cfg.owner.includes(o.leadOwner))          return false
      if (cfg.nob?.length      && !cfg.nob.includes(o.natureOfBusiness))     return false
      return true
    })
  }

  // ── Generate preview data ──
  function generatePreview(reportType, cfg) {
    const filtered = applyFilters(reportType, cfg)
    const cols = cfg.columns || []

    if (reportType === 'leads') {
      const statusMap = {}, sourceMap = {}, vertMap = {}, priorityMap = {}
      filtered.forEach(l => {
        statusMap[l.status || 'Unknown']   = (statusMap[l.status || 'Unknown']   || 0) + 1
        sourceMap[l.leadSource || 'Unknown'] = (sourceMap[l.leadSource || 'Unknown'] || 0) + 1
        vertMap[l.vertical || 'Unknown']    = (vertMap[l.vertical || 'Unknown']    || 0) + 1
        priorityMap[l.priority || 'Unknown']= (priorityMap[l.priority || 'Unknown']|| 0) + 1
      })
      const converted = filtered.filter(l => l.status === 'Converted').length
      const convRate  = filtered.length ? Math.round(converted / filtered.length * 100) : 0

      setPreview({
        type: 'leads', count: filtered.length,
        summary: [
          { label: 'Total Leads',      value: filtered.length,  raw: filtered.length  },
          { label: 'Converted',        value: converted,         raw: converted         },
          { label: 'Conversion Rate',  value: `${convRate}%`,   raw: convRate          },
          { label: 'Hot Leads',        value: filtered.filter(l => l.priority === 'Hot').length, raw: filtered.filter(l => l.priority === 'Hot').length },
          { label: 'New Leads',        value: filtered.filter(l => l.status === 'New').length,   raw: filtered.filter(l => l.status === 'New').length   },
        ],
        charts: [
          { title: 'Status Distribution', data: Object.entries(statusMap).map(([name, value]) => ({ name, value })) },
          { title: 'Lead Source',          data: Object.entries(sourceMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value) },
          { title: 'Vertical',             data: Object.entries(vertMap).map(([name, value]) => ({ name, value })) },
          { title: 'Priority',             data: Object.entries(priorityMap).map(([name, value]) => ({ name, value })) },
        ],
        tableData: filtered.map(l => {
          const row = {}
          LEAD_COLS.filter(c => cols.includes(c.key)).forEach(c => {
            row[c.label] = c.key === 'createdAt' ? formatDate(l[c.key]) : (l[c.key] || '—')
          })
          return row
        }),
        raw: filtered
      })
    } else {
      const stageMap = {}, nobMap = {}, vertOppMap = {}, ownerMap = {}
      filtered.forEach(o => {
        stageMap[o.stage || 'Unknown']            = (stageMap[o.stage || 'Unknown']   || 0) + 1
        nobMap[o.natureOfBusiness || 'Unknown']   = (nobMap[o.natureOfBusiness || 'Unknown']   || 0) + 1
        vertOppMap[o.vertical || 'Unknown']       = (vertOppMap[o.vertical || 'Unknown'] || 0) + 1
        ownerMap[o.leadOwner || 'Unknown']        = (ownerMap[o.leadOwner || 'Unknown'] || 0) + (o.expectedMonthlyRevenue || 0)
      })
      const totalVol = filtered.reduce((s, o) => s + (o.expectedMonthlyVolume || 0), 0)
      const totalRev = filtered.reduce((s, o) => s + (o.expectedMonthlyRevenue || 0), 0)
      const won      = filtered.filter(o => ['Won','Onboarded','Activated'].includes(o.stage)).length
      const lost     = filtered.filter(o => o.stage === 'Lost').length

      const stageRevData = OPPORTUNITY_STAGES.map(s => ({
        stage: s,
        revenue: filtered.filter(o => o.stage === s).reduce((a, o) => a + (o.expectedMonthlyRevenue || 0), 0),
        count: filtered.filter(o => o.stage === s).length
      })).filter(d => d.count > 0)

      setPreview({
        type: reportType, count: filtered.length,
        summary: [
          { label: 'Total Opportunities', value: filtered.length,         raw: filtered.length },
          { label: 'Total Monthly Volume', value: formatCurrency(totalVol), raw: totalVol },
          { label: 'Total Monthly TC',value: formatCurrency(totalRev), raw: totalRev },
          { label: 'Won + Active',          value: won,                    raw: won   },
          { label: 'Lost',                  value: lost,                   raw: lost  },
        ],
        charts: [
          { title: 'Stage Distribution',   data: Object.entries(stageMap).map(([name, value]) => ({ name, value })) },
          { title: 'TC by Stage',     data: stageRevData.map(d => ({ name: d.stage, revenue: d.revenue, count: d.count })) },
          { title: 'Nature of Business',   data: Object.entries(nobMap).map(([name, value]) => ({ name, value })) },
          { title: 'TC by Owner',     data: Object.entries(ownerMap).map(([name, value]) => ({ name, revenue: value })).sort((a, b) => b.revenue - a.revenue) },
        ],
        tableData: filtered.map(o => {
          const row = {}
          OPP_COLS.filter(c => cols.includes(c.key)).forEach(c => {
            let v = o[c.key]
            if (c.key === 'createdAt' || c.key === 'expectedCloseDate') v = formatDate(v)
            else if (c.key === 'expectedMonthlyVolume' || c.key === 'expectedMonthlyRevenue') v = formatCurrency(v)
            else if (c.key === 'competitors') v = Array.isArray(v) ? v.join(', ') : v
            row[c.label] = v || '—'
          })
          return row
        }),
        raw: filtered
      })
    }
    setView('preview')
  }

  function handleGenerate() {
    if (!type || !name.trim()) return alert('Please enter a report name and select a type.')
    generatePreview(type, config)
  }

  function saveReport() {
    const id = editReport?.id || `RPT-${Date.now()}`
    const report = { id, name, type, config, createdAt: new Date().toISOString(), createdBy: currentUser?.name || 'Unknown' }
    const updated = editReport
      ? savedReports.map(r => r.id === id ? report : r)
      : [report, ...savedReports]
    setSavedReports(updated); saveSaved(updated)
    setEditReport(report)
    alert(`Report "${name}" saved successfully.`)
  }

  function handleDownload() {
    if (!previewData) return
    downloadXLS(name, previewData.summary, previewData.tableData, previewData.charts)
  }

  // ── Filter chips helper ──
  function FilterChips({ options, selected, onChange }) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {options.map(opt => {
          const val = typeof opt === 'string' ? opt : opt.value
          const lbl = typeof opt === 'string' ? opt : opt.label
          const active = selected?.includes(val)
          return (
            <button key={val} onClick={() => onChange(val)}
              style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontFamily: 'var(--font)',
                cursor: 'pointer', border: `1px solid ${active ? 'var(--so-blue)' : 'var(--border-color)'}`,
                background: active ? 'var(--so-blue-soft)' : 'transparent',
                color: active ? 'var(--so-blue)' : 'var(--text-tertiary)',
                transition: 'all 0.15s'
              }}>
              {lbl}
            </button>
          )
        })}
      </div>
    )
  }

  // ─────────────────────────────────────────────
  //  RENDER: LIST
  // ─────────────────────────────────────────────
  if (view === 'list') return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>Custom Reporting</h2>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
            Build, save and export tailored reports as Excel
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={startNew}>+ New Report</button>
      </div>

      <div className="page-body">
        {savedReports.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 40 }}>
            <div className="empty-state-icon" style={{ fontSize: 48 }}>📊</div>
            <div className="empty-state-title">No reports yet</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 20 }}>
              Create your first custom report for Leads, Pipeline or Opportunities
            </div>
            <button className="btn btn-primary" onClick={startNew}>+ Create Report</button>
          </div>
        ) : (
          <>
            {/* Quick-create cards */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 12 }}>Quick Create</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {REPORT_TYPES.map(rt => (
                  <button key={rt.id} onClick={() => { selectType(rt.id); setName(`${rt.label} — ${new Date().toLocaleDateString()}`); setView('builder') }}
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '16px 18px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s', fontFamily: 'var(--font)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--so-blue)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 8 }}>{rt.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>{rt.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>{rt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Saved reports */}
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 12 }}>Saved Reports</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {savedReports.map(r => {
                const rt = REPORT_TYPES.find(t => t.id === r.type)
                return (
                  <div key={r.id} className="card so-hover-card" style={{ cursor: 'pointer' }} onClick={() => openReport(r)}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--so-blue-soft)', border: '1px solid rgba(71,150,227,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{rt?.icon}</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{r.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>{rt?.label}</div>
                        </div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); deleteReport(r.id) }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 14, padding: '2px 6px', borderRadius: 6, transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#D93025'; e.currentTarget.style.background = 'rgba(217,48,37,0.08)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = 'none' }}
                      >🗑</button>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-tertiary)', borderTop: '0.5px solid var(--border-color)', paddingTop: 10, marginTop: 6 }}>
                      <span>By {r.createdBy?.split(' ')[0]}</span>
                      <span>{formatDate(r.createdAt)}</span>
                      <span style={{ marginLeft: 'auto', color: 'var(--so-blue)', fontWeight: 600 }}>Open →</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )

  // ─────────────────────────────────────────────
  //  RENDER: BUILDER
  // ─────────────────────────────────────────────
  if (view === 'builder') {
    const colDefs = type === 'leads' ? LEAD_COLS : OPP_COLS
    const selectedCols = config.columns || []

    return (
      <div className="page">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setView('list')}>← Back</button>
            <div>
              <h2 style={{ margin: 0 }}>Build Report</h2>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>Configure filters and columns, then generate a preview</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={handleGenerate} disabled={!type || !name.trim()}>
              ▶ Generate Preview
            </button>
          </div>
        </div>

        <div className="page-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Left: Report info + Type */}
            <div>
              {/* Report name */}
              <div className="card" style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>Report Info</div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label>Report Name <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Q2 Lead Analysis" />
                </div>

                <div>
                  <label>Report Type <span style={{ color: 'var(--red)' }}>*</span></label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                    {REPORT_TYPES.map(rt => (
                      <button key={rt.id} onClick={() => selectType(rt.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                          border: `1.5px solid ${type === rt.id ? 'var(--so-blue)' : 'var(--border-color)'}`,
                          background: type === rt.id ? 'var(--so-blue-soft)' : 'transparent',
                          fontFamily: 'var(--font)', transition: 'all 0.15s'
                        }}>
                        <span style={{ fontSize: 18 }}>{rt.icon}</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 12, color: type === rt.id ? 'var(--so-blue)' : 'var(--text-primary)' }}>{rt.label}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 1 }}>{rt.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Date range */}
              {type && (
                <div className="card">
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>Date Range</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div className="form-group">
                      <label>From</label>
                      <input type="date" value={config.dateFrom || ''} onChange={e => setC('dateFrom', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>To</label>
                      <input type="date" value={config.dateTo || ''} onChange={e => setC('dateTo', e.target.value)} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Filters + Columns */}
            {type && (
              <div>
                {/* Filters */}
                <div className="card" style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 14 }}>Filters <span style={{ fontSize: 10, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(leave empty = all)</span></div>

                  {type === 'leads' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Status</div>
                        <FilterChips options={LEAD_STATUSES} selected={config.status || []} onChange={v => toggleMulti('status', v)} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Priority</div>
                        <FilterChips options={PRIORITIES} selected={config.priority || []} onChange={v => toggleMulti('priority', v)} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Vertical</div>
                        <FilterChips options={VERTICALS} selected={config.vertical || []} onChange={v => toggleMulti('vertical', v)} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Owner</div>
                        <FilterChips options={TEAM_MEMBERS} selected={config.owner || []} onChange={v => toggleMulti('owner', v)} />
                      </div>
                    </div>
                  )}

                  {(type === 'pipeline' || type === 'opportunities') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Stage</div>
                        <FilterChips options={OPPORTUNITY_STAGES} selected={config.stage || []} onChange={v => toggleMulti('stage', v)} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Priority</div>
                        <FilterChips options={PRIORITIES} selected={config.priority || []} onChange={v => toggleMulti('priority', v)} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Vertical</div>
                        <FilterChips options={VERTICALS} selected={config.vertical || []} onChange={v => toggleMulti('vertical', v)} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Owner</div>
                        <FilterChips options={TEAM_MEMBERS} selected={config.owner || []} onChange={v => toggleMulti('owner', v)} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Nature of Business</div>
                        <FilterChips options={NATURE_OF_BUSINESS} selected={config.nob || []} onChange={v => toggleMulti('nob', v)} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Column selector */}
                <div className="card">
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>Columns in Export</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {colDefs.map(c => {
                      const active = selectedCols.includes(c.key)
                      return (
                        <button key={c.key} onClick={() => toggleCol(c.key)}
                          style={{
                            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontFamily: 'var(--font)',
                            cursor: 'pointer', transition: 'all 0.15s',
                            border: `1px solid ${active ? 'var(--so-blue)' : 'var(--border-color)'}`,
                            background: active ? 'var(--so-blue-soft)' : 'transparent',
                            color: active ? 'var(--so-blue)' : 'var(--text-tertiary)'
                          }}>
                          {c.label}
                        </button>
                      )
                    })}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-hint)' }}>{selectedCols.length} columns selected</div>
                </div>
              </div>
            )}
          </div>

          {/* Generate button bottom */}
          {type && name.trim() && (
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={handleGenerate} style={{ padding: '10px 32px', fontSize: 14 }}>
                ▶ Generate Preview
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────
  //  RENDER: PREVIEW
  // ─────────────────────────────────────────────
  if (view === 'preview' && previewData) {
    const rt = REPORT_TYPES.find(t => t.id === type)
    const [chart1, chart2, chart3, chart4] = previewData.charts

    return (
      <div className="page">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setView('builder')}>← Edit</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setView('list')}>⊞ All Reports</button>
            <div>
              <h2 style={{ margin: 0 }}>{name}</h2>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{rt?.label} · {previewData.count} records</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={saveReport}>💾 Save Report</button>
            <button className="btn btn-primary btn-sm" onClick={handleDownload}>⬇ Download XLS</button>
          </div>
        </div>

        <div className="page-body">
          {/* Summary KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
            {previewData.summary.map((s, i) => (
              <SCard key={s.label} label={s.label} value={s.value} accent={BRAND[i % BRAND.length]} />
            ))}
          </div>

          {/* Charts row 1 */}
          <div className="grid-2" style={{ marginBottom: 16 }}>
            {/* Chart 1: Pie/Donut */}
            <CCard title={chart1?.title}>
              {chart1?.data?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={chart1.data} cx="50%" cy="50%" innerRadius={52} outerRadius={88} paddingAngle={3} dataKey="value" stroke="none"
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                        const r = innerRadius + (outerRadius - innerRadius) * 0.5
                        const x = cx + r * Math.cos(-midAngle * Math.PI / 180)
                        const y = cy + r * Math.sin(-midAngle * Math.PI / 180)
                        return <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={800}>{value}</text>
                      }} labelLine={false}>
                      {chart1.data.map((_, i) => <Cell key={i} fill={BRAND[i % BRAND.length]} />)}
                    </Pie>
                    <Tooltip content={<Tip />} />
                    <Legend formatter={v => <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{v}</span>} iconType="circle" iconSize={7} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="empty-state" style={{ padding: '30px 0' }}><div style={{ fontSize: 12 }}>No data.</div></div>}
            </CCard>

            {/* Chart 2: Horizontal bar */}
            <CCard title={chart2?.title}>
              {chart2?.data?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chart2.data} layout="vertical" margin={{ top: 0, right: 50, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rptGrad1" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={SO.blue}/><stop offset="100%" stopColor={SO.purple}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" {...grid} horizontal={false} />
                    <YAxis dataKey="name" type="category" tick={tick} width={110} />
                    <Tooltip content={<Tip />} />
                    <Bar dataKey={Object.keys(chart2.data[0] || {}).find(k => k !== 'name') || 'value'}
                      fill="url(#rptGrad1)" name={chart2.title} radius={[0,6,6,0]}>
                      <LabelList dataKey={Object.keys(chart2.data[0] || {}).find(k => k !== 'name') || 'value'}
                        position="right" style={{ fill: 'var(--text-primary)', fontWeight: 700, fontSize: 11 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="empty-state" style={{ padding: '30px 0' }}><div style={{ fontSize: 12 }}>No data.</div></div>}
            </CCard>
          </div>

          {/* Charts row 2 */}
          <div className="grid-2" style={{ marginBottom: 20 }}>
            {/* Chart 3: vertical bar */}
            <CCard title={chart3?.title}>
              {chart3?.data?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chart3.data} margin={{ top: 20, right: 4, left: 4, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="2 4" {...grid} />
                    <XAxis dataKey="name" tick={{ ...tick, fontSize: 9 }} angle={-30} textAnchor="end" interval={0} />
                    <Tooltip content={<Tip />} />
                    <Bar dataKey={Object.keys(chart3.data[0] || {}).find(k => k !== 'name') || 'value'}
                      radius={[6,6,0,0]} name={chart3.title}>
                      {chart3.data.map((_, i) => <Cell key={i} fill={BRAND[(i + 2) % BRAND.length]} />)}
                      <LabelList dataKey={Object.keys(chart3.data[0] || {}).find(k => k !== 'name') || 'value'}
                        position="top" style={{ fill: 'var(--text-primary)', fontWeight: 700, fontSize: 11 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="empty-state" style={{ padding: '30px 0' }}><div style={{ fontSize: 12 }}>No data.</div></div>}
            </CCard>

            {/* Chart 4: vertical bar */}
            <CCard title={chart4?.title}>
              {chart4?.data?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chart4.data} margin={{ top: 20, right: 4, left: 4, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="2 4" {...grid} />
                    <XAxis dataKey="name" tick={{ ...tick, fontSize: 9 }} angle={-30} textAnchor="end" interval={0} />
                    <Tooltip content={<Tip />} />
                    <Bar dataKey={Object.keys(chart4.data[0] || {}).find(k => k !== 'name') || 'value'}
                      radius={[6,6,0,0]} name={chart4.title}>
                      {chart4.data.map((_, i) => <Cell key={i} fill={BRAND[(i + 3) % BRAND.length]} />)}
                      <LabelList dataKey={Object.keys(chart4.data[0] || {}).find(k => k !== 'name') || 'value'}
                        position="top" style={{ fill: 'var(--text-primary)', fontWeight: 700, fontSize: 11 }}
                        formatter={v => typeof v === 'number' && v > 999 ? formatCurrency(v) : v} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="empty-state" style={{ padding: '30px 0' }}><div style={{ fontSize: 12 }}>No data.</div></div>}
            </CCard>
          </div>

          {/* Data table */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 10, borderBottom: '0.5px solid var(--border-color)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Data Table — {previewData.count} records
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleDownload}>⬇ Download XLS</button>
            </div>
            {previewData.tableData?.length > 0 ? (
              <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}>#</th>
                      {Object.keys(previewData.tableData[0] || {}).map(col => <th key={col}>{col}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.tableData.map((row, i) => (
                      <tr key={i}>
                        <td style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>{i + 1}</td>
                        {Object.values(row).map((v, j) => <td key={j}>{String(v ?? '—')}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <div style={{ fontSize: 12 }}>No records match the current filters.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}
