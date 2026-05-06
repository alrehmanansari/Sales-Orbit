import React, { useMemo } from 'react'
import { useCRM } from '../store/CRMContext'
import { useTheme } from '../hooks/useTheme'
import { formatCurrency } from '../utils/helpers'

const WA_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="#25D366">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.562 4.14 1.542 5.876L.057 23.428a.5.5 0 0 0 .607.607l5.694-1.476A11.938 11.938 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.938 9.938 0 0 1-5.354-1.562l-.38-.228-3.975 1.03 1.055-3.86-.248-.396A9.938 9.938 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>
)

function StoryCard({ company, phone, vol, tc, accent = '#4796E3', label, labelColor = '#4796E3', daysLabel, isDark }) {
  const cardBg = isDark
    ? `radial-gradient(ellipse at 20% 30%, rgba(71,150,227,0.20), transparent 62%),
       radial-gradient(ellipse at 80% 72%, rgba(145,119,199,0.16), transparent 58%),
       #131318`
    : `radial-gradient(ellipse at 20% 30%, rgba(71,150,227,0.16), transparent 62%),
       radial-gradient(ellipse at 80% 72%, rgba(145,119,199,0.13), transparent 58%),
       #F8F9FA`

  const cardBorder = isDark
    ? `1px solid rgba(255,255,255,0.07)`
    : `1px solid rgba(0,0,0,0.07)`

  const volColor      = isDark ? '#6BB5FF' : 'var(--so-blue)'
  const tcColor       = isDark ? '#4ADE80' : 'var(--green)'
  const textPrimary   = isDark ? '#EAEAF0' : 'var(--text-primary)'
  const textSecondary = isDark ? 'rgba(255,255,255,0.42)' : 'var(--text-tertiary)'
  const dividerColor  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
  const waColor       = isDark ? '#4ADE80' : 'var(--green)'
  const noPhoneColor  = isDark ? 'rgba(255,255,255,0.22)' : 'var(--text-hint)'

  const shadowBase  = isDark
    ? `0 4px 20px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.05)`
    : `0 2px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.85)`
  const shadowHover = isDark
    ? `0 10px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)`
    : `0 8px 24px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.95)`

  return (
    <div style={{
      width: 162, flexShrink: 0,
      borderRadius: 18,
      background: cardBg,
      border: cardBorder,
      boxShadow: shadowBase,
      overflow: 'hidden', position: 'relative',
      transition: 'transform 220ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 240ms ease',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = shadowHover }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = shadowBase }}
    >
      {/* Top accent strip */}
      <div style={{ height: 2.5, background: `linear-gradient(90deg, ${accent}, ${accent}66)` }} />

      <div style={{ padding: '12px 13px 13px' }}>
        {/* Section label badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '2px 8px', borderRadius: 20,
          background: isDark ? `${labelColor}22` : `${labelColor}20`,
          border: `1px solid ${isDark ? labelColor + '40' : labelColor + '45'}`,
          backdropFilter: 'blur(8px)',
          marginBottom: 9,
        }}>
          <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: labelColor }}>
            {label}
          </span>
        </div>

        {/* Company name */}
        <div style={{
          fontSize: 13.5, fontWeight: 700, color: textPrimary,
          lineHeight: 1.3, letterSpacing: '-0.2px',
          marginBottom: 10, minHeight: 36,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {company}
        </div>

        {/* Divider */}
        <div style={{ height: '0.5px', background: dividerColor, marginBottom: 9 }} />

        {/* Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 9.5, fontWeight: 600, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Vol</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: volColor, fontFamily: 'var(--font-mono)' }}>{vol ?? '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 9.5, fontWeight: 600, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.6px' }}>TC</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: tcColor, fontFamily: 'var(--font-mono)' }}>{tc ?? '—'}</span>
          </div>
        </div>

        {/* WhatsApp number */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
          {WA_ICON}
          <span style={{ fontSize: 10.5, fontWeight: 500, color: phone ? waColor : noPhoneColor, fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {phone || 'No number'}
          </span>
        </div>

        {/* Days indicator */}
        {daysLabel && (
          <div style={{ marginTop: 7, fontSize: 9.5, color: textSecondary, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
            {daysLabel}
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, icon, count, accent, children, emptyMsg }) {
  return (
    <div>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <div>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>{title}</span>
          <span style={{
            marginLeft: 10, fontSize: 11, fontWeight: 700, padding: '2px 9px',
            borderRadius: 20, background: `${accent}18`, color: accent,
            border: `1px solid ${accent}30`,
          }}>{count}</span>
        </div>
      </div>

      {count === 0 ? (
        <div style={{
          padding: '28px 24px', borderRadius: 14,
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13,
        }}>
          {emptyMsg}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8, paddingTop: 2 }}>
          {children}
        </div>
      )}
    </div>
  )
}

export default function ActionItemsPage() {
  const { state } = useCRM()
  const { isDark } = useTheme()
  const now = new Date()
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
  const todayStr = now.toISOString().slice(0, 10)

  /* ── 1. Untouched leads (no activity in last 7 days) ── */
  const untouchedLeads = useMemo(() =>
    state.leads.filter(l => {
      if (['Converted', 'Lost'].includes(l.status)) return false
      if (!l.lastActivityAt) return true
      return new Date(l.lastActivityAt) < sevenDaysAgo
    }).sort((a, b) => {
      const aDate = a.lastActivityAt ? new Date(a.lastActivityAt) : new Date(a.createdAt)
      const bDate = b.lastActivityAt ? new Date(b.lastActivityAt) : new Date(b.createdAt)
      return aDate - bDate
    })
  , [state.leads])

  /* ── 2. Opportunities stuck in stage 7+ days ── */
  const stuckOpps = useMemo(() =>
    state.opportunities.filter(opp => {
      if (['Lost', 'On Hold'].includes(opp.stage)) return false
      const current = opp.stageHistory?.[opp.stageHistory.length - 1]
      if (!current?.enteredAt) return false
      return new Date(current.enteredAt) < sevenDaysAgo
    }).sort((a, b) => {
      const aEntry = a.stageHistory?.[a.stageHistory.length - 1]
      const bEntry = b.stageHistory?.[b.stageHistory.length - 1]
      return new Date(aEntry?.enteredAt || 0) - new Date(bEntry?.enteredAt || 0)
    })
  , [state.opportunities])

  /* ── 3. Follow-ups due today ── */
  const followUpOpps = useMemo(() => {
    const todayActEntityIds = new Set(
      state.activities
        .filter(a => a.entityType === 'opportunity' && a.nextFollowUpDate?.slice(0, 10) === todayStr)
        .map(a => a.entityId)
    )
    return state.opportunities.filter(o =>
      todayActEntityIds.has(o.id) && !['Lost', 'On Hold'].includes(o.stage)
    )
  }, [state.activities, state.opportunities])

  function daysSince(iso) {
    if (!iso) return null
    const d = Math.floor((now - new Date(iso)) / 86400000)
    return `${d}d ago`
  }

  function stageAge(opp) {
    const entry = opp.stageHistory?.[opp.stageHistory.length - 1]
    return daysSince(entry?.enteredAt)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>Action Items</h2>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
            {untouchedLeads.length + stuckOpps.length + followUpOpps.length} items need attention today
          </div>
        </div>
      </div>

      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* ── LEADS ──────────────────────────────────── */}
        <Section title="Leads" icon="👤" count={untouchedLeads.length} accent="#4796E3"
          emptyMsg="All leads have been contacted in the last 7 days.">
          {untouchedLeads.map((lead, i) => (
            <StoryCard key={lead.id}
              isDark={isDark}
              accent="#4796E3" label="Untouched Lead" labelColor="#60B4FF"
              company={lead.companyName}
              phone={lead.phone}
              vol="—"
              tc="—"
              daysLabel={lead.lastActivityAt ? daysSince(lead.lastActivityAt) : 'Never contacted'}
            />
          ))}
        </Section>

        {/* Separator */}
        <div style={{ height: '0.5px', background: 'var(--border-color)', margin: '28px 0' }} />

        {/* ── OPPORTUNITIES ──────────────────────────── */}
        <Section title="Opportunities" icon="🎯" count={stuckOpps.length} accent="#9177C7"
          emptyMsg="No opportunities have been stuck in a stage for more than 7 days.">
          {stuckOpps.map((opp, i) => (
            <StoryCard key={opp.id}
              isDark={isDark}
              accent="#9177C7" label={opp.stage} labelColor="#B49EE8"
              company={opp.companyName}
              phone={opp.phone}
              vol={formatCurrency(opp.expectedMonthlyVolume)}
              tc={formatCurrency(opp.expectedMonthlyRevenue)}
              daysLabel={stageAge(opp)}
            />
          ))}
        </Section>

        {/* Separator */}
        <div style={{ height: '0.5px', background: 'var(--border-color)', margin: '28px 0' }} />

        {/* ── FOLLOW-UPS ─────────────────────────────── */}
        <Section title="Follow-ups" icon="🔔" count={followUpOpps.length} accent="#CA6673"
          emptyMsg="No follow-ups scheduled for today.">
          {followUpOpps.map((opp, i) => (
            <StoryCard key={opp.id}
              isDark={isDark}
              accent="#CA6673" label="Follow-up Today" labelColor="#E8909B"
              company={opp.companyName}
              phone={opp.phone}
              vol={formatCurrency(opp.expectedMonthlyVolume)}
              tc={formatCurrency(opp.expectedMonthlyRevenue)}
              daysLabel={`Stage: ${opp.stage}`}
            />
          ))}
        </Section>

      </div>
    </div>
  )
}
