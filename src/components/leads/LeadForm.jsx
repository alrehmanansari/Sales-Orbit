import React, { useState, useRef } from 'react'
import { useCRM } from '../../store/CRMContext'
import { LEAD_SOURCES, VERTICALS, NATURE_OF_BUSINESS, PRIORITIES, TEAM_MEMBERS, CITIES } from '../../data/constants'
import { Modal } from '../common/Modal'
import SalesCallScript from '../common/SalesCallScript'

const EMPTY = {
  contactPerson: '', companyName: '', website: '', email: '', phone: '',
  city: '', leadSource: '', leadSourceOther: '', vertical: '',
  natureOfBusiness: '', leadOwner: '', priority: '', notes: ''
}

export default function LeadForm({ onClose, editLead }) {
  const { state, dispatch } = useCRM()
  const [form, setForm] = useState(editLead ? { ...editLead } : { ...EMPTY, leadOwner: state.currentUser.name, createdBy: state.currentUser.name })
  const [errors, setErrors] = useState({})
  const [dupWarning, setDupWarning] = useState(null)
  const [showScript, setShowScript] = useState(false)
  const [cityQuery, setCityQuery] = useState(form.city || '')
  const [showCitySugg, setShowCitySugg] = useState(false)
  const cityRef = useRef()

  const citySuggestions = CITIES.filter(c => c.toLowerCase().includes(cityQuery.toLowerCase()) && c !== cityQuery).slice(0, 5)

  function set(k, v) {
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }))
  }

  function checkDuplicate(field, value) {
    if (!value) return
    const existing = state.leads.find(l => l[field]?.toLowerCase() === value.toLowerCase() && l.id !== editLead?.id)
    if (existing) setDupWarning(`Duplicate ${field === 'email' ? 'email' : 'phone'} — ${existing.contactPerson} at ${existing.companyName}`)
    else setDupWarning(null)
  }

  function validate() {
    const e = {}
    if (!form.contactPerson.trim()) e.contactPerson = 'Required'
    if (!form.companyName.trim()) e.companyName = 'Required'
    if (!form.email.trim()) e.email = 'Required'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email'
    if (!form.leadSource) e.leadSource = 'Required'
    if (!form.vertical) e.vertical = 'Required'
    if (!form.natureOfBusiness) e.natureOfBusiness = 'Required'
    if (!form.leadOwner) e.leadOwner = 'Required'
    if (!form.priority) e.priority = 'Required'
    if (form.leadSource === 'Others' && !form.leadSourceOther.trim()) e.leadSourceOther = 'Please specify'
    setErrors(e)
    return !Object.keys(e).length
  }

  function submit() {
    if (!validate()) return
    if (editLead) {
      dispatch({ type: 'UPDATE_LEAD', payload: { ...form } })
    } else {
      dispatch({ type: 'ADD_LEAD', payload: { ...form, createdBy: state.currentUser.name } })
    }
    onClose()
  }

  const F = ({ label, name, required, children, span2 }) => (
    <div className="form-group" style={span2 ? { gridColumn: 'span 2' } : {}}>
      <label>{label}{required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}</label>
      {children}
      {errors[name] && <div className="form-error">{errors[name]}</div>}
    </div>
  )

  const DISCOVERY_POINTS = [
    {
      n: '1', title: 'Business Model',
      body: 'Understand core offerings — products or services — and identify primary revenue sources.'
    },
    {
      n: '2', title: 'Funds Collection',
      body: 'How does the client collect payments? E-commerce, DTC, B2B, bank transfers, online platforms, ACH, or wire?'
    },
    {
      n: '3', title: 'Invoicing Process',
      body: 'How are invoices generated and managed — manual, software-driven, or automated? How are product/service descriptions documented?'
    },
    {
      n: '4', title: 'Client Communication',
      body: 'Channels used to engage customers — email, WhatsApp, telephone, or a dedicated client portal?'
    },
    {
      n: '5', title: 'Team Size',
      body: 'Total headcount and composition of each operational team.'
    },
    {
      n: '6', title: 'Current Payment Channels',
      body: 'All payment methods and platforms currently active in the business.'
    },
    {
      n: '7', title: 'Card Usage',
      body: 'Does the client use debit/credit cards for online business spending? Approximate transaction volumes?'
    },
    {
      n: '8', title: 'Overall Funds Flow',
      body: 'End-to-end financial flow — how funds are received, processed internally, and subsequently disbursed.'
    },
  ]

  return (
    <>
    {showScript && <SalesCallScript onClose={() => setShowScript(false)} />}
    <Modal size="xl" onClose={onClose}
      title={editLead ? 'Edit Lead' : 'Add New Lead'}
      headerAction={
        <button onClick={() => setShowScript(true)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', borderRadius: 24, border: 'none', cursor: 'pointer',
          background: 'var(--so-gradient)', color: '#fff',
          fontSize: 12, fontWeight: 700, fontFamily: 'var(--font)', letterSpacing: '0.2px',
          boxShadow: '0 0 0 0 rgba(71,150,227,0.5), 0 3px 12px rgba(71,150,227,0.4)',
          animation: 'scriptPulse 2.4s ease-in-out infinite',
          whiteSpace: 'nowrap'
        }}>
          📞 Sales Call Script
        </button>
      }
    >
      {/* Two-column layout: form left, discovery panel right */}
      <div style={{ display: 'flex', gap: 0, minHeight: 0 }}>

        {/* ── LEFT: Form ── */}
        <div className="modal-body" style={{ overflowY: 'visible', flex: 1, minWidth: 0 }}>
        {dupWarning && <div className="dup-warning" style={{ marginBottom: 12, fontSize: 11 }}>⚠ {dupWarning}</div>}

        {/* Row 1: Company | Contact | Email */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <F label="Company Name" name="companyName" required>
            <input value={form.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Legal or trading name" />
          </F>
          <F label="Contact Person" name="contactPerson" required>
            <input value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} placeholder="Full name" />
          </F>
          <F label="Email ID" name="email" required>
            <input type="email" value={form.email}
              onChange={e => set('email', e.target.value)}
              onBlur={e => checkDuplicate('email', e.target.value)}
              placeholder="contact@company.com" />
          </F>
        </div>

        {/* Row 2: Phone | Website | City */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <F label="Phone Number" name="phone">
            <input type="tel" value={form.phone}
              onChange={e => set('phone', e.target.value)}
              onBlur={e => checkDuplicate('phone', e.target.value)}
              placeholder="+923001234567" />
          </F>
          <F label="Website" name="website">
            <input value={form.website} onChange={e => set('website', e.target.value)} placeholder="company.com" />
          </F>
          <F label="City" name="city">
            <div className="autocomplete-wrap" ref={cityRef}>
              <input
                value={cityQuery}
                onChange={e => { setCityQuery(e.target.value); set('city', e.target.value); setShowCitySugg(true) }}
                onFocus={() => setShowCitySugg(true)}
                onBlur={() => setTimeout(() => setShowCitySugg(false), 150)}
                placeholder="Start typing city…"
              />
              {showCitySugg && citySuggestions.length > 0 && (
                <div className="autocomplete-dropdown">
                  {citySuggestions.map(c => (
                    <div key={c} className="autocomplete-item" onMouseDown={() => { setCityQuery(c); set('city', c); setShowCitySugg(false) }}>{c}</div>
                  ))}
                </div>
              )}
            </div>
          </F>
        </div>

        {/* Row 3: Lead Source | Vertical | Nature of Business */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <F label="Lead Source" name="leadSource" required>
              <select value={form.leadSource} onChange={e => set('leadSource', e.target.value)}>
                <option value="">Select source…</option>
                {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </F>
            {form.leadSource === 'Others' && (
              <div style={{ marginTop: 6 }}>
                <F label="Specify Source" name="leadSourceOther" required>
                  <input value={form.leadSourceOther} onChange={e => set('leadSourceOther', e.target.value)} placeholder="Describe source" />
                </F>
              </div>
            )}
          </div>
          <F label="Vertical" name="vertical" required>
            <select value={form.vertical} onChange={e => set('vertical', e.target.value)}>
              <option value="">Select vertical…</option>
              {VERTICALS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </F>
          <F label="Nature of Business" name="natureOfBusiness" required>
            <select value={form.natureOfBusiness} onChange={e => set('natureOfBusiness', e.target.value)}>
              <option value="">Select type…</option>
              {NATURE_OF_BUSINESS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </F>
        </div>

        {/* Row 4: Lead Owner | Priority */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 12 }}>
          <F label="Lead Owner" name="leadOwner" required>
            <select value={form.leadOwner} onChange={e => set('leadOwner', e.target.value)}>
              <option value="">Assign to…</option>
              {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </F>
          <F label="Priority" name="priority" required>
            <div className="radio-group" style={{ paddingTop: 2 }}>
              {PRIORITIES.map(p => (
                <label key={p} className={`radio-option ${form.priority === p ? 'selected' : ''}`}>
                  <input type="radio" name="priority" value={p} checked={form.priority === p} onChange={() => set('priority', p)} />
                  {p}
                </label>
              ))}
            </div>
            {errors.priority && <div className="form-error">{errors.priority}</div>}
          </F>
        </div>

        {/* Row 5: Notes */}
        <div className="form-group">
          <label>Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Initial qualification notes, context…" style={{ minHeight: 60, maxHeight: 80 }} />
        </div>
        </div>{/* end modal-body / form column */}

        {/* ── RIGHT: Client Discovery Panel ── */}
        <div style={{
          width: 480, flexShrink: 0,
          borderLeft: '1px solid var(--border-color)',
          background: 'linear-gradient(180deg, rgba(71,150,227,0.04) 0%, rgba(145,119,199,0.04) 100%)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto'
        }}>
          {/* Panel header */}
          <div style={{
            padding: '14px 16px 10px',
            borderBottom: '1px solid var(--border-color)',
            position: 'sticky', top: 0,
            background: 'linear-gradient(135deg, rgba(71,150,227,0.08), rgba(145,119,199,0.08))',
            backdropFilter: 'blur(8px)'
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '1.4px', textTransform: 'uppercase', background: 'var(--so-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 4 }}>
              Client Discovery
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
              Key Discussion Points
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-hint)', marginTop: 4, lineHeight: 1.4 }}>
              To be covered during every initial client outreach
            </div>
          </div>

          {/* Points list — 2 columns, 4 each */}
          <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {DISCOVERY_POINTS.map(point => (
              <div key={point.n} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 10, padding: '10px 12px',
                transition: 'border-color 0.18s, box-shadow 0.18s'
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--so-blue)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(71,150,227,0.10)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--so-gradient)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 800, color: '#fff'
                  }}>{point.n}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.1px' }}>
                    {point.title}
                  </span>
                </div>
                <p style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0, paddingLeft: 25 }}>
                  {point.body}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>{/* end two-column flex */}

      <div className="modal-footer">
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={submit}>{editLead ? 'Save Changes' : 'Add Lead'}</button>
      </div>
    </Modal>
    </>
  )
}
