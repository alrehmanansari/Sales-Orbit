import React, { useState, useEffect, useCallback } from 'react'
import { useCRM } from '../store/CRMContext'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function formatDisplayDate(key) {
  if (!key) return ''
  const [y, m, d] = key.split('-')
  const date = new Date(+y, +m - 1, +d)
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year, month) {
  // Monday = 0
  const dow = new Date(year, month, 1).getDay()
  return dow === 0 ? 6 : dow - 1
}

function MonthGrid({ year, month, notes, selectedDate, onSelect, today }) {
  const totalDays = getDaysInMonth(year, month)
  const startOffset = getFirstDayOfWeek(year, month)
  const cells = []

  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(d)

  const todayKey = today
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.1px' }}>
        {MONTH_NAMES[month]}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {DAY_LABELS.map(d => (
          <div key={d} style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-tertiary)', textAlign: 'center', letterSpacing: '0.5px', paddingBottom: 4 }}>
            {d}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const key = dateKey(year, month, day)
          const hasNote = !!notes[key]
          const isSelected = key === selectedDate
          const isToday = key === todayKey
          const isWeekend = ((i) % 7) >= 5

          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              style={{
                width: '100%', aspectRatio: '1', minHeight: 28,
                borderRadius: 6, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font)', fontSize: 11, fontWeight: isToday ? 700 : 500,
                position: 'relative',
                background: isSelected
                  ? 'var(--so-blue)'
                  : isToday
                    ? 'var(--so-blue-soft)'
                    : 'transparent',
                color: isSelected
                  ? '#fff'
                  : isToday
                    ? 'var(--so-blue)'
                    : isWeekend
                      ? 'var(--text-tertiary)'
                      : 'var(--text-secondary)',
                outline: isToday && !isSelected ? '1.5px solid var(--so-blue)' : 'none',
                transition: 'all 140ms ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--so-blue-soft)' }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? 'var(--so-blue-soft)' : 'transparent' }}
            >
              {day}
              {hasNote && (
                <span style={{
                  position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)',
                  width: 4, height: 4, borderRadius: '50%',
                  background: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--so-purple)',
                }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function TakeNotesPage() {
  const { state } = useCRM()
  const user = state.currentUser
  const [year, setYear] = useState(new Date().getFullYear())
  const [notes, setNotes] = useState({})
  const [selectedDate, setSelectedDate] = useState(() => {
    const t = new Date()
    return dateKey(t.getFullYear(), t.getMonth(), t.getDate())
  })
  const [draft, setDraft] = useState('')
  const [saved, setSaved] = useState(false)

  const storageKey = `so_diary_${user?.email || 'default'}_${year}`

  const todayKey = (() => {
    const t = new Date()
    return dateKey(t.getFullYear(), t.getMonth(), t.getDate())
  })()

  // Load notes for the current year
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      setNotes(raw ? JSON.parse(raw) : {})
    } catch {
      setNotes({})
    }
  }, [storageKey])

  // Sync draft to selected date
  useEffect(() => {
    setDraft(notes[selectedDate] || '')
    setSaved(false)
  }, [selectedDate, notes])

  function selectDate(key) {
    setSelectedDate(key)
  }

  function saveNote() {
    const updated = { ...notes }
    const text = draft.trim()
    if (text) {
      updated[selectedDate] = text
    } else {
      delete updated[selectedDate]
    }
    setNotes(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function clearNote() {
    const updated = { ...notes }
    delete updated[selectedDate]
    setNotes(updated)
    setDraft('')
    localStorage.setItem(storageKey, JSON.stringify(updated))
  }

  const noteCount = Object.keys(notes).length

  return (
    <div className="page">
      {/* ── Page header ── */}
      <div className="page-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Take Notes</h2>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
            Personal Diary — {noteCount > 0 ? `${noteCount} entr${noteCount === 1 ? 'y' : 'ies'}` : 'No entries yet'} · {year}
          </div>
        </div>

        {/* Year navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => setYear(y => y - 1)}
            style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border-strong-color)', background: 'var(--bg-card)', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'all 150ms ease' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--so-blue)'; e.currentTarget.style.color = 'var(--so-blue)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong-color)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >‹</button>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', minWidth: 48, textAlign: 'center', letterSpacing: '-0.3px' }}>{year}</div>
          <button
            onClick={() => setYear(y => y + 1)}
            style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border-strong-color)', background: 'var(--bg-card)', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'all 150ms ease' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--so-blue)'; e.currentTarget.style.color = 'var(--so-blue)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong-color)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >›</button>

          <button
            onClick={() => { setYear(new Date().getFullYear()); selectDate(todayKey) }}
            style={{ marginLeft: 4, padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border-strong-color)', background: 'var(--bg-card)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', transition: 'all 150ms ease' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--so-blue)'; e.currentTarget.style.color = 'var(--so-blue)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong-color)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >Today</button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="page-body" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', minHeight: 0 }}>

          {/* ── Left: Calendar year grid ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {MONTH_NAMES.map((_, mi) => (
                <div key={mi} style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 12, padding: '14px 12px',
                  boxShadow: 'var(--shadow-xs)',
                  transition: 'box-shadow 200ms ease',
                }}>
                  <MonthGrid
                    year={year}
                    month={mi}
                    notes={notes}
                    selectedDate={selectedDate}
                    onSelect={selectDate}
                    today={todayKey}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Note editor ── */}
          <div style={{ width: 300, flexShrink: 0, position: 'sticky', top: 0 }}>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 14, overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}>
              {/* Editor header */}
              <div style={{
                padding: '14px 16px 12px',
                borderBottom: '1px solid var(--border-color)',
                background: 'linear-gradient(135deg, rgba(71,150,227,0.06), rgba(145,119,199,0.04))',
              }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '1.4px', textTransform: 'uppercase', background: 'var(--so-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 4 }}>
                  Daily Note
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  {formatDisplayDate(selectedDate)}
                </div>
                {notes[selectedDate] && (
                  <div style={{ fontSize: 10, color: 'var(--so-purple)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--so-purple)', display: 'inline-block' }} />
                    Note saved
                  </div>
                )}
              </div>

              {/* Textarea */}
              <div style={{ padding: '14px 16px' }}>
                <textarea
                  value={draft}
                  onChange={e => { setDraft(e.target.value); setSaved(false) }}
                  placeholder={`Write your note for ${MONTH_NAMES[selectedDate ? parseInt(selectedDate.split('-')[1]) - 1 : 0]}…\n\nIdeas, observations, meeting notes, personal reminders…`}
                  style={{
                    width: '100%', minHeight: 220, resize: 'vertical',
                    fontSize: 13, lineHeight: 1.75,
                    border: '1.5px solid var(--border-strong-color)',
                    borderRadius: 10, padding: '12px 14px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font)',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-hint)' }}>{draft.length} chars</span>
                  {saved && <span style={{ fontSize: 10, color: '#1E8E3E', fontWeight: 600 }}>Saved</span>}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={clearNote}
                    disabled={!draft && !notes[selectedDate]}
                    className="btn btn-ghost btn-sm"
                    style={{ flex: 1 }}
                  >Clear</button>
                  <button
                    onClick={saveNote}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 2 }}
                  >Save Note</button>
                </div>
              </div>

              {/* Entry summary */}
              {noteCount > 0 && (
                <div style={{ padding: '10px 16px 14px', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                    Recent Entries
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 140, overflowY: 'auto' }}>
                    {Object.entries(notes)
                      .sort((a, b) => b[0].localeCompare(a[0]))
                      .slice(0, 5)
                      .map(([key, text]) => (
                        <div
                          key={key}
                          onClick={() => selectDate(key)}
                          style={{
                            padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
                            border: `1px solid ${key === selectedDate ? 'var(--so-blue)' : 'var(--border-color)'}`,
                            background: key === selectedDate ? 'var(--so-blue-soft)' : 'var(--bg-tertiary)',
                            transition: 'all 140ms ease',
                          }}
                        >
                          <div style={{ fontSize: 10, fontWeight: 700, color: key === selectedDate ? 'var(--so-blue)' : 'var(--text-secondary)', marginBottom: 2 }}>
                            {new Date(key + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {text}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
