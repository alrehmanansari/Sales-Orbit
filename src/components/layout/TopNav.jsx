import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useCRM } from '../../store/CRMContext'
import { useAuth } from '../../store/AuthContext'
import { COLOR_SCHEMES } from '../../hooks/useTheme'
import { searchFilter } from '../../utils/helpers'

/* ── Star logo ── */
const StarMark = () => (
  <svg width="26" height="26" viewBox="0 0 80 80" fill="none" style={{ animation: 'fanSpin 3.5s linear infinite', flexShrink: 0 }}>
    <defs>
      <linearGradient id="tn-g" x1="40" y1="4" x2="40" y2="76" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#4796E3"/>
        <stop offset="45%" stopColor="#9177C7"/>
        <stop offset="100%" stopColor="#CA6673"/>
      </linearGradient>
    </defs>
    <path d="M40 4 C40 4 41.6 22 47 35 C53 49 68 40 76 40 C68 40 53 31 47 45 C41.6 58 40 76 40 76 C40 76 38.4 58 33 45 C27 31 12 40 4 40 C12 40 27 49 33 35 C38.4 22 40 4 40 4Z" fill="url(#tn-g)"/>
  </svg>
)

const FLAT_NAV = [
  { id: 'actionItems', label: 'Action Items', badge: true },
  { id: 'dashboard',    label: 'Dashboard' },
  { id: 'leads',        label: 'Leads' },
  { id: 'opportunities',label: 'Opportunities' },
  { id: 'pipeline',     label: 'Pipeline' },
]

const GROUPS = [
  {
    id: 'analytics', label: 'Analytics',
    items: [
      { id: 'reports',       label: 'Reports',          icon: '📊', desc: 'Comprehensive sales intelligence' },
      { id: 'customReports', label: 'Custom Reporting', icon: '🔧', desc: 'Build & export tailored reports' },
    ]
  },
  {
    id: 'salesLibrary', label: 'Sales Library',
    items: [
      { id: 'salesScript',   label: 'Sales Call Script', icon: '📞', desc: '9-step BD guide · ~12–15 min' },
      { id: 'businessCases', label: 'Business Cases',    icon: '📋', desc: 'Pakistan eligible use cases' },
    ]
  },
  {
    id: 'workspace', label: 'Workspace',
    items: [
      { id: 'takeNotes', label: 'Take Notes', icon: '📝', desc: 'Calendar year diary' },
    ]
  },
]

/* ── Caret ── */
const Caret = ({ open }) => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'transform 0.22s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.55 }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

export default function TopNav({ page, onNav, toggleTheme, colorScheme, isDark, setColorScheme, isMobile }) {
  const { state, dispatch } = useCRM()
  const { currentUser, logout } = useAuth()
  const { leads, opportunities, activities } = state

  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [openGroup, setOpenGroup] = useState(null)
  const [themeOpen, setThemeOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 })

  const navItemsRef = useRef()
  const themeRef = useRef()
  const userRef = useRef()
  const searchRef = useRef()
  const searchInputRef = useRef()

  /* ── Action items badge ── */
  const now = new Date()
  const sevenAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
  const todayStr = now.toISOString().slice(0, 10)
  const actionCount =
    leads.filter(l => !['Converted','Lost'].includes(l.status) && (!l.lastActivityAt || new Date(l.lastActivityAt) < sevenAgo)).length +
    opportunities.filter(o => { if (['Lost','On Hold'].includes(o.stage)) return false; const cur = o.stageHistory?.[o.stageHistory.length-1]; return cur?.enteredAt && new Date(cur.enteredAt) < sevenAgo }).length +
    new Set(activities.filter(a => a.entityType === 'opportunity' && a.nextFollowUpDate?.slice(0,10) === todayStr).map(a => a.entityId)).size

  /* ── Pill position ── */
  const updatePill = useCallback(() => {
    if (!navItemsRef.current) return
    const active = navItemsRef.current.querySelector('[data-active="true"]')
    if (!active) return
    const parent = navItemsRef.current.getBoundingClientRect()
    const rect = active.getBoundingClientRect()
    setPillStyle({ left: rect.left - parent.left, width: rect.width })
  }, [page])

  useEffect(() => { setTimeout(updatePill, 20) }, [page, updatePill])

  /* ── Close on outside click ── */
  useEffect(() => {
    function handler(e) {
      if (themeRef.current && !themeRef.current.contains(e.target)) setThemeOpen(false)
      if (userRef.current  && !userRef.current.contains(e.target))  setUserOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target)) { setSearchOpen(false); setQuery(''); setResults([]) }
      if (!e.target.closest('[data-group]')) setOpenGroup(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  /* ── Search ── */
  function handleSearch(q) {
    setQuery(q)
    if (!q.trim()) { setResults([]); return }
    const lr = state.leads.filter(l => searchFilter(l, q)).slice(0, 4).map(l => ({ type: 'lead', id: l.id, title: l.contactPerson, sub: l.companyName, nav: 'leads' }))
    const or = state.opportunities.filter(o => searchFilter(o, q)).slice(0, 3).map(o => ({ type: 'opportunity', id: o.id, title: o.opportunityName, sub: o.stage, nav: 'opportunities' }))
    setResults([...lr, ...or])
  }

  function navigate(id) {
    onNav(id)
    setMobileMenuOpen(false)
    setOpenGroup(null)
  }

  /* ── All pages for mobile menu ── */
  const allPages = [
    ...FLAT_NAV,
    ...GROUPS.flatMap(g => g.items.map(i => ({ ...i, groupLabel: g.label }))),
  ]

  const isGroupActive = (g) => g.items.some(i => i.id === page)
  const activeScheme = COLOR_SCHEMES.find(s => s.id === colorScheme)

  /* ── Render flat nav item ── */
  function NavBtn({ item }) {
    const active = page === item.id
    return (
      <button data-active={active ? 'true' : 'false'}
        onClick={() => navigate(item.id)}
        style={{
          position: 'relative', zIndex: 1, padding: '8px 14px', border: 'none',
          background: 'transparent', fontFamily: 'var(--font)', fontSize: 13,
          fontWeight: active ? 600 : 500, color: active ? 'var(--so-purple)' : 'var(--text-secondary)',
          cursor: 'pointer', borderRadius: 999, whiteSpace: 'nowrap',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          transition: 'color 0.2s',
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-primary)' }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-secondary)' }}
      >
        {item.label}
        {item.badge && actionCount > 0 && (
          <span style={{
            minWidth: 16, height: 16, borderRadius: 8, background: 'var(--so-gradient)',
            color: '#fff', fontSize: 9, fontWeight: 800,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
          }}>{actionCount}</span>
        )}
      </button>
    )
  }

  return (
    <>
      <header style={{
        height: 58, flexShrink: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 12,
        padding: '0 16px',
        background: 'var(--bg-secondary)',
        borderBottom: '0.5px solid var(--border-color)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>

        {/* ── LEFT: Logo ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
          <StarMark />
          <div style={{ fontFamily: 'var(--font)', fontSize: 17, fontWeight: 600, letterSpacing: '-0.3px', lineHeight: 1, whiteSpace: 'nowrap' }}>
            <span style={{ background: 'linear-gradient(90deg,#4796E3,#9177C7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Sales </span>
            <span style={{ background: 'linear-gradient(90deg,#9177C7,#CA6673)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Orbit</span>
          </div>
        </div>

        {/* ── CENTER: Nav pill (desktop only) ── */}
        {!isMobile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 0,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: 999, padding: '3px', position: 'relative',
            boxShadow: isDark
              ? '0 0 20px -6px rgba(145,119,199,0.3), 0 0 0 1px rgba(145,119,199,0.1)'
              : '0 2px 8px rgba(0,0,0,0.04)',
            backdropFilter: 'blur(12px)',
          }}>
            {/* Animated active pill */}
            <span style={{
              position: 'absolute', top: 3, borderRadius: 999,
              height: 'calc(100% - 6px)',
              background: 'linear-gradient(90deg, var(--so-blue-soft), var(--so-purple-soft))',
              border: '1px solid var(--so-purple-soft)',
              transition: 'left 0.38s cubic-bezier(0.2,0.8,0.2,1), width 0.38s cubic-bezier(0.2,0.8,0.2,1)',
              pointerEvents: 'none', zIndex: 0,
              boxShadow: isDark ? '0 0 12px -2px rgba(145,119,199,0.4)' : 'none',
              ...pillStyle,
            }} />

            {/* Flat nav items */}
            <div ref={navItemsRef} style={{ display: 'flex', alignItems: 'center' }}>
              {FLAT_NAV.map(item => <NavBtn key={item.id} item={item} />)}
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 18, background: 'var(--border-strong-color)', opacity: 0.5, margin: '0 2px' }} />

            {/* Group dropdowns */}
            {GROUPS.map(group => {
              const gActive = isGroupActive(group)
              const isOpen = openGroup === group.id
              return (
                <div key={group.id} data-group={group.id} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setOpenGroup(isOpen ? null : group.id)}
                    style={{
                      position: 'relative', zIndex: 1,
                      padding: '8px 14px', border: 'none', background: 'transparent',
                      fontFamily: 'var(--font)', fontSize: 13,
                      fontWeight: gActive ? 600 : 500,
                      color: gActive ? 'var(--so-purple)' : isOpen ? 'var(--text-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer', borderRadius: 999,
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      transition: 'color 0.2s', whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => { if (!gActive && !isOpen) e.currentTarget.style.color = 'var(--text-primary)' }}
                    onMouseLeave={e => { if (!gActive && !isOpen) e.currentTarget.style.color = 'var(--text-secondary)' }}
                  >
                    {group.label}<Caret open={isOpen} />
                  </button>

                  {/* Dropdown */}
                  {isOpen && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 12px)', left: '50%',
                      transform: 'translateX(-50%)',
                      minWidth: 240, zIndex: 500,
                      background: isDark ? 'rgba(20,20,24,0.88)' : 'rgba(255,255,255,0.88)',
                      backdropFilter: 'blur(28px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.65)'}`,
                      borderRadius: 18, padding: 8,
                      boxShadow: isDark
                        ? '0 24px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(145,119,199,0.15), 0 0 32px -8px rgba(145,119,199,0.4)'
                        : '0 24px 48px rgba(31,38,135,0.15), 0 2px 8px rgba(0,0,0,0.08)',
                      animation: 'fadeUp 0.16s cubic-bezier(0.2,0.8,0.2,1) both',
                    }}>
                      {group.items.map(item => {
                        const active = page === item.id
                        return (
                          <button key={item.id} onClick={() => navigate(item.id)}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                              padding: '10px 12px', borderRadius: 12, border: 'none',
                              background: active ? 'linear-gradient(90deg, var(--so-blue-soft), var(--so-purple-soft))' : 'transparent',
                              cursor: 'pointer', fontFamily: 'var(--font)', transition: 'background 0.15s',
                              textAlign: 'left',
                            }}
                            onMouseEnter={e => { if (!active) e.currentTarget.style.background = isDark ? 'rgba(145,119,199,0.12)' : 'linear-gradient(90deg,var(--so-blue-soft),var(--so-purple-soft))' }}
                            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                          >
                            <span style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, var(--so-blue-soft), var(--so-purple-soft))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: active ? 'var(--so-purple)' : 'var(--text-primary)' }}>{item.label}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>{item.desc}</div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── RIGHT: Controls ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>

          {/* Date — desktop only */}
          {!isMobile && (
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.2px', flexShrink: 0 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          )}

          {/* Search */}
          <div ref={searchRef} style={{ position: 'relative' }}>
            {searchOpen ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 24, border: '1.5px solid var(--so-blue)', background: 'var(--bg-card)', boxShadow: '0 0 0 3px var(--so-blue-soft)', width: isMobile ? 200 : 260 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
                <input ref={searchInputRef} value={query} onChange={e => handleSearch(e.target.value)} placeholder="Search…"
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-primary)' }}
                  onKeyDown={e => e.key === 'Escape' && setSearchOpen(false)}
                />
              </div>
            ) : (
              <button onClick={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 80) }}
                title="Search (⌘K)"
                style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border-strong-color)', background: 'var(--bg-tertiary)', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--so-blue)'; e.currentTarget.style.borderColor = 'var(--so-blue)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-strong-color)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
              </button>
            )}

            {/* Search results */}
            {searchOpen && results.length > 0 && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 320, zIndex: 600,
                background: 'var(--bg-card)', border: '1px solid var(--so-blue)',
                borderRadius: 14, overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(71,150,227,0.18), 0 2px 8px rgba(0,0,0,0.1)',
              }}>
                {results.map(r => (
                  <div key={r.id} onClick={() => { navigate(r.nav); setSearchOpen(false); setQuery(''); setResults([]) }}
                    style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: '0.5px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 10, transition: 'background 140ms ease' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--so-blue-soft)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: 9, fontWeight: 700, color: r.type === 'lead' ? 'var(--so-blue)' : 'var(--so-purple)', background: r.type === 'lead' ? 'var(--so-blue-soft)' : 'var(--so-purple-soft)', padding: '2px 7px', borderRadius: 20, textTransform: 'uppercase', flexShrink: 0, letterSpacing: '0.5px' }}>{r.type}</span>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>{r.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Theme picker */}
          <div ref={themeRef} style={{ position: 'relative' }}>
            <button onClick={() => setThemeOpen(o => !o)} title="Theme"
              style={{ width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${themeOpen ? 'var(--so-blue)' : 'var(--border-strong-color)'}`, background: 'var(--bg-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', position: 'relative' }}>
              <span style={{ width: 13, height: 13, borderRadius: '50%', background: activeScheme?.color || '#4796E3', display: 'block' }} />
            </button>
            {themeOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 600, background: 'var(--bg-card)', border: '1px solid var(--border-strong-color)', borderRadius: 14, padding: 6, minWidth: 170, boxShadow: '0 8px 32px rgba(0,0,0,0.14)', animation: 'fadeUp 0.15s ease both' }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-hint)', padding: '4px 10px 6px' }}>Colour Theme</div>
                {COLOR_SCHEMES.map(s => {
                  const isActive = s.id === colorScheme
                  return (
                    <button key={s.id} onClick={() => { setColorScheme(s.id); setThemeOpen(false) }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 9, border: 'none', background: isActive ? 'var(--so-blue-soft)' : 'transparent', cursor: 'pointer', fontFamily: 'var(--font)', transition: 'background 130ms ease' }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-tertiary)' }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
                      <span style={{ width: 14, height: 14, borderRadius: '50%', background: s.color, flexShrink: 0, boxShadow: isActive ? `0 0 0 2px var(--bg-card), 0 0 0 3.5px ${s.color}` : 'none' }} />
                      <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--so-blue)' : 'var(--text-primary)', flex: 1, textAlign: 'left' }}>{s.label}</span>
                      {isActive && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--so-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </button>
                  )
                })}
                <div style={{ height: '0.5px', background: 'var(--border-color)', margin: '6px 0' }} />
                <button onClick={() => { toggleTheme(); setThemeOpen(false) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 9, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-secondary)', transition: 'background 130ms ease' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ fontSize: 14 }}>{isDark ? '☀' : '☾'}</span>
                  {isDark ? 'Switch to Light' : 'Switch to Dark'}
                </button>
              </div>
            )}
          </div>

          {/* User avatar + logout */}
          <div ref={userRef} style={{ position: 'relative' }}>
            <button onClick={() => setUserOpen(o => !o)} title={currentUser?.name}
              style={{ width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${userOpen ? 'var(--so-blue)' : 'var(--so-blue)'}`, background: 'var(--so-blue-soft)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font)', fontSize: 11, fontWeight: 700, color: 'var(--so-blue)', transition: 'all 0.15s', flexShrink: 0 }}>
              {currentUser?.name?.split(' ').map(n => n[0]).join('') || 'U'}
            </button>
            {userOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 600, background: 'var(--bg-card)', border: '1px solid var(--border-strong-color)', borderRadius: 14, padding: '8px 0', minWidth: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.14)', animation: 'fadeUp 0.15s ease both' }}>
                <div style={{ padding: '8px 14px 10px', borderBottom: '0.5px solid var(--border-color)', marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{currentUser?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{currentUser?.designation || currentUser?.role}</div>
                </div>
                <button onClick={() => { logout(); setUserOpen(false) }}
                  style={{ width: '100%', padding: '8px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, color: '#D93025', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, transition: 'background 130ms' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(217,48,37,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sign out
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          {isMobile && (
            <button onClick={() => setMobileMenuOpen(o => !o)}
              style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border-strong-color)', background: 'var(--bg-tertiary)', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              ☰
            </button>
          )}
        </div>
      </header>

      {/* Mobile drawer */}
      {isMobile && mobileMenuOpen && (
        <>
          <div onClick={() => setMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', animation: 'fadeIn 0.18s ease' }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 201, width: 280, background: 'var(--bg-secondary)', borderLeft: '0.5px solid var(--border-color)', display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.24s cubic-bezier(0.34,1.36,0.64,1)', overflowY: 'auto' }}>
            <div style={{ padding: '16px 16px 8px', borderBottom: '0.5px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ padding: '8px 10px' }}>
              {allPages.map(item => {
                const active = page === item.id
                return (
                  <button key={item.id} onClick={() => navigate(item.id)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: 'none', background: active ? 'linear-gradient(90deg, var(--so-blue-soft), var(--so-purple-soft))' : 'transparent', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, fontWeight: active ? 600 : 400, color: active ? 'var(--so-purple)' : 'var(--text-secondary)', textAlign: 'left', transition: 'all 140ms', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.icon && <span>{item.icon}</span>}
                    {item.label}
                    {item.badge && actionCount > 0 && <span style={{ marginLeft: 'auto', minWidth: 18, height: 18, borderRadius: 9, background: 'var(--so-gradient)', color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{actionCount}</span>}
                    {item.groupLabel && <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--text-hint)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{item.groupLabel}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}
