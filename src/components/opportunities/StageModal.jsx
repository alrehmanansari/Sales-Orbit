import React, { useState } from 'react'
import { OPPORTUNITY_STAGES, LOST_REASONS, STAGE_COLORS } from '../../data/constants'

export default function StageModal({ opportunity, onClose, onMove }) {
  const [newStage, setNewStage] = useState(opportunity.stage)
  const [note, setNote] = useState('')
  const [lostReason, setLostReason] = useState('')
  const [reviewDate, setReviewDate] = useState('')
  const [error, setError] = useState('')

  function submit() {
    if (!note.trim()) { setError('A note/reason is required for stage changes.'); return }
    if (newStage === 'Lost' && !lostReason) { setError('Please select a lost reason.'); return }
    onMove({ newStage, note, lostReason: newStage === 'Lost' ? lostReason : '', onHoldReviewDate: newStage === 'On Hold' ? reviewDate : null })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal modal-sm">
        <div className="modal-header">
          <h3>Move Stage</h3>
          <button className="btn-icon" onClick={onClose} style={{ fontSize: 16 }}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: 14 }}>
            <label>Select New Stage</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
              {OPPORTUNITY_STAGES.map(s => (
                <label key={s} className={`radio-option ${newStage === s ? 'selected' : ''}`} style={{ cursor: 'pointer' }}>
                  <input type="radio" name="stage" value={s} checked={newStage === s} onChange={() => setNewStage(s)} style={{ display: 'none' }} />
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: STAGE_COLORS[s], display: 'inline-block', flexShrink: 0 }} />
                  {s}
                  {s === opportunity.stage && <span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>current</span>}
                </label>
              ))}
            </div>
          </div>

          {newStage === 'Lost' && (
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Lost Reason <span style={{ color: 'var(--red)' }}>*</span></label>
              <select value={lostReason} onChange={e => setLostReason(e.target.value)}>
                <option value="">Select reason…</option>
                {LOST_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          )}

          {newStage === 'On Hold' && (
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Scheduled Review Date</label>
              <input type="date" value={reviewDate} onChange={e => setReviewDate(e.target.value)} />
            </div>
          )}

          <div className="form-group">
            <label>Note / Reason <span style={{ color: 'var(--red)' }}>*</span></label>
            <textarea value={note} onChange={e => { setNote(e.target.value); setError('') }} placeholder="Explain this stage transition…" style={{ minHeight: 70 }} />
            {error && <div className="form-error">{error}</div>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={newStage === opportunity.stage}>Confirm Move</button>
        </div>
      </div>
    </div>
  )
}
