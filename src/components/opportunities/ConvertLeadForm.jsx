import React, { useState, useEffect } from 'react'
import { useCRM } from '../../store/CRMContext'
import { COMPETITORS, OPPORTUNITY_STAGES, STAGE_COLORS } from '../../data/constants'
import SalesCallScript from '../common/SalesCallScript'

export default function ConvertLeadForm({ lead, onClose, onDone }) {
  const { state, dispatch } = useCRM()
  const [form, setForm] = useState({
    opportunityName: `${lead.companyName} – ${lead.vertical}`,
    stage: 'Prospecting',
    expectedMonthlyVolume: '',
    expectedMonthlyRevenue: '',
    expectedCloseDate: '',
    decisionMaker: lead.contactPerson,
    competitors: [],
    dealNotes: lead.notes || ''
  })
  const [errors, setErrors] = useState({})
  const [showScript, setShowScript] = useState(false)

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); if (errors[k]) setErrors(p => ({ ...p, [k]: '' })) }

  function toggleCompetitor(c) {
    setForm(p => ({
      ...p,
      competitors: p.competitors.includes(c)
        ? p.competitors.filter(x => x !== c)
        : [...p.competitors, c]
    }))
  }

  function validate() {
    const e = {}
    if (!form.opportunityName.trim()) e.opportunityName = 'Required'
    if (!form.expectedCloseDate) e.expectedCloseDate = 'Required'
    setErrors(e)
    return !Object.keys(e).length
  }

  function submit() {
    if (!validate()) return
    dispatch({
      type: 'ADD_OPPORTUNITY',
      payload: {
        leadId: lead.id,
        opportunityName: form.opportunityName,
        companyName: lead.companyName,
        contactPerson: lead.contactPerson,
        email: lead.email,
        phone: lead.phone,
        vertical: lead.vertical,
        natureOfBusiness: lead.natureOfBusiness,
        leadOwner: lead.leadOwner,
        priority: lead.priority,
        city: lead.city,
        website: lead.website,
        leadSource: lead.leadSource,
        expectedMonthlyVolume: parseFloat(form.expectedMonthlyVolume) || 0,
        expectedMonthlyRevenue: parseFloat(form.expectedMonthlyRevenue) || 0,
        expectedCloseDate: form.expectedCloseDate,
        decisionMaker: form.decisionMaker,
        competitors: form.competitors,
        dealNotes: form.dealNotes,
        stage: form.stage,
        lostReason: '',
        onHoldReviewDate: null,
        createdBy: state.currentUser.name,
        initialNote: 'Converted from lead'
      }
    })
    onDone?.()
    onClose()
  }

  const F = ({ label, name, required, children }) => (
    <div className="form-group">
      <label>{label}{required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}</label>
      {children}
      {errors[name] && <div className="form-error">{errors[name]}</div>}
    </div>
  )

  const DISCOVERY_POINTS = [
    { n: '1', title: 'Business Model',          body: 'Understand core offerings — products or services — and identify primary revenue sources.' },
    { n: '2', title: 'Funds Collection',         body: 'How does the client collect payments? E-commerce, DTC, B2B, bank transfers, online platforms, ACH, or wire?' },
    { n: '3', title: 'Invoicing Process',        body: 'How are invoices generated and managed — manual, software-driven, or automated? How are product/service descriptions documented?' },
    { n: '4', title: 'Client Communication',     body: 'Channels used to engage customers — email, WhatsApp, telephone, or a dedicated client portal?' },
    { n: '5', title: 'Team Size',                body: 'Total headcount and composition of each operational team.' },
    { n: '6', title: 'Current Payment Channels', body: 'All payment methods and platforms currently active in the business.' },
    { n: '7', title: 'Card Usage',               body: 'Does the client use debit/credit cards for online business spending? Approximate transaction volumes?' },
    { n: '8', title: 'Overall Funds Flow',       body: 'End-to-end financial flow — how funds are received, processed internally, and subsequently disbursed.' },
  ]

  return (
    <>
    {showScript && <SalesCallScript onClose={() => setShowScript(false)} />}
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
    <div className="modal" style={{ maxWidth: 1100, width: '100%' }}>
      <div className="modal-header">
        <h3>Convert Lead to Opportunity</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
          <button className="btn-icon" onClick={onClose} style={{ fontSize: 16 }}>✕</button>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: 0, minHeight: 0 }}>

        {/* ── LEFT: Form ── */}
        <div className="modal-body" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: 'var(--so-blue-soft)', border: '1px solid rgba(71,150,227,0.2)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{lead.contactPerson} · {lead.companyName}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Lead {lead.id} will be marked as Converted</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <F label="Opportunity Name" name="opportunityName" required>
                <input value={form.opportunityName} onChange={e => set('opportunityName', e.target.value)} />
              </F>
            </div>

            <div style={{ gridColumn: '1/-1' }}>
              <label>Opportunity Stage <span style={{ color: 'var(--red)' }}>*</span></label>
              <div className="radio-group" style={{ marginTop: 2 }}>
                {OPPORTUNITY_STAGES.filter(s => !['Lost', 'On Hold'].includes(s)).map(s => (
                  <label key={s} className={`radio-option ${form.stage === s ? 'selected' : ''}`} style={{ cursor: 'pointer' }}>
                    <input type="radio" name="stage" value={s} checked={form.stage === s} onChange={() => set('stage', s)} style={{ display: 'none' }} />
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: STAGE_COLORS[s], display: 'inline-block', flexShrink: 0 }} />
                    {s}
                  </label>
                ))}
              </div>
            </div>

            <F label="Expected Monthly Volume (USD)" name="expectedMonthlyVolume">
              <input type="number" value={form.expectedMonthlyVolume} onChange={e => set('expectedMonthlyVolume', e.target.value)} placeholder="e.g. 100000" />
            </F>
            <F label="Expected Monthly Revenue (USD)" name="expectedMonthlyRevenue">
              <input type="number" value={form.expectedMonthlyRevenue} onChange={e => set('expectedMonthlyRevenue', e.target.value)} placeholder="e.g. 5000" />
            </F>
            <F label="Expected Close Date" name="expectedCloseDate" required>
              <input type="date" value={form.expectedCloseDate} onChange={e => set('expectedCloseDate', e.target.value)} />
            </F>
            <F label="Decision Maker" name="decisionMaker">
              <input value={form.decisionMaker} onChange={e => set('decisionMaker', e.target.value)} placeholder="Key decision maker name" />
            </F>
          </div>

          <div style={{ marginTop: 14 }}>
            <label>Known Competitors</label>
            <div className="radio-group" style={{ flexWrap: 'wrap', gap: 8 }}>
              {COMPETITORS.map(c => (
                <label key={c} className={`radio-option ${form.competitors.includes(c) ? 'selected' : ''}`} style={{ cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.competitors.includes(c)} onChange={() => toggleCompetitor(c)} style={{ display: 'none' }} />
                  {c}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <F label="Deal Notes" name="dealNotes">
              <textarea value={form.dealNotes} onChange={e => set('dealNotes', e.target.value)} placeholder="Context, requirements, deal specifics…" style={{ minHeight: 80 }} />
            </F>
          </div>
        </div>{/* end form column */}

        {/* ── RIGHT: Client Discovery Panel ── */}
        <div style={{
          width: 480, flexShrink: 0,
          borderLeft: '1px solid var(--border-color)',
          background: 'linear-gradient(180deg, rgba(71,150,227,0.04) 0%, rgba(145,119,199,0.04) 100%)',
          display: 'flex', flexDirection: 'column', overflowY: 'auto'
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

          {/* Points — 2 columns, 4 each */}
          <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {DISCOVERY_POINTS.map(point => (
              <div key={point.n} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
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
        <button className="btn btn-primary btn-sm" onClick={submit}>Create Opportunity →</button>
      </div>
    </div>
    </div>
    </>
  )
}
