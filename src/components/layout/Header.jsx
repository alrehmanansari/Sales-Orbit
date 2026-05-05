import React, { useState, useRef, useEffect } from 'react'
import { useCRM } from '../../store/CRMContext'
import { searchFilter } from '../../utils/helpers'
import { COLOR_SCHEMES } from '../../hooks/useTheme'

export default function Header({ page, onNav, theme, toggleTheme, colorScheme, isDark, setColorScheme, isMobile, onMenuToggle }) {
  const { state } = useCRM()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const ref = useRef()
  const themeRef = useRef()

  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
      if (themeRef.current && !themeRef.current.contains(e.target)) setThemeOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleSearch(q) {
    setQuery(q)
    if (!q.trim()) { setResults([]); setOpen(false); return }
    const leadResults = state.leads.filter(l => searchFilter(l, q)).slice(0, 4).map(l => ({ type: 'lead', id: l.id, title: l.contactPerson, sub: l.companyName, nav: 'leads' }))
    const oppResults = state.opportunities.filter(o => searchFilter(o, q)).slice(0, 4).map(o => ({ type: 'opportunity', id: o.id, title: o.opportunityName, sub: o.stage, nav: 'opportunities' }))
    setResults([...leadResults, ...oppResults])
    setOpen(true)
  }

  return (
    <header style={{
      height: 'var(--header-h)', background: 'var(--bg-secondary)',
      borderBottom: '0.5px solid var(--border-color)',
      display: 'flex', alignItems: 'center', gap: 16,
      padding: isMobile ? '0 12px' : '0 24px', flexShrink: 0
    }}>
      {/* Hamburger — mobile only */}
      {isMobile && (
        <button
          onClick={onMenuToggle}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-secondary)', fontSize: 20, padding: '4px 8px 4px 0',
            display: 'flex', alignItems: 'center', flexShrink: 0
          }}
          aria-label="Open menu"
        >☰</button>
      )}

      {/* SUNRATE brand mark — desktop only */}
      {!isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 8, borderRight: '0.5px solid var(--border-color)', marginRight: 4 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--so-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 6px rgba(71,150,227,0.3)', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 80 80" fill="none">
              <path d="M40 4 C40 4 41.6 22 47 35 C53 49 68 40 76 40 C68 40 53 31 47 45 C41.6 58 40 76 40 76 C40 76 38.4 58 33 45 C27 31 12 40 4 40 C12 40 27 49 33 35 C38.4 22 40 4 40 4Z" fill="#fff"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '1.2px', background: 'var(--so-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.1 }}>SUNRATE</div>
            <div style={{ fontSize: 8, color: 'var(--text-hint)', letterSpacing: '0.2px', lineHeight: 1.1 }}>Sales CRM</div>
          </div>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Global search */}
      <div ref={ref} style={{ position: 'relative', width: isMobile ? '100%' : 300, maxWidth: isMobile ? 220 : 300 }}>
        <div className="search-wrap">
          <span className="search-icon" style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>⌕</span>
          <input
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search leads, opportunities…"
            style={{
              fontSize: 13, borderRadius: 24, paddingLeft: 38,
              background: 'var(--bg-tertiary)',
              border: '1.5px solid var(--border-strong-color)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 200ms ease'
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--so-blue)'; e.target.style.background = 'var(--bg-card)'; if (query) setOpen(true) }}
            onBlur={e => { e.target.style.borderColor = 'var(--border-strong-color)'; e.target.style.background = 'var(--bg-tertiary)' }}
          />
        </div>
        {open && results.length > 0 && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 500,
            background: 'var(--bg-card)', border: '1px solid var(--so-blue)',
            borderRadius: 14, overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(71,150,227,0.18), 0 2px 8px rgba(0,0,0,0.1)',
            animation: 'fadeUp 0.18s cubic-bezier(0.4,0,0.2,1) both'
          }}>
            {results.map(r => (
              <div key={r.id} onClick={() => { onNav(r.nav); setOpen(false); setQuery('') }}
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
        {open && results.length === 0 && query && (
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 500, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '14px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12, boxShadow: 'var(--shadow)', animation: 'fadeUp 0.18s ease both' }}>
            No results for "<strong>{query}</strong>"
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {!isMobile && (
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.2px' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        )}

        {/* Theme picker — shows active theme, dropdown for the rest */}
        <div ref={themeRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setThemeOpen(o => !o)}
            title="Change theme"
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '5px 11px 5px 8px', borderRadius: 24,
              background: 'var(--bg-tertiary)',
              border: `1.5px solid ${themeOpen ? 'var(--so-blue)' : 'var(--border-strong-color)'}`,
              cursor: 'pointer', transition: 'all 180ms ease',
              boxShadow: 'var(--shadow-xs)',
            }}
            onMouseEnter={e => { if (!themeOpen) e.currentTarget.style.borderColor = 'var(--so-blue)' }}
            onMouseLeave={e => { if (!themeOpen) e.currentTarget.style.borderColor = 'var(--border-strong-color)' }}
          >
            {/* Active colour dot */}
            <span style={{
              width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
              background: COLOR_SCHEMES.find(s => s.id === colorScheme)?.color ?? '#4796E3',
              boxShadow: `0 0 0 2px ${COLOR_SCHEMES.find(s => s.id === colorScheme)?.color ?? '#4796E3'}30`,
            }} />
            {!isMobile && (
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', fontFamily: 'var(--font)' }}>
                {COLOR_SCHEMES.find(s => s.id === colorScheme)?.label ?? 'Theme'}
              </span>
            )}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transition: 'transform 180ms ease', transform: themeOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {themeOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 600,
              background: 'var(--bg-card)', border: '1px solid var(--border-strong-color)',
              borderRadius: 14, padding: '6px', minWidth: 170,
              boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
              animation: 'fadeUp 0.15s cubic-bezier(0.4,0,0.2,1) both',
            }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-hint)', padding: '4px 10px 6px' }}>
                Colour Theme
              </div>
              {COLOR_SCHEMES.map(s => {
                const isActive = s.id === colorScheme
                return (
                  <button key={s.id} onClick={() => { setColorScheme(s.id); setThemeOpen(false) }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '7px 10px', borderRadius: 9, border: 'none',
                      background: isActive ? 'var(--so-blue-soft)' : 'transparent',
                      cursor: 'pointer', fontFamily: 'var(--font)',
                      transition: 'background 130ms ease',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-tertiary)' }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                  >
                    <span style={{
                      width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                      background: s.color,
                      boxShadow: isActive ? `0 0 0 2px var(--bg-card), 0 0 0 3.5px ${s.color}` : 'none',
                    }} />
                    <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--so-blue)' : 'var(--text-primary)', flex: 1, textAlign: 'left' }}>
                      {s.label}
                    </span>
                    {isActive && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--so-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Light / Dark toggle */}
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 13px', borderRadius: 24,
            background: 'var(--bg-tertiary)',
            border: '1.5px solid var(--border-strong-color)',
            cursor: 'pointer', fontSize: 12, fontWeight: 500,
            color: 'var(--text-secondary)', fontFamily: 'var(--font)',
            transition: 'all 180ms ease',
            boxShadow: 'var(--shadow-xs)'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--so-blue)'; e.currentTarget.style.color = 'var(--so-blue)'; e.currentTarget.style.background = 'var(--so-blue-soft)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-tertiary)' }}
        >
          <span style={{ fontSize: 13 }}>{isDark ? '☀' : '☾'}</span>
          {!isMobile && <span>{isDark ? 'Light' : 'Dark'}</span>}
        </button>
      </div>
    </header>
  )
}
