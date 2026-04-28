import React, { useState } from 'react'
import { useCRM } from '../../store/CRMContext'
import { Drawer } from '../common/Modal'
import { PriorityBadge, StatusBadge } from '../common/Badge'
import ActivityTimeline from '../activities/ActivityTimeline'
import CallLogForm from '../activities/CallLogForm'
import ConvertLeadForm from '../opportunities/ConvertLeadForm'
import { formatDate, formatDateTime, formatCurrency } from '../../utils/helpers'
import { LEAD_STATUSES } from '../../data/constants'

export default function LeadDetail({ lead, onClose, onEdit }) {
  const { state, dispatch } = useCRM()
  const [tab, setTab] = useState('activity')
  const [showLogCall, setShowLogCall] = useState(false)
  const [showConvert, setShowConvert] = useState(false)

  const activities = state.activities.filter(a => a.entityId === lead.id)
  const opp = lead.opportunityId ? state.opportunities.find(o => o.id === lead.opportunityId) : null

  function setStatus(s) {
    dispatch({ type: 'UPDATE_LEAD', payload: { ...lead, status: s } })
  }

  return (
    <>
      <Drawer onClose={onClose} title={lead.contactPerson} subtitle={`${lead.companyName} · ${lead.id}`}>
        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <PriorityBadge priority={lead.priority} />
          <StatusBadge status={lead.status} />
          <div style={{ flex: 1 }} />
          {lead.status !== 'Converted' && lead.status !== 'Lost' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowConvert(true)}>⚡ Convert</button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => setShowLogCall(true)}>+ Log Activity</button>
          <button className="btn btn-ghost btn-sm" onClick={onEdit}>✏ Edit</button>
        </div>

        {/* Key info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {[
            { label: 'Email', value: lead.email, link: `mailto:${lead.email}` },
            { label: 'Phone', value: lead.phone },
            { label: 'Company', value: lead.companyName },
            { label: 'Website', value: lead.website, link: lead.website ? `https://${lead.website}` : null },
            { label: 'City', value: lead.city },
            { label: 'Lead Source', value: lead.leadSource === 'Others' ? lead.leadSourceOther : lead.leadSource },
            { label: 'Vertical', value: lead.vertical },
            { label: 'Nature of Business', value: lead.natureOfBusiness },
            { label: 'Lead Owner', value: lead.leadOwner },
            { label: 'Created', value: formatDateTime(lead.createdAt) },
            { label: 'Created By', value: lead.createdBy },
            { label: 'Last Activity', value: formatDateTime(lead.lastActivityAt) },
          ].map(({ label, value, link }) => (
            <div key={label} style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius)', padding: '8px 10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 3 }}>{label}</div>
              {link
                ? <a href={link} target="_blank" rel="noopener" style={{ fontSize: 12, color: 'var(--so-blue)', textDecoration: 'none' }}>{value || '—'}</a>
                : <div style={{ fontSize: 12, color: value ? 'var(--text-primary)' : 'var(--text-tertiary)', wordBreak: 'break-word', fontWeight: 500 }}>{value || '—'}</div>}
            </div>
          ))}
        </div>

        {/* Linked opportunity */}
        {opp && (
          <div style={{ background: 'var(--so-blue-soft)', border: '1px solid rgba(71,150,227,0.2)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: 'var(--so-blue)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Linked Opportunity</div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: 'var(--text-primary)' }}>{opp.opportunityName}</div>
            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
              <span>Stage: <strong>{opp.stage}</strong></span>
              <span>MRR: <strong style={{ color: 'var(--so-blue)' }}>{formatCurrency(opp.expectedMonthlyRevenue)}</strong></span>
              <span>Close: {formatDate(opp.expectedCloseDate)}</span>
            </div>
          </div>
        )}

        {/* Status control — shows 'Lost' instead of 'Dead' */}
        <div style={{ marginBottom: 14 }}>
          <label>Update Status</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
            {LEAD_STATUSES.filter(s => s !== 'Converted').map(s => (
              <button key={s}
                className={`btn btn-sm ${lead.status === s ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setStatus(s)}
                disabled={lead.status === 'Converted'}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        {lead.notes && (
          <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', padding: '10px 12px', marginBottom: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Notes</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{lead.notes}</div>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: 14 }}>
          <button className={`tab ${tab === 'activity' ? 'active' : ''}`} onClick={() => setTab('activity')}>
            Activity ({activities.length})
          </button>
          <button className={`tab ${tab === 'audit' ? 'active' : ''}`} onClick={() => setTab('audit')}>
            Audit Trail
          </button>
        </div>

        {tab === 'activity' && <ActivityTimeline activities={state.activities} entityId={lead.id} />}
        {tab === 'audit' && (
          <div>
            {state.auditLog.filter(a => a.entityId === lead.id).length === 0
              ? <div style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>No audit entries.</div>
              : state.auditLog.filter(a => a.entityId === lead.id).map((entry, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '0.5px solid var(--border-color)', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', flexShrink: 0 }}>{formatDateTime(entry.at)}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--so-blue)' }}>{entry.action}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>by {entry.user}</span>
                  </div>
                ))
            }
          </div>
        )}
      </Drawer>

      {/* These render at z-index 1100 (modal-overlay), above the drawer at 1001 */}
      {showLogCall && <CallLogForm entityType="lead" entityId={lead.id} onClose={() => setShowLogCall(false)} />}
      {showConvert && <ConvertLeadForm lead={lead} onClose={() => setShowConvert(false)} />}
    </>
  )
}
