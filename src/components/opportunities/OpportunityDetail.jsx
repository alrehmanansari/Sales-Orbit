import React, { useState } from 'react'
import { useCRM } from '../../store/CRMContext'
import { Drawer } from '../common/Modal'
import { StageBadge, PriorityBadge } from '../common/Badge'
import ActivityTimeline from '../activities/ActivityTimeline'
import CallLogForm from '../activities/CallLogForm'
import StageModal from './StageModal'
import { formatDate, formatDateTime, formatCurrency, daysDiff } from '../../utils/helpers'
import { STAGE_COLORS } from '../../data/constants'

export default function OpportunityDetail({ opp, onClose, onEdit }) {
  const { state, dispatch } = useCRM()
  const [tab, setTab] = useState('activity')
  const [showLogCall, setShowLogCall] = useState(false)
  const [showStage, setShowStage] = useState(false)

  const lead = opp.leadId ? state.leads.find(l => l.id === opp.leadId) : null
  const activities = state.activities.filter(a => a.entityId === opp.id || a.entityId === opp.leadId)
  const daysInPipeline = daysDiff(opp.createdAt)

  function moveStage({ newStage, note, lostReason, onHoldReviewDate, clientId, kycAgent }) {
    dispatch({ type: 'MOVE_STAGE', payload: { id: opp.id, newStage, note, lostReason, onHoldReviewDate, clientId, kycAgent } })
  }

  return (
    <>
      <Drawer
        onClose={onClose}
        title={
          opp.clientId
            ? <>{opp.opportunityName} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 13 }}>— {opp.clientId}</span></>
            : opp.opportunityName
        }
        subtitle={opp.id}
      >
        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <StageBadge stage={opp.stage} />
          <PriorityBadge priority={opp.priority} />
          <div style={{ flex: 1 }} />
          <button className="btn btn-secondary btn-sm" onClick={() => setShowStage(true)}>⟳ Move Stage</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowLogCall(true)}>+ Activity</button>
          <button className="btn btn-ghost btn-sm" onClick={onEdit}>✏ Edit</button>
        </div>

        {/* Revenue summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Monthly Volume', value: formatCurrency(opp.expectedMonthlyVolume), color: 'var(--text-primary)' },
            { label: 'Monthly Revenue', value: formatCurrency(opp.expectedMonthlyRevenue), color: 'var(--accent)' },
            { label: 'Days in Pipeline', value: daysInPipeline, color: 'var(--blue)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Stage history */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>Stage Progress</div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            {opp.stageHistory.map((s, i) => (
              <React.Fragment key={i}>
                <div style={{ background: `${STAGE_COLORS[s.stage]}22`, border: `1px solid ${STAGE_COLORS[s.stage]}44`, borderRadius: 'var(--radius)', padding: '4px 10px', fontSize: 11 }}>
                  <span style={{ color: STAGE_COLORS[s.stage], fontWeight: 600 }}>{s.stage}</span>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{formatDate(s.enteredAt)}</div>
                </div>
                {i < opp.stageHistory.length - 1 && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>→</span>}
              </React.Fragment>
            ))}
          </div>
          {opp.lostReason && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--red)', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius)', padding: '4px 10px', display: 'inline-block' }}>
              Lost reason: <strong>{opp.lostReason}</strong>
            </div>
          )}
        </div>

        {/* Client ID + KYC Agent banner — shown when Won */}
        {opp.clientId && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16,
            background: 'linear-gradient(90deg, rgba(71,150,227,0.08), rgba(145,119,199,0.08))',
            border: '1px solid rgba(71,150,227,0.25)', borderRadius: 'var(--radius)',
            padding: '10px 14px', flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 18 }}>🏆</span>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Client ID</div>
              <div style={{ fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--so-blue)', letterSpacing: '0.5px' }}>{opp.clientId}</div>
            </div>
            {opp.kycAgent && (
              <>
                <div style={{ width: 1, height: 32, background: 'rgba(71,150,227,0.2)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>KYC Agent</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{opp.kycAgent}</div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Details grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Contact', value: opp.contactPerson },
            { label: 'Email', value: opp.email, link: `mailto:${opp.email}` },
            { label: 'Phone', value: opp.phone },
            { label: 'City', value: opp.city },
            { label: 'Vertical', value: opp.vertical },
            { label: 'Nature of Business', value: opp.natureOfBusiness },
            { label: 'Decision Maker', value: opp.decisionMaker },
            { label: 'Lead Owner', value: opp.leadOwner },
            { label: 'Expected Close', value: formatDate(opp.expectedCloseDate) },
            { label: 'Created', value: formatDate(opp.createdAt) },
          ].map(({ label, value, link }) => (
            <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: '8px 10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>{label}</div>
              {link
                ? <a href={link} target="_blank" rel="noopener" style={{ fontSize: 12, color: 'var(--blue)', textDecoration: 'none' }}>{value || '—'}</a>
                : <div style={{ fontSize: 12, color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>{value || '—'}</div>}
            </div>
          ))}
        </div>

        {opp.competitors?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label>Competitors</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {opp.competitors.map(c => (
                <span key={c} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, padding: '2px 8px', fontSize: 11, color: 'var(--red)' }}>{c}</span>
              ))}
            </div>
          </div>
        )}

        {opp.dealNotes && (
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 12px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>Deal Notes</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{opp.dealNotes}</div>
          </div>
        )}

        {lead && (
          <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius)', padding: '8px 12px', marginBottom: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
            🔗 Converted from lead <strong>{lead.id}</strong> on {formatDate(lead.convertedAt)}
          </div>
        )}

        <div className="tabs" style={{ marginBottom: 16 }}>
          <button className={`tab ${tab === 'activity' ? 'active' : ''}`} onClick={() => setTab('activity')}>Activity ({activities.length})</button>
          <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>Stage History</button>
        </div>

        {tab === 'activity' && <ActivityTimeline activities={state.activities} entityId={opp.id} />}
        {tab === 'history' && (
          <div>
            {opp.stageHistory.map((s, i) => (
              <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: STAGE_COLORS[s.stage], display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, color: STAGE_COLORS[s.stage] }}>{s.stage}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{formatDateTime(s.enteredAt)}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', paddingLeft: 20 }}>{s.note}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 20 }}>by {s.changedBy}</div>
              </div>
            ))}
          </div>
        )}
      </Drawer>

      {showLogCall && <CallLogForm entityType="opportunity" entityId={opp.id} onClose={() => setShowLogCall(false)} />}
      {showStage && <StageModal opportunity={opp} onClose={() => setShowStage(false)} onMove={moveStage} />}
    </>
  )
}
