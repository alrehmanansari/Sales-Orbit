import React, { useState, useMemo } from 'react'
import { useCRM } from '../store/CRMContext'
import { PriorityBadge, StatusBadge } from '../components/common/Badge'
import LeadForm from '../components/leads/LeadForm'
import LeadDetail from '../components/leads/LeadDetail'
import BulkImport from '../components/leads/BulkImport'
import { formatDate, searchFilter, exportToCSV, isOverdue, daysDiff } from '../utils/helpers'
import { LEAD_STATUSES, VERTICALS, PRIORITIES, TEAM_MEMBERS } from '../data/constants'

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Company A–Z', value: 'company' },
  { label: 'Priority (Hot first)', value: 'priority' },
]
const PRIORITY_ORDER = { Hot: 0, Warm: 1, Cold: 2 }

export default function LeadsPage() {
  const { state, dispatch } = useCRM()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterOwner, setFilterOwner] = useState('')
  const [filterVertical, setFilterVertical] = useState('')
  const [sort, setSort] = useState('newest')
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [selectedLead, setSelectedLead] = useState(null)
  const [editLead, setEditLead] = useState(null)

  const filtered = useMemo(() => {
    let arr = state.leads.filter(l => {
      if (filterStatus && l.status !== filterStatus) return false
      if (filterPriority && l.priority !== filterPriority) return false
      if (filterOwner && l.leadOwner !== filterOwner) return false
      if (filterVertical && l.vertical !== filterVertical) return false
      if (search && !searchFilter(l, search)) return false
      return true
    })
    switch (sort) {
      case 'oldest': arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break
      case 'company': arr.sort((a, b) => a.companyName.localeCompare(b.companyName)); break
      case 'priority': arr.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3)); break
      default: arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }
    return arr
  }, [state.leads, search, filterStatus, filterPriority, filterOwner, filterVertical, sort])

  const overdueCount = state.activities.filter(a => a.nextFollowUpDate && isOverdue(a.nextFollowUpDate)).length

  function doExport() {
    exportToCSV(filtered.map((l, i) => ({
      '#': i + 1, 'Company': l.companyName, 'Contact Person': l.contactPerson,
      'Email': l.email, 'Phone': l.phone, 'City': l.city,
      'Lead Source': l.leadSource, 'Vertical': l.vertical,
      'Nature of Business': l.natureOfBusiness, 'Priority': l.priority,
      'Status': l.status, 'Lead Owner': l.leadOwner,
      'Created': l.createdAt, 'Notes': l.notes
    })), 'leads-export')
  }

  function deleteLead(id) {
    if (confirm('Delete this lead? This cannot be undone.')) dispatch({ type: 'DELETE_LEAD', id })
  }

  const agingColor = days => days > 60 ? 'var(--red)' : days > 30 ? 'var(--orange)' : 'var(--green)'

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>All Leads</h2>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
            {state.leads.length} total · {state.leads.filter(l => l.status === 'New').length} new
            {overdueCount > 0 && <span style={{ color: 'var(--red)', marginLeft: 8 }}>· {overdueCount} overdue follow-ups</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={doExport}>⬇ Export CSV</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowImport(true)}>⬆ Bulk Import</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Add Lead</button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 300 }}>
          <span className="search-icon">⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads…" style={{ borderRadius: 24 }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterVertical} onChange={e => setFilterVertical(e.target.value)}>
          <option value="">All Verticals</option>
          {VERTICALS.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={filterOwner} onChange={e => setFilterOwner(e.target.value)}>
          <option value="">All Owners</option>
          {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {(search || filterStatus || filterPriority || filterOwner || filterVertical) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterStatus(''); setFilterPriority(''); setFilterOwner(''); setFilterVertical('') }}>✕ Clear</button>
        )}
      </div>

      <div className="page-body" style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">No leads found</div>
            <div style={{ fontSize: 12 }}>Try adjusting filters or add a new lead.</div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => setShowForm(true)}>+ Add Lead</button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th>Age</th>
                  <th>Priority</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead, idx) => {
                  const age = daysDiff(lead.createdAt)
                  const hasOverdue = state.activities.some(a => a.entityId === lead.id && a.nextFollowUpDate && isOverdue(a.nextFollowUpDate))
                  return (
                    <tr key={lead.id} onClick={() => setSelectedLead(lead)}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'center' }}>
                          {hasOverdue && <span className="notif-dot pulse" style={{ flexShrink: 0 }} />}
                          {idx + 1}
                        </div>
                      </td>
                      <td style={{ fontSize: 12, fontWeight: 600 }}>{lead.companyName}</td>
                      <td style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)' }}>{lead.contactPerson}</td>
                      <td style={{ fontSize: 11, color: 'var(--so-blue)', fontWeight: 400 }}>{lead.email}</td>
                      <td onClick={e => e.stopPropagation()}>
                        {lead.phone ? (
                          <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#25D366', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, textDecoration: 'none', padding: '2px 6px', borderRadius: 6, transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,211,102,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            title="Open WhatsApp">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.562 4.14 1.542 5.876L.057 23.428a.5.5 0 0 0 .607.607l5.694-1.476A11.938 11.938 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.938 9.938 0 0 1-5.354-1.562l-.38-.228-3.975 1.03 1.055-3.86-.248-.396A9.938 9.938 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                            {lead.phone}
                          </a>
                        ) : <span style={{ color: 'var(--text-hint)' }}>—</span>}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 400 }}>{lead.leadSource}</td>
                      <td><StatusBadge status={lead.status} /></td>
                      <td style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-secondary)' }}>{lead.leadOwner?.split(' ')[0]}</td>
                      <td style={{ fontSize: 11, fontWeight: 600, color: agingColor(age), fontFamily: 'var(--font-mono)' }}>{age}d</td>
                      <td><PriorityBadge priority={lead.priority} /></td>
                      <td style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontWeight: 400 }}>{formatDate(lead.createdAt)}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <button
                            title="Edit lead" onClick={() => setEditLead(lead)}
                            style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font)', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--so-blue-soft)'; e.currentTarget.style.color = 'var(--so-blue)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)' }}
                          >✏</button>
                          <button
                            title="Delete lead" onClick={() => deleteLead(lead.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font)', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,48,37,0.08)'; e.currentTarget.style.color = '#D93025' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)' }}
                          >🗑</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ padding: '10px 24px', borderTop: '0.5px solid var(--border-color)', fontSize: 12, color: 'var(--text-tertiary)', background: 'var(--bg-secondary)' }}>
          Showing {filtered.length} of {state.leads.length} leads
        </div>
      </div>

      {showForm && <LeadForm onClose={() => setShowForm(false)} />}
      {editLead && <LeadForm editLead={editLead} onClose={() => setEditLead(null)} />}
      {showImport && <BulkImport onClose={() => setShowImport(false)} />}
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
