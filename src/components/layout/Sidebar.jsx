import React from 'react'
import { useCRM } from '../../store/CRMContext'
import { isOverdue } from '../../utils/helpers'

const NAV = [
  { id: 'dashboard',       label: 'Dashboard',        icon: '▦' },
  { id: 'leads',           label: 'Leads',            icon: '◈', badge: 'leads' },
  { id: 'opportunities',   label: 'Opportunities',    icon: '◆', badge: 'opps' },
  { id: 'pipeline',        label: 'Pipeline',         icon: '⋮⋮' },
  { id: 'reports',         label: 'Reports',          icon: '∎' },
  { id: 'customReports',   label: 'Custom Reporting', icon: '⬡' },
  { id: 'salesScript',     label: 'Sales Call Script', icon: '📞', dividerBefore: true },
]

const StarLogo = () => (
  <svg width="36" height="36" viewBox="0 0 80 80" fill="none"
    style={{ animation: 'fanSpin 3.5s linear infinite', flexShrink: 0 }}>
    <defs>
      <linearGradient id="so-grad" x1="40" y1="4" x2="40" y2="76" gradientUnits="userSpaceOnUse">
        <stop offset="0%"   stopColor="#4796E3"/>
        <stop offset="45%"  stopColor="#9177C7"/>
        <stop offset="100%" stopColor="#CA6673"/>
      </linearGradient>
    </defs>
    <path d="M40 4 C40 4 41.6 22 47 35 C53 49 68 40 76 40 C68 40 53 31 47 45 C41.6 58 40 76 40 76 C40 76 38.4 58 33 45 C27 31 12 40 4 40 C12 40 27 49 33 35 C38.4 22 40 4 40 4Z" fill="url(#so-grad)" stroke="url(#so-grad)" strokeWidth="1"/>
  </svg>
)

export default function Sidebar({ page, onNav, onLogout, isMobile, isOpen, onClose }) {
  const { state } = useCRM()
  const { leads, opportunities, activities } = state

  const newLeads = leads.filter(l => l.status === 'New').length
  const activeOpps = opportunities.filter(o => !['Lost', 'On Hold'].includes(o.stage)).length
  const overdueFollowUps = activities.filter(a => a.nextFollowUpDate && isOverdue(a.nextFollowUpDate)).length
  const badges = { leads: newLeads || null, opps: activeOpps || null }

  const sidebarStyle = isMobile ? {
    position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 201,
    width: 260, flexShrink: 0,
    background: 'var(--bg-secondary)',
    borderRight: '0.5px solid var(--border-color)',
    display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
    boxShadow: isOpen ? '8px 0 32px rgba(0,0,0,0.15)' : 'none',
  } : {
    width: 'var(--sidebar-w)', flexShrink: 0,
    background: 'var(--bg-secondary)',
    borderRight: '0.5px solid var(--border-color)',
    display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden'
  }

  return (
    <aside style={sidebarStyle}>
      {/* Logo */}
      <div style={{ padding: '16px', borderBottom: '0.5px solid var(--border-color)', flexShrink: 0 }}>
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'default' }}>
          <StarLogo />
          <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.4px', lineHeight: 1 }}>
            <span style={{
              background: 'linear-gradient(90deg, #4796E3, #9177C7)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Sales </span>
            <span style={{
              background: 'linear-gradient(90deg, #9177C7, #CA6673)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Orbit</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        <div style={{ fontSize: 9, color: 'var(--text-hint)', fontWeight: 700, letterSpacing: '1.8px', textTransform: 'uppercase', padding: '6px 12px 10px' }}>Main Menu</div>
        {NAV.map(item => {
          const active = page === item.id
          const badgeCount = item.badge ? badges[item.badge] : null
          return (
            <React.Fragment key={item.id}>
            {item.dividerBefore && (
              <div style={{ height: '0.5px', background: 'var(--border-color)', margin: '8px 10px', opacity: 0.7 }} />
            )}
            <button
              onClick={() => onNav(item.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: '10px',
                background: active
                  ? 'linear-gradient(90deg, var(--so-blue-soft), rgba(145,119,199,0.06))'
                  : 'transparent',
                border: 'none',
                borderLeft: active
                  ? '2px solid var(--so-blue)'
                  : '2px solid transparent',
                color: active ? 'var(--so-blue)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400,
                marginBottom: 2, textAlign: 'left', fontFamily: 'var(--font)',
                transition: 'all 180ms ease',
                boxShadow: active ? 'inset 0 1px 0 rgba(255,255,255,0.06)' : 'none',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)' } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' } }}
            >
              <span style={{
                fontSize: 14, width: 20, textAlign: 'center', flexShrink: 0,
                opacity: active ? 1 : 0.7,
                transition: 'opacity 180ms'
              }}>{item.icon}</span>
              <span style={{ flex: 1, letterSpacing: active ? '-0.1px' : '0' }}>{item.label}</span>
              {badgeCount && <span className="nav-badge">{badgeCount}</span>}
            </button>
            </React.Fragment>
          )
        })}
      </nav>

      {/* Overdue alert */}
      {overdueFollowUps > 0 && (
        <div style={{ padding: '0 10px 10px' }}>
          <div style={{
            background: 'rgba(217,48,37,0.08)', border: '1px solid rgba(217,48,37,0.2)',
            borderRadius: 'var(--radius)', padding: '8px 10px',
            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer'
          }} onClick={() => onNav('leads')}>
            <span className="pulse" style={{ color: '#D93025', fontSize: 10 }}>●</span>
            <span style={{ fontSize: 11, color: '#D93025', fontWeight: 600 }}>
              {overdueFollowUps} overdue follow-up{overdueFollowUps > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* User + Logout */}
      <div style={{ padding: '12px 16px', borderTop: '0.5px solid var(--border-color)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'var(--so-blue-soft)', border: '1.5px solid var(--so-blue)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600, color: 'var(--so-blue)', flexShrink: 0
          }}>
            {state.currentUser.name?.split(' ').map(n => n[0]).join('') || 'U'}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{state.currentUser.name}</div>
            <div style={{ fontSize: 9, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{state.currentUser.designation || state.currentUser.role}</div>
          </div>
          {onLogout && (
            <button onClick={onLogout} title="Sign out"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 14, padding: 4, borderRadius: 6, transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#D93025'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
            >⏻</button>
          )}
        </div>
      </div>
    </aside>
  )
}
