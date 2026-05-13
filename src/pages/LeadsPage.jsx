import React, { useState, useMemo, useEffect } from 'react'
import { useCRM } from '../store/CRMContext'
import { useAuth } from '../store/AuthContext'
import { PriorityBadge, StatusBadge } from '../components/common/Badge'
import LeadForm from '../components/leads/LeadForm'
import LeadDetail from '../components/leads/LeadDetail'
import BulkImport from '../components/leads/BulkImport'
import { formatDate, searchFilter, exportToCSV, isOverdue, daysDiff, filterByDateRange, parseISODate } from '../utils/helpers'
import { LEAD_STATUSES, VERTICALS, PRIORITIES, TIME_FILTERS } from '../data/constants'

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Company A–Z', value: 'company' },
  { label: 'Priority (Hot first)', value: 'priority' },
]
const PRIORITY_ORDER = { Hot: 0, Warm: 1, Cold: 2 }
const DELETE_DESIGNATIONS = ['Head of Sales', 'Head of MENA', 'Country Manager']

/* Uniform pill-select style — active state turns blue */
function PillSelect({ value, onChange, children, maxWidth }) {
  const active = !!value
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        fontSize: 11, padding: '4px 22px 4px 10px', borderRadius: 20,
        border: `1.5px solid ${active ? 'var(--so-blue)' : 'var(--border-color)'}`,
        background: active ? 'var(--so-blue-soft)' : 'var(--bg-card)',
        color: active ? 'var(--so-blue)' : 'var(--text-secondary)',
        fontFamily: 'var(--font)', fontWeight: active ? 600 : 400,
        outline: 'none', cursor: 'pointer',
        appearance: 'none', WebkitAppearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='5' viewBox='0 0 9 5'%3E%3Cpath d='M1 1l3.5 3L8 1' stroke='%239AA0A6' fill='none' stroke-width='1.4' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
        flexShrink: 0, maxWidth: maxWidth || 130, whiteSpace: 'nowrap',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      {children}
    </select>
  )
}

/* Truncating table cell wrapper */
function Clip({ children, maxW = 140, style }) {
  return (
    <div style={{ maxWidth: maxW, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...style }}>
      {children}
    </div>
  )
}

export default function LeadsPage({ openLeadId, onOpenClear }) {
  const { state, dispatch } = useCRM()
  const { currentUser } = useAuth()
  const canDelete = DELETE_DESIGNATIONS.includes(currentUser?.designation)

  const [search, setSearch]           = useState('')
  const [filterStatus, setFilterStatus]   = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterOwner, setFilterOwner]   = useState(() => {
    const MGRS = ['Head of Sales', 'Country Manager', 'Head of MENA']
    const isMgr = MGRS.includes(currentUser?.designation) || currentUser?.role === 'Manager'
    return isMgr ? '' : (currentUser?.name || '')
  })
  const [filterVertical, setFilterVertical] = useState('')
  const [sort, setSort]               = useState('newest')
  const [timeFilter, setTimeFilter]   = useState('all')
  const [customFrom, setCustomFrom]   = useState('')
  const [customTo, setCustomTo]       = useState('')
  const [showForm, setShowForm]       = useState(false)
  const [showImport, setShowImport]   = useState(false)
  const [selectedLead, setSelectedLead] = useState(null)
  const [editLead, setEditLead]       = useState(null)

  const filtered = useMemo(() => {
    let base = state.leads
    if (timeFilter && timeFilter !== 'all') {
      if (timeFilter === 'custom') {
        base = base.filter(l => {
          const d = parseISODate(l.createdAt)
          if (!d) return false
          if (customFrom && d < new Date(customFrom)) return false
          if (customTo   && d > new Date(customTo + 'T23:59:59')) return false
          return true
        })
      } else {
        base = filterByDateRange(base, 'createdAt', timeFilter)
      }
    }
    let arr = base.filter(l => {
      if (filterStatus   && l.status    !== filterStatus)   return false
      if (filterPriority && l.priority  !== filterPriority) return false
      if (filterOwner    && l.leadOwner !== filterOwner)    return false
      if (filterVertical && l.vertical  !== filterVertical) return false
      if (search         && !searchFilter(l, search))       return false
      return true
    })
    switch (sort) {
      case 'oldest':   arr.sort((a,b) => new Date(a.createdAt)-new Date(b.createdAt)); break
      case 'company':  arr.sort((a,b) => a.companyName.localeCompare(b.companyName)); break
      case 'priority': arr.sort((a,b) => (PRIORITY_ORDER[a.priority]??3)-(PRIORITY_ORDER[b.priority]??3)); break
      default:         arr.sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt))
    }
    return arr
  }, [state.leads, search, filterStatus, filterPriority, filterOwner, filterVertical, sort, timeFilter, customFrom, customTo])

  const overdueCount = state.activities.filter(a => a.nextFollowUpDate && isOverdue(a.nextFollowUpDate)).length
  const anyFilter = search || filterStatus || filterPriority || filterOwner || filterVertical || (timeFilter && timeFilter !== 'all')

  useEffect(() => {
    if (openLeadId && state.leads.length) {
      const lead = state.leads.find(l => l.id === openLeadId)
      if (lead) setSelectedLead(lead)
      onOpenClear?.()
    }
  }, [openLeadId, state.leads])

  function clearAll() {
    setSearch(''); setFilterStatus(''); setFilterPriority('')
    setFilterOwner(''); setFilterVertical(''); setTimeFilter('all')
    setCustomFrom(''); setCustomTo('')
  }

  function doExport() {
    exportToCSV(filtered.map((l,i) => ({
      '#': i+1, 'Company': l.companyName, 'Contact Person': l.contactPerson,
      'Email': l.email, 'Phone': l.phone, 'City': l.city,
      'Lead Source': l.leadSource, 'Vertical': l.vertical,
      'Nature of Business': l.natureOfBusiness, 'Priority': l.priority,
      'Status': l.status, 'Lead Owner': l.leadOwner,
      'Created': l.createdAt, 'Notes': l.notes,
    })), 'leads-export')
  }

  function deleteLead(id) {
    if (confirm('Delete this lead? This cannot be undone.')) dispatch({ type: 'DELETE_LEAD', id })
  }

  const agingColor = days => days > 60 ? 'var(--red)' : days > 30 ? 'var(--orange)' : 'var(--so-blue)'

  const ownerOptions = useMemo(() =>
    [...new Set(state.leads.map(l => l.leadOwner).filter(Boolean))].sort()
  , [state.leads])

  return (
    <div className="page">

      {/* ── Page header: title left · actions right ── */}
      <div className="page-header" style={{ flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ margin: 0 }}>All Leads</h2>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
            {filtered.length} showing · {state.leads.length} total
            {overdueCount > 0 && <span style={{ color: 'var(--red)', marginLeft: 8 }}>· {overdueCount} overdue</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div className="search-wrap" style={{ minWidth: 160, maxWidth: 240 }}>
            <span className="search-icon">⌕</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search leads…" style={{ borderRadius: 24 }} />
          </div>
          <button className="btn btn-ghost btn-sm" onClick={doExport}>⬇ Export</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowImport(true)}>⬆ Import</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Add Lead</button>
        </div>
      </div>

      {/* ── Filter bar: date pill · select filters · sort · clear ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px',
        background: 'var(--bg-secondary)', borderBottom: '0.5px solid var(--border-color)',
        overflowX: 'auto', flexShrink: 0, WebkitOverflowScrolling: 'touch',
        flexWrap: 'nowrap',
      }}>
        {/* Date pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 24, padding: '3px 4px', flexShrink: 0 }}>
          <button className={`tab ${timeFilter==='all'?'active':''}`}
            style={{ padding: '3px 9px', fontSize: 11, whiteSpace: 'nowrap' }}
            onClick={() => setTimeFilter('all')}>All</button>
          {TIME_FILTERS.filter(f => f.value !== 'custom').map(f => (
            <button key={f.value} className={`tab ${timeFilter===f.value?'active':''}`}
              style={{ padding: '3px 9px', fontSize: 11, whiteSpace: 'nowrap' }}
              onClick={() => setTimeFilter(f.value)}>{f.label}</button>
          ))}
          <button className={`tab ${timeFilter==='custom'?'active':''}`}
            style={{ padding: '3px 9px', fontSize: 11, whiteSpace: 'nowrap' }}
            onClick={() => setTimeFilter('custom')}>Custom</button>
        </div>

        {/* Custom date inputs */}
        {timeFilter === 'custom' && (
          <>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              style={{ fontSize: 11, padding: '4px 7px', borderRadius: 8, border: '1px solid var(--border-strong-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontFamily: 'var(--font)', outline: 'none', flexShrink: 0 }} />
            <span style={{ color: 'var(--text-tertiary)', fontSize: 11, flexShrink: 0 }}>→</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              style={{ fontSize: 11, padding: '4px 7px', borderRadius: 8, border: '1px solid var(--border-strong-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontFamily: 'var(--font)', outline: 'none', flexShrink: 0 }} />
          </>
        )}

        {/* Thin divider */}
        <div style={{ width: 1, height: 16, background: 'var(--border-strong-color)', opacity: 0.4, flexShrink: 0, margin: '0 2px' }} />

        {/* Filter selects as uniform pills */}
        <PillSelect value={filterStatus} onChange={setFilterStatus} maxWidth={120}>
          <option value="">All Statuses</option>
          {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </PillSelect>

        <PillSelect value={filterPriority} onChange={setFilterPriority} maxWidth={120}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </PillSelect>

        <PillSelect value={filterVertical} onChange={setFilterVertical} maxWidth={120}>
          <option value="">All Verticals</option>
          {VERTICALS.map(v => <option key={v} value={v}>{v}</option>)}
        </PillSelect>

        <PillSelect value={filterOwner} onChange={setFilterOwner} maxWidth={120}>
          <option value="">All Owners</option>
          {ownerOptions.map(m => <option key={m} value={m}>{m}</option>)}
        </PillSelect>

        {/* Thin divider */}
        <div style={{ width: 1, height: 16, background: 'var(--border-strong-color)', opacity: 0.4, flexShrink: 0, margin: '0 2px' }} />

        {/* Sort */}
        <PillSelect value={sort} onChange={setSort} maxWidth={140}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </PillSelect>

        {/* Clear */}
        {anyFilter && (
          <button onClick={clearAll}
            style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border: '1.5px solid var(--red)', background: 'transparent', color: 'var(--red)', fontFamily: 'var(--font)', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,48,37,0.07)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="page-body" style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">No leads found</div>
            <div style={{ fontSize: 12 }}>Try adjusting filters or add a new lead.</div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => setShowForm(true)}>+ Add Lead</button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="data-table" style={{ fontSize: 11 }}>
              <colgroup>
                <col style={{ width: 40 }} />   {/* # */}
                <col style={{ width: 150 }} />  {/* Company */}
                <col style={{ width: 120 }} />  {/* Contact */}
                <col style={{ width: 160 }} />  {/* Email */}
                <col style={{ width: 130 }} />  {/* Phone */}
                <col style={{ width: 100 }} />  {/* Source */}
                <col style={{ width: 100 }} />  {/* Vertical */}
                <col style={{ width: 140 }} />  {/* Nature of Business */}
                <col style={{ width: 90 }} />   {/* Status */}
                <col style={{ width: 80 }} />   {/* Owner */}
                <col style={{ width: 52 }} />   {/* Age */}
                <col style={{ width: 72 }} />   {/* Priority */}
                <col style={{ width: 84 }} />   {/* Created */}
                <col style={{ width: 62 }} />   {/* Action */}
              </colgroup>
              <thead>
                <tr>
                  <th style={{ padding: '6px 8px', textAlign: 'center' }}>#</th>
                  <th style={{ padding: '6px 10px' }}>Company</th>
                  <th style={{ padding: '6px 10px' }}>Contact</th>
                  <th style={{ padding: '6px 10px' }}>Email</th>
                  <th style={{ padding: '6px 10px' }}>Phone</th>
                  <th style={{ padding: '6px 10px' }}>Source</th>
                  <th style={{ padding: '6px 10px' }}>Vertical</th>
                  <th style={{ padding: '6px 10px' }}>Nature of Business</th>
                  <th style={{ padding: '6px 10px' }}>Status</th>
                  <th style={{ padding: '6px 10px' }}>Owner</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center' }}>Age</th>
                  <th style={{ padding: '6px 10px' }}>Priority</th>
                  <th style={{ padding: '6px 10px' }}>Created</th>
                  <th style={{ padding: '6px 8px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead, idx) => {
                  const age = daysDiff(lead.createdAt)
                  const hasOverdue = state.activities.some(a => a.entityId===lead.id && a.nextFollowUpDate && isOverdue(a.nextFollowUpDate))
                  return (
                    <tr key={lead.id} onClick={() => setSelectedLead(lead)}
                      style={{ cursor: 'pointer' }}>

                      {/* # */}
                      <td style={{ padding: '5px 8px', textAlign: 'center', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
                          {hasOverdue && <span className="notif-dot pulse" style={{ flexShrink: 0 }} />}
                          {idx + 1}
                        </div>
                      </td>

                      {/* Company */}
                      <td style={{ padding: '5px 10px', fontWeight: 600, fontSize: 12 }}>
                        <Clip maxW={146}>{lead.companyName}</Clip>
                      </td>

                      {/* Contact */}
                      <td style={{ padding: '5px 10px', color: 'var(--text-secondary)' }}>
                        <Clip maxW={116}>{lead.contactPerson}</Clip>
                      </td>

                      {/* Email */}
                      <td style={{ padding: '5px 10px', color: 'var(--so-blue)' }}>
                        <Clip maxW={156}>{lead.email || '—'}</Clip>
                      </td>

                      {/* Phone */}
                      <td style={{ padding: '5px 10px' }} onClick={e => e.stopPropagation()}>
                        {lead.phone ? (
                          <a href={`https://wa.me/${lead.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#25D366', fontFamily: 'var(--font-mono)', fontSize: 10, textDecoration: 'none', padding: '2px 5px', borderRadius: 5, transition: 'background 0.15s', whiteSpace: 'nowrap' }}
                            onMouseEnter={e => e.currentTarget.style.background='rgba(37,211,102,0.10)'}
                            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.562 4.14 1.542 5.876L.057 23.428a.5.5 0 0 0 .607.607l5.694-1.476A11.938 11.938 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.938 9.938 0 0 1-5.354-1.562l-.38-.228-3.975 1.03 1.055-3.86-.248-.396A9.938 9.938 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                            {lead.phone}
                          </a>
                        ) : <span style={{ color: 'var(--text-hint)' }}>—</span>}
                      </td>

                      {/* Source */}
                      <td style={{ padding: '5px 10px', color: 'var(--text-tertiary)' }}>
                        <Clip maxW={96}>{lead.leadSource || '—'}</Clip>
                      </td>

                      {/* Vertical */}
                      <td style={{ padding: '5px 10px', color: 'var(--text-tertiary)' }}>
                        <Clip maxW={96}>{lead.vertical || '—'}</Clip>
                      </td>

                      {/* Nature of Business */}
                      <td style={{ padding: '5px 10px', color: 'var(--text-tertiary)' }}>
                        <Clip maxW={136}>{lead.natureOfBusiness || '—'}</Clip>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '5px 10px' }}>
                        <StatusBadge status={lead.status} />
                      </td>

                      {/* Owner */}
                      <td style={{ padding: '5px 10px', color: 'var(--text-secondary)' }}>
                        <Clip maxW={76}>{lead.leadOwner?.split(' ')[0] || '—'}</Clip>
                      </td>

                      {/* Age */}
                      <td style={{ padding: '5px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: agingColor(age) }}>
                        {age}d
                      </td>

                      {/* Priority */}
                      <td style={{ padding: '5px 10px' }}>
                        <PriorityBadge priority={lead.priority} />
                      </td>

                      {/* Created */}
                      <td style={{ padding: '5px 10px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)' }}>
                        {formatDate(lead.createdAt)}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '5px 6px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <button title="Edit lead" onClick={() => setEditLead(lead)}
                            style={{ padding: '3px 6px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 12, transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background='var(--so-blue-soft)'; e.currentTarget.style.color='var(--so-blue)' }}
                            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-tertiary)' }}>✏</button>
                          {canDelete && (
                            <button title="Delete lead" onClick={() => deleteLead(lead.id)}
                              style={{ padding: '3px 6px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 12, transition: 'all 0.15s' }}
                              onMouseEnter={e => { e.currentTarget.style.background='rgba(217,48,37,0.08)'; e.currentTarget.style.color='#D93025' }}
                              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-tertiary)' }}>🗑</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ padding: '8px 20px', borderTop: '0.5px solid var(--border-color)', fontSize: 11, color: 'var(--text-tertiary)', background: 'var(--bg-secondary)' }}>
          Showing {filtered.length} of {state.leads.length} leads
        </div>
      </div>

      {showForm     && <LeadForm onClose={() => setShowForm(false)} />}
      {editLead     && <LeadForm editLead={editLead} onClose={() => setEditLead(null)} />}
      {showImport   && <BulkImport onClose={() => setShowImport(false)} />}
      {selectedLead && (
        <LeadDetail
          lead={state.leads.find(l => l.id === selectedLead.id) || selectedLead}
          onClose={() => setSelectedLead(null)}
          onEdit={() => { setEditLead(selectedLead); setSelectedLead(null) }}
        />
      )}
    </div>
  )
}
