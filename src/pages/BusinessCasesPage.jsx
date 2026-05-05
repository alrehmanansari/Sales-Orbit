import React, { useState } from 'react'

const CHECK = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1E8E3E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const CROSS = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D93025" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const DOC  = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--so-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>

const PRINCIPLES = [
  { n: '1', title: 'Legally Incorporated Companies First', body: 'We prioritise onboarding of formally registered companies with valid registrations.' },
  { n: '2', title: 'Platform Safeguard — Unregistered Individuals', body: 'Unregistered individuals can only be supported if they operate through trusted platforms like Amazon, Fiverr, Upwork, Etsy etc. Platforms provide verification and transaction history, reducing risk compared to "Offline".' },
  { n: '3', title: 'Transparency – Documentation Required', body: 'Every business or individual must provide proof of: Identity · Legal registration (if applicable) · Real and verifiable business activity · Legitimate transactions.' },
  { n: '4', title: 'Same UBO Rule – Multi-Entity Consistency', body: 'If a person owns multiple entities, the UBO must be the same Pakistani national across all of them. The PK entity must be onboarded first before any associated Overseas entity.' },
  { n: '5', title: 'Pay-into-PK Focus – Local PK Payout', body: 'The framework applies to businesses where funds eventually flow into a PK bank account. Payouts are preferred and prioritised for PK bank accounts (not PSP accounts).' },
]

const CASES = [
  {
    id: 'companies', label: 'Companies', icon: '🏢', accent: '#4796E3',
    desc: 'Legally incorporated companies.',
    inScope: ['Goods Trading (B2B)', 'E-commerce Marketplaces', 'Other Platforms (e.g. Google Admob)', 'Services (B2B)'],
    outScope: [],
    docs: [
      'Key Controllers and UBO KYC (ID, POA)',
      'Company registration documents (Certificate of Incorporation, AoA, MoA, NTN, Business Address)',
      'Company structure (ownership and directors, or BO form)',
      'Line of Business verification (website, marketplace/store URL, invoices, contracts)',
    ],
    notes: [],
  },
  {
    id: 'partnerships', label: 'Partnerships', icon: '🤝', accent: '#9177C7',
    desc: 'Registered in Pakistan. Do not have the same legal status as companies.',
    inScope: ['Goods Trading (B2B)', 'E-commerce Marketplaces', 'Other Platforms (e.g. Google Admob)', 'Services (B2B)'],
    outScope: ['Partnerships with no tax registration.'],
    docs: [
      'Key Controllers and UBO KYC (ID, POA)',
      'Partnership registration documents · Partnership deed/agreement',
      'LLP: Certificate of Incorporation, Business Address',
      'Other partnerships (AOP): Certificate of Registration and/or Certificate of Tax Registration, Business Address',
      'Partnership structure (ownership and partners, or BO form)',
      'Line of Business verification (website, marketplace/store URL, invoices, contracts)',
    ],
    notes: [],
  },
  {
    id: 'soleProps', label: 'Sole Proprietors', icon: '👤', accent: '#E37400',
    desc: 'Registered in Pakistan. Do not have the same legal status as companies or partnerships.',
    inScope: ['Goods Trading (B2B)', 'E-commerce Marketplaces', 'Other Platforms (e.g. Google Admob)', 'IT Services (B2B)'],
    outScope: ['Other Services that are not IT.', 'Sole Props with no business bank account or business PSP account in PK.', 'Sole Props with no tax registration.'],
    docs: [
      'Government-issued ID + POA',
      'Business registration documents (Trade license / chamber certificate / tax registration, Business Address)',
      'Ownership structure (Declaration confirming owner = UBO, or BO Form)',
      'Line of business verification (Website/portfolio, client references)',
      'Business activity proof (for VA Opening)',
      'Bank account must be in the same name as the Sole Prop business.',
      'At least 2 recent invoices/contracts + bank/PSP statements showing client payments',
    ],
    notes: ['Start with limited monthly volume (e.g., $5K–$10K), expand after consistent activity.', 'Transaction monitoring required.'],
  },
  {
    id: 'individuals', label: 'Individuals — Online', icon: '💻', accent: '#1E8E3E',
    badge: 'Pilot 1A Active',
    desc: 'Pure individuals with no business registration operating through recognized platforms.',
    inScope: ['E-commerce Marketplace Sellers', 'IT Freelancers (Pilot 1A) via reputable platforms (Amazon, Etsy, Fiverr, Upwork, etc.)'],
    outScope: ['Individuals not engaged in E-commerce or IT Freelancing.', 'Individuals claiming to operate a business without valid registration.'],
    docs: [
      'Government-issued ID + POA',
      'Platform profile and proof of income / transaction / payout history',
      'Evidence individual was not off-boarded and has recent activity (up to 6 months if needed)',
      'PSP-issued bank statement if payments go through Payoneer, Wise, etc.',
    ],
    notes: [],
  },
  {
    id: 'pilot1b', label: 'Pilot 1B — Offline', icon: '📋', accent: '#CA6673',
    badge: 'Pilot 1B · Effective 07 Oct 2025',
    desc: 'Supporting Non-Sole Prop, Off-Platform ("Offline") IT Freelancers. Tax-registered individuals only.',
    inScope: ['Platform Freelancers with clients ON and OFF Platform', 'Platform Freelancers dealing directly with clients OFF Platform', 'Freelancers dealing directly with clients OFF Platform (IT & Digital Services only)'],
    outScope: ['Freelancers not engaged in IT & Digital Services.', 'Individuals whose freelancer activity is not tax-registered.'],
    docs: [
      'Government-issued ID + POA',
      'Tax registration of freelancer activity (or PSEB registration — preferred)',
      'Most recent bank statement showing incoming payments from clients',
      'Online presence (LinkedIn, personal website, portfolio)',
      'For VA Opening: at least 2 invoices or contracts with verifiable clients',
    ],
    notes: [
      'Must be a Pakistani national.',
      'Funds must flow into a PK bank account controlled by the individual.',
      'Initial limit: up to USD $5,000/month.',
      'Tiered increase: volume expands after 3–6 months of verified activity.',
      'Periodic re-verification: ID, invoices and bank statements every 6–12 months.',
      'Cannot operate in high-risk/prohibited industries (crypto, adult content, unlicensed remittance, etc.).',
    ],
  },
  {
    id: 'usCompanies', label: 'US Companies + PK UBO', icon: '🇺🇸', accent: '#546E7A',
    desc: 'PK Individual (UBO) owns a legally incorporated US company (e.g. LLC). US Company onboarded first, followed by PK Individual (Use Case #4).',
    inScope: ['E-commerce Marketplaces', 'Other Platforms — Google Admob only'],
    outScope: ['US Company not receiving payments from E-commerce Marketplaces or Google Admob.', 'PK Individual that does not fall under Use Case #4.'],
    docs: [
      'Key Controllers and UBO KYC (ID, POA)',
      'Company registration documents (Certificate of Incorporation, AoA, MoA, Business Address)',
      'Company structure (ownership and directors, or BO form)',
      'Line of Business verification (website, marketplace/store URL, invoices, contracts)',
    ],
    notes: [],
  },
]

const PAYOUT_RULES = [
  { group: 'Use Cases 1–3 & 6: PK Companies, Partnerships, Sole Props; US Companies with PK UBO', rules: ['Same-Name accounts are preferred and prioritised.', 'Same-Name mismatch considered only if Payer and Payee share the same PK UBO.'] },
  { group: 'Use Cases 4 & 5: Individuals — Online & Offline', rules: ['There should be NO Same-Name mismatch.', 'PSP accounts allow payment disbursement; they do not replace business verification.', 'Name match on bank or PSP-issued bank statement required for VA Opening.', 'EDD or 6 months of statements if needed.'] },
]

function Tag({ text, type }) {
  const bg   = type === 'in'  ? 'rgba(30,142,62,0.09)'  : 'rgba(217,48,37,0.09)'
  const col  = type === 'in'  ? '#1E8E3E'               : '#D93025'
  const icon = type === 'in'  ? CHECK : CROSS
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 0', borderBottom: '0.5px solid var(--border-color)' }}>
      <span style={{ marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{text}</span>
    </div>
  )
}

function DocItem({ text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: '0.5px solid var(--border-color)' }}>
      <span style={{ marginTop: 1, flexShrink: 0 }}>{DOC}</span>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{text}</span>
    </div>
  )
}

export default function BusinessCasesPage() {
  const [activeTab, setActiveTab] = useState('companies')
  const active = CASES.find(c => c.id === activeTab) || CASES[0]

  return (
    <div className="page">
      {/* ── Header ── */}
      <div className="page-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '1.4px', textTransform: 'uppercase', background: 'var(--so-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 4 }}>
            SUNRATE · Compliance Guide
          </div>
          <h2 style={{ margin: 0 }}>Pakistan — Eligible Use Cases</h2>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3 }}>
            Version 1.1 · Effective 14 October 2025
          </div>
        </div>
        <div style={{ padding: '6px 14px', borderRadius: 24, background: 'rgba(30,142,62,0.09)', border: '1px solid rgba(30,142,62,0.25)', fontSize: 11, fontWeight: 700, color: '#1E8E3E' }}>
          ✓ Active Policy
        </div>
      </div>

      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* ── Core Principles ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>Core Principles</span>
            <div style={{ flex: 1, height: '0.5px', background: 'var(--border-color)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {PRINCIPLES.map(p => (
              <div key={p.n} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12, boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--so-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{p.n}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 5, lineHeight: 1.3 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{p.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Use Case Tabs ── */}
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>Entity Types</span>
          <div style={{ flex: 1, height: '0.5px', background: 'var(--border-color)' }} />
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {CASES.map(c => {
            const isActive = c.id === activeTab
            return (
              <button key={c.id} onClick={() => setActiveTab(c.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 16px', borderRadius: 24, cursor: 'pointer',
                  fontFamily: 'var(--font)', fontSize: 12, fontWeight: isActive ? 700 : 500,
                  border: `1.5px solid ${isActive ? c.accent : 'var(--border-strong-color)'}`,
                  background: isActive ? `${c.accent}14` : 'var(--bg-card)',
                  color: isActive ? c.accent : 'var(--text-secondary)',
                  transition: 'all 150ms ease',
                  boxShadow: isActive ? `0 2px 10px ${c.accent}20` : 'var(--shadow-xs)',
                }}>
                <span style={{ fontSize: 14 }}>{c.icon}</span>
                {c.label}
                {c.badge && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: `${c.accent}22`, color: c.accent, letterSpacing: '0.3px' }}>{c.badge}</span>}
              </button>
            )
          })}
        </div>

        {/* Active case detail */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Description */}
            <div style={{ background: 'var(--bg-card)', border: `1px solid ${active.accent}30`, borderTop: `3px solid ${active.accent}`, borderRadius: 12, padding: '16px 18px', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: active.accent, marginBottom: 8 }}>Overview</div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7, fontWeight: 500 }}>{active.desc}</div>
            </div>

            {/* In-Scope */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '16px 18px', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#1E8E3E', marginBottom: 10 }}>✓ In-Scope Use Cases</div>
              {active.inScope.map((s, i) => <Tag key={i} text={s} type="in" />)}
            </div>

            {/* Out-of-Scope */}
            {active.outScope.length > 0 && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '16px 18px', boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#D93025', marginBottom: 10 }}>✕ Out-of-Scope Use Cases</div>
                {active.outScope.map((s, i) => <Tag key={i} text={s} type="out" />)}
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Documentation */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '16px 18px', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--so-blue)', marginBottom: 10 }}>📎 Required Documentation</div>
              {active.docs.map((d, i) => <DocItem key={i} text={d} />)}
            </div>

            {/* Notes / Controls */}
            {active.notes.length > 0 && (
              <div style={{ background: 'rgba(227,116,0,0.05)', border: '1px solid rgba(227,116,0,0.2)', borderRadius: 12, padding: '16px 18px' }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#E37400', marginBottom: 10 }}>⚠ Risk &amp; Transaction Controls</div>
                {active.notes.map((n, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: i < active.notes.length - 1 ? '0.5px solid rgba(227,116,0,0.15)' : 'none' }}>
                    <span style={{ color: '#E37400', flexShrink: 0, marginTop: 1 }}>›</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{n}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Payout Conditions ── */}
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>Bank &amp; PSP Payout Conditions</span>
            <div style={{ flex: 1, height: '0.5px', background: 'var(--border-color)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {PAYOUT_RULES.map((r, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '16px 18px', boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, lineHeight: 1.4, paddingBottom: 10, borderBottom: '1px solid var(--border-color)' }}>{r.group}</div>
                {r.rules.map((rule, j) => (
                  <div key={j} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: j < r.rules.length - 1 ? '0.5px solid var(--border-color)' : 'none' }}>
                    <span style={{ color: 'var(--so-blue)', flexShrink: 0, marginTop: 1 }}>{CHECK}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{rule}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
