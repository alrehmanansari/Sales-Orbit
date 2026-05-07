import React, { useMemo } from 'react'
import { useCRM } from '../store/CRMContext'
import { useTheme } from '../hooks/useTheme'
import { formatCurrency } from '../utils/helpers'

function StoryCard({
  company, phone, vol, tc, email, owner, updateStatus,
  accent = '#4796E3', label, labelColor = '#4796E3',
  daysLabel, isDark, onClick,
}) {
  const cardBorder = isDark
    ? `1px solid rgba(255,255,255,0.07)`
    : `1px solid rgba(0,0,0,0.07)`

  const volColor      = isDark ? '#6BB5FF' : 'var(--so-blue)'
  const tcColor       = isDark ? '#4ADE80' : 'var(--green)'
  const textPrimary   = isDark ? '#EAEAF0' : 'var(--text-primary)'
  const textSecondary = isDark ? 'rgba(255,255,255,0.55)' : 'var(--text-secondary)'
  const textTertiary  = isDark ? 'rgba(255,255,255,0.38)' : 'var(--text-tertiary)'
  const dividerColor  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'

  const shadowBase  = isDark
    ? `0 4px 20px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.05)`
    : `0 2px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.85)`
  const shadowHover = isDark
    ? `0 10px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)`
    : `0 8px 24px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.95)`

  return (
    <div
      onClick={onClick}
      style={{
        width: 172, flexShrink: 0,
        borderRadius: 18,
        background: 'var(--bg-card)',
        border: cardBorder,
        boxShadow: shadowBase,
        overflow: 'hidden', position: 'relative',
        transition: 'transform 220ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 240ms ease',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.boxShadow = shadowHover
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = shadowBase
      }}
    >
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
          fontSize: 13.5, fontWeight: 700,
          background: 'var(--so-gradient)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          lineHeight: 1.3, letterSpacing: '-0.2px',
          marginBottom: 10, minHeight: 36,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {company}
        </div>

        {/* Divider */}
        <div style={{ height: '0.5px', background: dividerColor, marginBottom: 8 }} />

        {/* Vol + TC — left label, right value */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 9 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 9.5, fontWeight: 600, color: textTertiary, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Vol</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: volColor, fontFamily: 'var(--font-mono)' }}>{vol ?? '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 9.5, fontWeight: 600, color: textTertiary, textTransform: 'uppercase', letterSpacing: '0.6px' }}>TC</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: tcColor, fontFamily: 'var(--font-mono)' }}>{tc ?? '—'}</span>
          </div>
        </div>

        {/* ── Separator below TC ── */}
        <div style={{ height: '0.5px', background: dividerColor, marginBottom: 8 }} />

        {/* Email */}
        <div style={{ marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: 9.5, color: email ? 'var(--so-blue)' : textTertiary, fontWeight: 500 }}>
            {email || '—'}
          </span>
        </div>

        {/* Owner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 9 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={textTertiary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {owner || '—'}
          </span>
        </div>

        {/* ── Separator ── */}
        <div style={{ height: '0.5px', background: dividerColor, marginBottom: 8 }} />

        {/* Update status */}
        {updateStatus && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', padding: '2px 7px',
            borderRadius: 10, marginBottom: 5,
            background: isDark ? `${labelColor}18` : `${labelColor}15`,
            border: `1px solid ${isDark ? labelColor + '35' : labelColor + '30'}`,
          }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: labelColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {updateStatus}
            </span>
          </div>
        )}

        {/* Days indicator */}
        {daysLabel && (
          <div style={{ fontSize: 9.5, color: textTertiary, fontFamily: 'var(--font-mono)', marginTop: updateStatus ? 3 : 0 }}>
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
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 20, paddingTop: 2 }}>
          {children}
        </div>
      )}
    </div>
  )
}

export default function ActionItemsPage({ navigate }) {
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

  function goToLead(id) {
    navigate?.('leads', 'lead', id)
  }

  function goToOpp(id) {
    navigate?.('opportunities', 'opp', id)
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
          {untouchedLeads.map(lead => (
            <StoryCard key={lead.id}
              isDark={isDark}
              accent="#4796E3" label="Untouched Lead" labelColor="#60B4FF"
              company={lead.companyName}
              phone={lead.phone}
              email={lead.email}
              owner={lead.leadOwner?.split(' ')[0] || lead.leadOwner}
              vol="—"
              tc="—"
              updateStatus={lead.status}
              daysLabel={lead.lastActivityAt ? daysSince(lead.lastActivityAt) : 'Never contacted'}
              onClick={() => goToLead(lead.id)}
            />
          ))}
        </Section>

        {/* Separator */}
        <div style={{ height: '0.5px', background: 'var(--border-color)', margin: '28px 0' }} />

        {/* ── OPPORTUNITIES ──────────────────────────── */}
        <Section title="Opportunities" icon="🎯" count={stuckOpps.length} accent="#9177C7"
          emptyMsg="No opportunities have been stuck in a stage for more than 7 days.">
          {stuckOpps.map(opp => (
            <StoryCard key={opp.id}
              isDark={isDark}
              accent="#9177C7" label={opp.stage} labelColor="#B49EE8"
              company={opp.companyName}
              phone={opp.phone}
              email={opp.email}
              owner={opp.leadOwner?.split(' ')[0] || opp.leadOwner}
              vol={formatCurrency(opp.expectedMonthlyVolume)}
              tc={formatCurrency(opp.expectedMonthlyRevenue)}
              updateStatus={opp.stage}
              daysLabel={stageAge(opp)}
              onClick={() => goToOpp(opp.id)}
            />
          ))}
        </Section>

        {/* Separator */}
        <div style={{ height: '0.5px', background: 'var(--border-color)', margin: '28px 0' }} />

        {/* ── FOLLOW-UPS ─────────────────────────────── */}
        <Section title="Follow-ups" icon="🔔" count={followUpOpps.length} accent="#CA6673"
          emptyMsg="No follow-ups scheduled for today.">
          {followUpOpps.map(opp => (
            <StoryCard key={opp.id}
              isDark={isDark}
              accent="#CA6673" label="Follow-up Today" labelColor="#E8909B"
              company={opp.companyName}
              phone={opp.phone}
              email={opp.email}
              owner={opp.leadOwner?.split(' ')[0] || opp.leadOwner}
              vol={formatCurrency(opp.expectedMonthlyVolume)}
              tc={formatCurrency(opp.expectedMonthlyRevenue)}
              updateStatus={opp.stage}
              daysLabel={`Stage: ${opp.stage}`}
              onClick={() => goToOpp(opp.id)}
            />
          ))}
        </Section>

      </div>
    </div>
  )
}
