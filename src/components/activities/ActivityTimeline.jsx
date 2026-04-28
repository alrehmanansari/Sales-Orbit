import React from 'react'
import { formatDateTime, formatDate, isOverdue } from '../../utils/helpers'
import { ACTIVITY_ICONS } from '../../data/constants'
import { OutcomeBadge } from '../common/Badge'

export default function ActivityTimeline({ activities, entityId }) {
  const items = activities
    .filter(a => a.entityId === entityId)
    .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))

  if (!items.length) return (
    <div className="empty-state">
      <div className="empty-state-icon">📋</div>
      <div className="empty-state-title">No activity logged yet</div>
      <div style={{ fontSize: 12 }}>Use "Log Activity" to add calls, emails, notes and more.</div>
    </div>
  )

  const TYPE_COLORS = {
    Call: 'var(--blue)', Email: 'var(--accent)', Meeting: 'var(--green)',
    WhatsApp: 'var(--green)', Note: 'var(--purple)'
  }

  return (
    <div className="timeline">
      {items.map((act, i) => (
        <div key={act.id} className="timeline-item">
          <div className="timeline-icon" style={{ borderColor: TYPE_COLORS[act.type], background: `${TYPE_COLORS[act.type]}22` }}>
            {ACTIVITY_ICONS[act.type]}
          </div>
          <div style={{ flex: 1, marginBottom: 12 }}>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: TYPE_COLORS[act.type] }}>
                    {act.type}{act.callType ? ` · ${act.callType}` : ''}
                  </span>
                  {act.callOutcome && <OutcomeBadge outcome={act.callOutcome} />}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>
                  {formatDateTime(act.dateTime)}
                </div>
              </div>

              {act.notes && (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: act.nextFollowUpDate ? 6 : 0 }}>
                  {act.notes}
                </div>
              )}

              {act.nextFollowUpDate && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6,
                  background: isOverdue(act.nextFollowUpDate) ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                  border: `1px solid ${isOverdue(act.nextFollowUpDate) ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`,
                  borderRadius: 20, padding: '2px 8px', fontSize: 11,
                  color: isOverdue(act.nextFollowUpDate) ? 'var(--red)' : 'var(--blue)'
                }}>
                  {isOverdue(act.nextFollowUpDate) ? '⚠' : '📅'} Follow-up: {formatDate(act.nextFollowUpDate)}
                  {isOverdue(act.nextFollowUpDate) && ' · OVERDUE'}
                </div>
              )}

              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                By {act.loggedBy}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
