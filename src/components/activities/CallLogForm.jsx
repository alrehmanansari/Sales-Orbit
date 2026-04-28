import React, { useState } from 'react'
import { useCRM } from '../../store/CRMContext'
import { CALL_TYPES, CALL_OUTCOME_PRIMARY, CALL_OUTCOME_CONNECTED, ACTIVITY_TYPES } from '../../data/constants'

function FF({ label, required, error, children }) {
  return (
    <div className="form-group">
      <label>{label}{required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}</label>
      {children}
      {error && <div className="form-error">{error}</div>}
    </div>
  )
}

export default function CallLogForm({ entityType, entityId, onClose }) {
  const { state, dispatch } = useCRM()
  const [type, setType] = useState('Call')
  const [form, setForm] = useState({
    callType: '', outcomeGroup: '', outcomeDetail: '',
    dateTime: new Date().toISOString().slice(0, 16),
    nextFollowUpDate: '', notes: ''
  })
  const [errors, setErrors] = useState({})

  function set(k, v) {
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }))
  }

  // Derived stored value: "Connected – Interested" or "Call Later" etc.
  const callOutcomeValue = form.outcomeGroup === 'Connected'
    ? (form.outcomeDetail ? `Connected – ${form.outcomeDetail}` : '')
    : form.outcomeGroup

  function validate() {
    const e = {}
    if (!form.notes.trim()) e.notes = 'Notes are required'
    if (type === 'Call') {
      if (!form.callType) e.callType = 'Required'
      if (!form.outcomeGroup) e.outcomeGroup = 'Required'
      if (form.outcomeGroup === 'Connected' && !form.outcomeDetail) e.outcomeDetail = 'Select a connected outcome'
    }
    setErrors(e)
    return !Object.keys(e).length
  }

  function submit() {
    if (!validate()) return
    dispatch({
      type: 'ADD_ACTIVITY',
      payload: {
        entityType, entityId, type,
        callType: type === 'Call' ? form.callType : '',
        callOutcome: type === 'Call' ? callOutcomeValue : '',
        dateTime: new Date(form.dateTime).toISOString(),
        nextFollowUpDate: form.nextFollowUpDate || null,
        notes: form.notes,
        loggedBy: state.currentUser.name
      }
    })
    onClose()
  }

  const ICONS ={ Call: '📞', Email: '✉️', Meeting: '🤝', WhatsApp: '💬', Note: '📝' }

  // Rendered as a drawer-level modal (z-index 1100 from CSS) so it always appears on top of the Drawer
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal modal-md" style={{ maxHeight: '85vh' }}>
        <div className="modal-header">
          <h3>Log Activity</h3>
          <button className="btn-icon" onClick={onClose} style={{ fontSize: 16 }}>✕</button>
        </div>

        <div className="modal-body">
          {/* Activity type */}
          <div style={{ marginBottom: 14 }}>
            <label>Activity Type</label>
            <div className="radio-group">
              {ACTIVITY_TYPES.map(t => (
                <label key={t} className={`radio-option ${type === t ? 'selected' : ''}`}>
                  <input type="radio" checked={type === t} onChange={() => setType(t)} />
                  {ICONS[t]} {t}
                </label>
              ))}
            </div>
          </div>

          {type === 'Call' && (
            <>
              {/* Call Type */}
              <div style={{ marginBottom: 14 }}>
                <FF label="Call Type" error={errors.callType} required>
                  <div className="radio-group" style={{ flexWrap: 'wrap' }}>
                    {CALL_TYPES.map(t => (
                      <label key={t} className={`radio-option ${form.callType === t ? 'selected' : ''}`}>
                        <input type="radio" checked={form.callType === t} onChange={() => set('callType', t)} />
                        {t}
                      </label>
                    ))}
                  </div>
                </FF>
              </div>

              {/* Call Outcome — two-tier */}
              <div style={{ display: 'grid', gridTemplateColumns: form.outcomeGroup === 'Connected' ? '1fr 1fr' : '1fr', gap: 12, marginBottom: 14 }}>
                <FF label="Call Outcome" error={errors.outcomeGroup} required>
                  <select value={form.outcomeGroup} onChange={e => { set('outcomeGroup', e.target.value); set('outcomeDetail', '') }}>
                    <option value="">Select outcome…</option>
                    {CALL_OUTCOME_PRIMARY.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </FF>
                {form.outcomeGroup === 'Connected' && (
                  <FF label="Connected — How?" error={errors.outcomeDetail} required>
                    <select value={form.outcomeDetail} onChange={e => set('outcomeDetail', e.target.value)}>
                      <option value="">Select…</option>
                      {CALL_OUTCOME_CONNECTED.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </FF>
                )}
              </div>
            </>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <FF label="Date & Time">
              <input type="datetime-local" value={form.dateTime} onChange={e => set('dateTime', e.target.value)} />
            </FF>
            <FF label="Next Follow-Up Date">
              <input type="date" value={form.nextFollowUpDate} onChange={e => set('nextFollowUpDate', e.target.value)} />
            </FF>
          </div>

          <FF label="Notes" error={errors.notes} required>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Key discussion points, objections, next steps…" style={{ minHeight: 80 }} />
          </FF>

          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', gap: 6, alignItems: 'center' }}>
            <span>👤</span> Logged by <strong style={{ color: 'var(--text-secondary)' }}>{state.currentUser.name}</strong>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={submit}>Log Activity</button>
        </div>
      </div>
    </div>
  )
}
