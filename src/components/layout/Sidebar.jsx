import React, { useState } from 'react'
import { useCRM } from '../../store/CRMContext'
import { isOverdue } from '../../utils/helpers'

// ── Inline SVG icons (stroke-based, renders crisply at any size) ────────────
function NavIcon({ id, size = 16 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', display: 'block', flexShrink: 0 }
  switch (id) {
    case 'dashboard':
      return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
    case 'leads':
      return <svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    case 'opportunities':
      return <svg {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
    case 'pipeline':
      return <svg {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
    case 'reports':
      return <svg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><polyline points="2 20 22 20"/></svg>
    case 'customReports':
      return <svg {...p}><polyline points="22 12 18 12 15 20 9 4 6 12 2 12"/></svg>
    case 'salesScript':
      return <svg {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.11h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
    default:
      return <svg {...p}><circle cx="12" cy="12" r="9"/></svg>
  }
}

const NAV = [
  { id: 'dashboard',     label: 'Dashboard',         badge: null },
  { id: 'leads',         label: 'Leads',             badge: 'leads' },
  { id: 'opportunities', label: 'Opportunities',     badge: 'opps' },
  { id: 'pipeline',      label: 'Pipeline',          badge: null },
  { id: 'reports',       label: 'Reports',           badge: null },
  { id: 'customReports', label: 'Custom Reporting',  badge: null },
  { id: 'salesScript',   label: 'Sales Call Script', badge: null, dividerBefore: true },
]

const StarLogo = () => (
  <svg width="32" height="32" viewBox="0 0 80 80" fill="none"
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

  const [collapsed, setCollapsed] = useState(() =>
    !isMobile && localStorage.getItem('so-sidebar-collapsed') === 'true'
  )

  function toggleCollapse() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('so-sidebar-collapsed', String(next))
  }

  const newLeads     = leads.filter(l => l.status === 'New').length
  const activeOpps   = opportunities.filter(o => !['Lost', 'On Hold'].includes(o.stage)).length
  const overdueCount = activities.filter(a => a.nextFollowUpDate && isOverdue(a.nextFollowUpDate)).length
  const badges       = { leads: newLeads || null, opps: activeOpps || null }

  const isCollapsed = !isMobile && collapsed

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
    width: isCollapsed ? 60 : 'var(--sidebar-w)',
    flexShrink: 0,
    background: 'var(--bg-secondary)',
    borderRight: '0.5px solid var(--border-color)',
    display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
    transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
  }

  return (
    <aside style={sidebarStyle}>

      {/* ── Logo row ─────────────────────────────────────── */}
      <div style={{
        padding: isCollapsed ? '14px 0' : '16px',
        borderBottom: '0.5px solid var(--border-color)',
        flexShrink: 0,
        display: 'flex', alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
      }}>
        {isCollapsed ? (
          <StarLogo />
        ) : (
          <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StarLogo />
            <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.4px', lineHeight: 1 }}>
              <span style={{ background: 'linear-gradient(90deg,#4796E3,#9177C7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Sales </span>
              <span style={{ background: 'linear-gradient(90deg,#9177C7,#CA6673)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Orbit</span>
            </div>
          </div>
        )}

        {/* Collapse toggle — desktop only */}
        {!isMobile && (
          <button
            onClick={toggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-tertiary)',
              width: 24, height: 24, borderRadius: 6, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'color 0.15s, background 0.15s',
              position: isCollapsed ? 'absolute' : 'relative',
              ...(isCollapsed ? { bottom: -12, left: '50%', transform: 'translateX(-50%)', zIndex: 1 } : {}),
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--so-blue)'; e.currentTarget.style.background = 'var(--so-blue-soft)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = 'none' }}
          >
            {/* Chevron SVG */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {isCollapsed
                ? <polyline points="9 18 15 12 9 6"/>
                : <polyline points="15 18 9 12 15 6"/>
              }
            </svg>
          </button>
        )}
      </div>

      {/* ── Nav ──────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: isCollapsed ? '12px 8px' : '10px 8px', overflowY: 'auto' }}>
        {!isCollapsed && (
          <div style={{ fontSize: 9, color: 'var(--text-hint)', fontWeight: 700, letterSpacing: '1.8px', textTransform: 'uppercase', padding: '6px 12px 10px' }}>
            Main Menu
          </div>
        )}

        {NAV.map(item => {
          const active     = page === item.id
          const badgeCount = item.badge ? badges[item.badge] : null

          return (
            <React.Fragment key={item.id}>
              {item.dividerBefore && (
                <div style={{ height: '0.5px', background: 'var(--border-color)', margin: isCollapsed ? '8px 4px' : '8px 10px', opacity: 0.7 }} />
              )}

              <button
                onClick={() => onNav(item.id)}
                title={isCollapsed ? item.label : undefined}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  gap: isCollapsed ? 0 : 10,
                  padding: isCollapsed ? '10px 0' : '8px 12px',
                  borderRadius: '10px',
                  position: 'relative',
                  background: active ? 'var(--so-blue-soft)' : 'transparent',
                  border: 'none',
                  borderLeft: active && !isCollapsed ? '2px solid var(--so-blue)' : '2px solid transparent',
                  color: active ? 'var(--so-blue)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: active ? 600 : 400,
                  fontSize: 13,
                  marginBottom: 2,
                  textAlign: 'left',
                  fontFamily: 'var(--font)',
                  transition: 'background 150ms ease, color 150ms ease',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)' } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' } }}
              >
                {/* Active bar in collapsed mode */}
                {isCollapsed && active && (
                  <span style={{
                    position: 'absolute', left: 0, top: '18%',
                    width: 3, height: '64%',
                    background: 'var(--so-blue)',
                    borderRadius: '0 3px 3px 0',
                  }} />
                )}

                {/* Icon */}
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: active ? 1 : 0.65, transition: 'opacity 150ms' }}>
                  <NavIcon id={item.id} size={isCollapsed ? 18 : 16} />
                </span>

                {/* Label */}
                {!isCollapsed && (
                  <span style={{ flex: 1, letterSpacing: active ? '-0.1px' : '0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.label}
                  </span>
                )}

                {/* Badge */}
                {badgeCount && (
                  isCollapsed ? (
                    <span style={{
                      position: 'absolute', top: 5, right: 5,
                      minWidth: 15, height: 15, borderRadius: 8,
                      background: 'var(--so-blue)', color: '#fff',
                      fontSize: 8, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 3px', lineHeight: 1,
                    }}>{badgeCount}</span>
                  ) : (
                    <span className="nav-badge">{badgeCount}</span>
                  )
                )}
              </button>
            </React.Fragment>
          )
        })}
      </nav>

      {/* ── Overdue alert ─────────────────────────────────── */}
      {overdueCount > 0 && (
        <div style={{ padding: isCollapsed ? '0 8px 8px' : '0 10px 10px' }}>
          <div
            title={isCollapsed ? `${overdueCount} overdue follow-up${overdueCount > 1 ? 's' : ''}` : undefined}
            style={{
              background: 'rgba(217,48,37,0.08)', border: '1px solid rgba(217,48,37,0.2)',
              borderRadius: 'var(--radius)',
              padding: isCollapsed ? '8px 0' : '8px 10px',
              display: 'flex', alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: 8, cursor: 'pointer',
            }}
            onClick={() => onNav('leads')}
          >
            <span className="pulse" style={{ color: '#D93025', fontSize: 10 }}>●</span>
            {!isCollapsed && (
              <span style={{ fontSize: 11, color: '#D93025', fontWeight: 600 }}>
                {overdueCount} overdue follow-up{overdueCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── User + Logout ──────────────────────────────────── */}
      <div style={{
        padding: isCollapsed ? '12px 0' : '12px 16px',
        borderTop: '0.5px solid var(--border-color)',
        flexShrink: 0,
        display: 'flex', alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        gap: isCollapsed ? 0 : 10,
      }}>
        <div
          title={isCollapsed ? `${state.currentUser.name} · ${state.currentUser.designation || state.currentUser.role}` : undefined}
          style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: 'var(--so-blue-soft)', border: '1.5px solid var(--so-blue)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600, color: 'var(--so-blue)',
          }}
        >
          {state.currentUser.name?.split(' ').map(n => n[0]).join('') || 'U'}
        </div>

        {!isCollapsed && (
          <>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {state.currentUser.name}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {state.currentUser.designation || state.currentUser.role}
              </div>
            </div>
            {onLogout && (
              <button onClick={onLogout} title="Sign out"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 14, padding: 4, borderRadius: 6, transition: 'color 0.15s', display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => e.currentTarget.style.color = '#D93025'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            )}
          </>
        )}
      </div>

    </aside>
  )
}
