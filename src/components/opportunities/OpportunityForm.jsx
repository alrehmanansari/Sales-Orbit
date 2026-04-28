import React, { useState } from 'react'
import { useCRM } from '../../store/CRMContext'
import { COMPETITORS, VERTICALS, NATURE_OF_BUSINESS, PRIORITIES, TEAM_MEMBERS } from '../../data/constants'
import { Modal } from '../common/Modal'

function FF({ label, required, error, span, children }) {
  return (
    <div className="form-group" style={span ? { gridColumn: '1/-1' } : {}}>
      <label>{label}{required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}</label>
      {children}
      {error && <div className="form-error">{error}</div>}
    </div>
  )
}

const EMPTY = {
  opportunityName: '', companyName: '', contactPerson: '', email: '', phone: '',
  vertical: '', natureOfBusiness: '', leadOwner: '', priority: '',
  expectedMonthlyVolume: '', expectedMonthlyRevenue: '',
  expectedCloseDate: '', decisionMaker: '', competitors: [], dealNotes: '',
  city: '', website: ''
}

export default function OpportunityForm({ onClose, editOpp }) {
  const { state, dispatch } = useCRM()
  const [form, setForm] = useState(editOpp ? { ...editOpp } : { ...EMPTY, leadOwner: state.currentUser.name, createdBy: state.currentUser.name })
  const [errors, setErrors] = useState({})

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); if (errors[k]) setErrors(p => ({ ...p, [k]: '' })) }

  function toggleComp(c) {
    setForm(p => ({ ...p, competitors: p.competitors.includes(c) ? p.competitors.filter(x => x !== c) : [...p.competitors, c] }))
  }

  function validate() {
    const e = {}
    if (!form.opportunityName.trim()) e.opportunityName = 'Required'
    if (!form.companyName.trim()) e.companyName = 'Required'
    if (!form.leadOwner) e.leadOwner = 'Required'
    if (!form.expectedCloseDate) e.expectedCloseDate = 'Required'
    setErrors(e)
    return !Object.keys(e).length
  }

  function submit() {
    if (!validate()) return
    if (editOpp) {
      dispatch({ type: 'UPDATE_OPPORTUNITY', payload: { ...form, expectedMonthlyVolume: parseFloat(form.expectedMonthlyVolume) || 0, expectedMonthlyRevenue: parseFloat(form.expectedMonthlyRevenue) || 0 } })
    } else {
      dispatch({
        type: 'ADD_OPPORTUNITY',
        payload: {
          ...form,
          expectedMonthlyVolume: parseFloat(form.expectedMonthlyVolume) || 0,
          expectedMonthlyRevenue: parseFloat(form.expectedMonthlyRevenue) || 0,
          stage: 'Prospecting', lostReason: '', onHoldReviewDate: null,
          createdBy: state.currentUser.name, initialNote: 'Opportunity created manually'
        }
      })
    }
    onClose()
  }

  return (
    <Modal size="xl" onClose={onClose} title={editOpp ? 'Edit Opportunity' : 'New Opportunity'}>
      <div className="modal-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FF label="Opportunity Name" error={errors.opportunityName} required span>
            <input value={form.opportunityName} onChange={e => set('opportunityName', e.target.value)} placeholder="Company – Vertical" />
          </FF>
          <FF label="Contact Person">
            <input value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} />
          </FF>
          <FF label="Company Name" error={errors.companyName} required>
            <input value={form.companyName} onChange={e => set('companyName', e.target.value)} />
          </FF>
          <FF label="Email">
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          </FF>
          <FF label="Phone">
            <input value={form.phone} onChange={e => set('phone', e.target.value)} />
          </FF>
          <FF label="Vertical">
            <select value={form.vertical} onChange={e => set('vertical', e.target.value)}>
              <option value="">Select…</option>
              {VERTICALS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </FF>
          <FF label="Nature of Business">
            <select value={form.natureOfBusiness} onChange={e => set('natureOfBusiness', e.target.value)}>
              <option value="">Select…</option>
              {NATURE_OF_BUSINESS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </FF>
          <FF label="Expected Monthly Volume (USD)">
            <input type="number" value={form.expectedMonthlyVolume} onChange={e => set('expectedMonthlyVolume', e.target.value)} placeholder="0" />
          </FF>
          <FF label="Expected Monthly Revenue (USD)">
            <input type="number" value={form.expectedMonthlyRevenue} onChange={e => set('expectedMonthlyRevenue', e.target.value)} placeholder="0" />
          </FF>
          <FF label="Expected Close Date" error={errors.expectedCloseDate} required>
            <input type="date" value={form.expectedCloseDate} onChange={e => set('expectedCloseDate', e.target.value)} />
          </FF>
          <FF label="Decision Maker">
            <input value={form.decisionMaker} onChange={e => set('decisionMaker', e.target.value)} />
          </FF>
          <FF label="Lead Owner" error={errors.leadOwner} required>
            <select value={form.leadOwner} onChange={e => set('leadOwner', e.target.value)}>
              <option value="">Assign to…</option>
              {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </FF>
          <FF label="Priority">
            <select value={form.priority} onChange={e => set('priority', e.target.value)}>
              <option value="">Select…</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </FF>

          <div style={{ gridColumn: '1/-1' }}>
            <label>Competitors</label>
            <div className="radio-group" style={{ flexWrap: 'wrap' }}>
              {COMPETITORS.map(c => (
                <label key={c} className={`radio-option ${form.competitors.includes(c) ? 'selected' : ''}`} style={{ cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.competitors.includes(c)} onChange={() => toggleComp(c)} style={{ display: 'none' }} />
                  {c}
                </label>
              ))}
            </div>
          </div>

          <FF label="Deal Notes" span>
            <textarea value={form.dealNotes} onChange={e => set('dealNotes', e.target.value)} placeholder="Context, requirements, next steps…" style={{ minHeight: 80 }} />
          </FF>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={submit}>{editOpp ? 'Save Changes' : 'Create Opportunity'}</button>
      </div>
    </Modal>
  )
}
