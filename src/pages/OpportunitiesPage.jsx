import React, { useState, useMemo } from 'react'
import { useCRM } from '../store/CRMContext'
import { StageBadge, PriorityBadge } from '../components/common/Badge'
import OpportunityForm from '../components/opportunities/OpportunityForm'
import OpportunityDetail from '../components/opportunities/OpportunityDetail'
import { formatDate, formatCurrency, searchFilter, exportToCSV, daysDiff } from '../utils/helpers'
import { OPPORTUNITY_STAGES, NATURE_OF_BUSINESS, TEAM_MEMBERS } from '../data/constants'

export default function OpportunitiesPage() {
  const { state, dispatch } = useCRM()
  const [search, setSearch] = useState('')
  const [filterStage, setFilterStage] = useState('')
  const [filterNOB, setFilterNOB] = useState('')
  const [filterOwner, setFilterOwner] = useState('')
  const [sort, setSort] = useState('newest')
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [editOpp, setEditOpp] = useState(null)

  const filtered = useMemo(() => {
    let arr = state.opportunities.filter(o => {
      if (filterStage && o.stage !== filterStage) return false
      if (filterNOB && o.natureOfBusiness !== filterNOB) return false
      if (filterOwner && o.leadOwner !== filterOwner) return false
      if (search && !searchFilter(o, search)) return false
      return true
    })
    switch (sort) {
      case 'oldest': arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break
      case 'revenue_desc': arr.sort((a, b) => b.expectedMonthlyRevenue - a.expectedMonthlyRevenue); break
      case 'company': arr.sort((a, b) => a.companyName.localeCompare(b.companyName)); break
      default: arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }
    return arr
  }, [state.opportunities, search, filterStage, filterNOB, filterOwner, sort])

  const totalRevenue = filtered.reduce((s, o) => s + (o.expectedMonthlyRevenue || 0), 0)
  const totalVolume = filtered.reduce((s, o) => s + (o.expectedMonthlyVolume || 0), 0)
  const activeCount = filtered.filter(o => !['Lost', 'On Hold'].includes(o.stage)).length

  function doExport() {
    exportToCSV(filtered.map((o, i) => ({
      '#': i + 1, 'Company': o.companyName, 'Vertical': o.vertical,
      'Contact': o.contactPerson, 'Email': o.email,
      'Stage': o.stage, 'Monthly Volume': o.expectedMonthlyVolume,
      'Monthly Revenue': o.expectedMonthlyRevenue, 'Priority': o.priority,
      'Close Date': o.expectedCloseDate, 'Owner': o.leadOwner,
      'Nature of Business': o.natureOfBusiness, 'Competitors': o.competitors?.join(', '),
      'Created': o.createdAt
    })), 'opportunities-export')
  }

  function deleteOpp(id) {
    if (confirm('Delete this opportunity?')) dispatch({ type: 'DELETE_OPPORTUNITY', id })
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>All Opportunities</h2>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
            {activeCount} active &nbsp;·&nbsp;
            <span style={{ color: 'var(--so-blue)', fontWeight: 600 }}>{formatCurrency(totalVolume)}/mo volume</span>
            &nbsp;·&nbsp;
            <span style={{ color: 'var(--green)', fontWeight: 600 }}>{formatCurrency(totalRevenue)}/mo revenue</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={doExport}>⬇ Export CSV</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ New Opportunity</button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 280 }}>
          <span className="search-icon">⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search opportunities…" style={{ borderRadius: 24 }} />
        </div>
        <select value={filterStage} onChange={e => setFilterStage(e.target.value)}>
          <option value="">All Stages</option>
          {OPPORTUNITY_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterNOB} onChange={e => setFilterNOB(e.target.value)}>
          <option value="">All Business Types</option>
          {NATURE_OF_BUSINESS.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={filterOwner} onChange={e => setFilterOwner(e.target.value)}>
          <option value="">All Owners</option>
          {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="revenue_desc">Highest Revenue</option>
          <option value="company">Company A–Z</option>
        </select>
        {(search || filterStage || filterNOB || filterOwner) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterStage(''); setFilterNOB(''); setFilterOwner('') }}>✕ Clear</button>
        )}
      </div>

      {/* Stage summary pills */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 24px', background: 'var(--bg-secondary)', borderBottom: '0.5px solid var(--border-color)', overflowX: 'auto' }}>
        {OPPORTUNITY_STAGES.map(stage => {
          const count = state.opportunities.filter(o => o.stage === stage).length
          const vol = state.opportunities.filter(o => o.stage === stage).reduce((s, o) => s + (o.expectedMonthlyVolume || 0), 0)
          const rev = state.opportunities.filter(o => o.stage === stage).reduce((s, o) => s + (o.expectedMonthlyRevenue || 0), 0)
          return (
            <button key={stage}
              onClick={() => setFilterStage(filterStage === stage ? '' : stage)}
              style={{
                background: filterStage === stage ? 'var(--so-blue-soft)' : 'var(--bg-card)',
                border: `1px solid ${filterStage === stage ? 'var(--so-blue)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius)', padding: '6px 12px', cursor: 'pointer',
                flexShrink: 0, textAlign: 'left'
              }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: filterStage === stage ? 'var(--so-blue)' : 'var(--text-primary)' }}>{count}</div>
              <div style={{ fontSize: 9, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stage}</div>
              <div style={{ fontSize: 10, color: 'var(--green)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{formatCurrency(rev)}</div>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="page-body" style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💼</div>
            <div className="empty-state-title">No opportunities found</div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => setShowForm(true)}>+ New Opportunity</button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>#</th>
                  <th>Opportunity</th>
                  <th>Phone</th>
                  <th>Stage</th>
                  <th>Monthly Vol.</th>
                  <th>Monthly Rev.</th>
                  <th>Priority</th>
                  <th>Close Date</th>
                  <th>Owner</th>
                  <th>Nature of Business</th>
                  <th>Age</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((opp, idx) => {
                  const age = daysDiff(opp.createdAt)
                  const isLate = opp.expectedCloseDate && new Date(opp.expectedCloseDate) < new Date() && !['Lost', 'Activated'].includes(opp.stage)
                  return (
                    <tr key={opp.id} onClick={() => setSelected(opp)}>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textAlign: 'center' }}>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 700 }}>
                          {opp.companyName}
                          {opp.clientId && (
                            <span style={{ fontWeight: 400, color: 'var(--text-tertiary)', fontSize: 11, marginLeft: 6 }}>— {opp.clientId}</span>
                          )}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 400, marginTop: 1 }}>{opp.vertical}</div>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        {opp.phone ? (
                          <a href={`https://wa.me/${opp.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#25D366', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, textDecoration: 'none', padding: '2px 6px', borderRadius: 6, transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,211,102,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            title="Open WhatsApp">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.562 4.14 1.542 5.876L.057 23.428a.5.5 0 0 0 .607.607l5.694-1.476A11.938 11.938 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.938 9.938 0 0 1-5.354-1.562l-.38-.228-3.975 1.03 1.055-3.86-.248-.396A9.938 9.938 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                            {opp.phone}
                          </a>
                        ) : <span style={{ color: 'var(--text-hint)' }}>—</span>}
                      </td>
                      <td><StageBadge stage={opp.stage} /></td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontWeight: 400 }}>{formatCurrency(opp.expectedMonthlyVolume)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--green)', fontWeight: 700 }}>{formatCurrency(opp.expectedMonthlyRevenue)}</td>
                      <td><PriorityBadge priority={opp.priority} /></td>
                      <td style={{ color: isLate ? 'var(--red)' : 'var(--text-secondary)', fontWeight: 400 }}>
                        {isLate && '⚠ '}{formatDate(opp.expectedCloseDate)}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>{opp.leadOwner?.split(' ')[0]}</td>
                      <td style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>{opp.natureOfBusiness}</td>
                      <td style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontWeight: 400 }}>{age}d</td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            onClick={() => setEditOpp(opp)}
                            style={{ padding: '3px 8px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 11, transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--so-blue-soft)'; e.currentTarget.style.color = 'var(--so-blue)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)' }}
                          >✏</button>
                          <button
                            onClick={() => deleteOpp(opp.id)}
                            style={{ padding: '3px 8px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 11, transition: 'all 0.15s' }}
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

        {/* Footer with separate volume + revenue totals */}
        <div style={{ padding: '10px 24px', borderTop: '0.5px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> of {state.opportunities.length} opportunities
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            Total Monthly Volume: <strong style={{ color: 'var(--so-blue)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(totalVolume)}</strong>
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            Total Monthly Revenue: <strong style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(totalRevenue)}</strong>
          </span>
        </div>
      </div>

      {showForm && <OpportunityForm onClose={() => setShowForm(false)} />}
      {editOpp && <OpportunityForm editOpp={editOpp} onClose={() => setEditOpp(null)} />}
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
