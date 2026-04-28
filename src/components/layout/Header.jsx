import React, { useState, useRef, useEffect } from 'react'
import { useCRM } from '../../store/CRMContext'
import { searchFilter } from '../../utils/helpers'

export default function Header({ page, onNav, theme, toggleTheme, isMobile, onMenuToggle }) {
  const { state } = useCRM()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
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
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.2px' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>

        {/* Theme toggle */}
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
          <span style={{ fontSize: 13 }}>{theme === 'dark' ? '☀' : '☾'}</span>
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </div>
    </header>
  )
}
