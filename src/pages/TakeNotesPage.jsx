import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useCRM } from '../store/CRMContext'
import { formatCurrency } from '../utils/helpers'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]
const DAY_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function pad(n) { return String(n).padStart(2,'0') }
function toKey(y, m, d) { return `${y}-${pad(m+1)}-${pad(d)}` }
function todayKey() {
  const t = new Date()
  return toKey(t.getFullYear(), t.getMonth(), t.getDate())
}
function parseKey(key) {
  const [y,m,d] = key.split('-').map(Number)
  return new Date(y, m-1, d)
}
function formatLong(key) {
  return parseKey(key).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })
}
function daysInMonth(y,m) { return new Date(y,m+1,0).getDate() }
function firstDow(y,m) { const d = new Date(y,m,1).getDay(); return d===0?6:d-1 }

/* ── Mini calendar for the sidebar ── */
function MiniCalendar({ year, month, notes, selected, onSelect, onChangeMonth }) {
  const total = daysInMonth(year, month)
  const offset = firstDow(year, month)
  const cells = Array(offset).fill(null)
  for (let d=1;d<=total;d++) cells.push(d)
  const today = todayKey()

  return (
    <div>
      {/* Month nav */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <button onClick={()=>onChangeMonth(-1)} style={navBtn}>‹</button>
        <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>
          {MONTH_NAMES[month]} {year}
        </span>
        <button onClick={()=>onChangeMonth(1)} style={navBtn}>›</button>
      </div>

      {/* Day labels */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:1, marginBottom:3 }}>
        {DAY_SHORT.map(d=>(
          <div key={d} style={{ fontSize:9, fontWeight:700, color:'var(--text-hint)', textAlign:'center', padding:'2px 0', letterSpacing:'0.3px' }}>
            {d[0]}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
        {cells.map((day,i) => {
          if (!day) return <div key={`e${i}`} />
          const key = toKey(year, month, day)
          const isSel = key === selected
          const isToday = key === today
          const hasNote = !!notes[key]
          return (
            <button key={key} onClick={()=>onSelect(key)} style={{
              border:'none', borderRadius:6, cursor:'pointer',
              fontFamily:'var(--font)', fontSize:11, fontWeight: isToday?700:500,
              padding:'5px 0', position:'relative', transition:'all 130ms ease',
              background: isSel ? 'var(--so-blue)' : isToday ? 'var(--so-blue-soft)' : 'transparent',
              color: isSel ? '#fff' : isToday ? 'var(--so-blue)' : 'var(--text-secondary)',
              outline: isToday && !isSel ? '1.5px solid var(--so-blue)' : 'none',
              outlineOffset: -1,
            }}
              onMouseEnter={e=>{ if(!isSel) e.currentTarget.style.background='var(--so-blue-soft)' }}
              onMouseLeave={e=>{ if(!isSel) e.currentTarget.style.background= isToday?'var(--so-blue-soft)':'transparent' }}
            >
              {day}
              {hasNote && (
                <span style={{
                  position:'absolute', bottom:2, left:'50%', transform:'translateX(-50%)',
                  width:3, height:3, borderRadius:'50%',
                  background: isSel ? 'rgba(255,255,255,0.8)' : 'var(--so-purple)',
                  display:'block',
                }}/>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const navBtn = {
  width:24, height:24, borderRadius:6, border:'1px solid var(--border-strong-color)',
  background:'var(--bg-card)', cursor:'pointer', display:'flex', alignItems:'center',
  justifyContent:'center', fontSize:14, color:'var(--text-secondary)', transition:'all 130ms ease',
}

/* ── Rich text toolbar button ── */
function TB({ title, label, onCmd, active }) {
  return (
    <button
      title={title}
      onMouseDown={e => { e.preventDefault(); onCmd() }}
      style={{
        width:28, height:28, border:'none', borderRadius:5, cursor:'pointer',
        fontFamily:'var(--font)', fontSize: typeof label==='string' && label.length===1 ? 13 : 11,
        fontWeight:600, transition:'all 120ms ease',
        background: active ? 'var(--so-blue-soft)' : 'transparent',
        color: active ? 'var(--so-blue)' : 'var(--text-secondary)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}
      onMouseEnter={e=>{ if(!active) { e.currentTarget.style.background='var(--bg-tertiary)'; e.currentTarget.style.color='var(--text-primary)' }}}
      onMouseLeave={e=>{ if(!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-secondary)' }}}
    >{label}</button>
  )
}

/* ── Notebook-lines background ── */
const notebookBg = {
  backgroundImage: `repeating-linear-gradient(
    transparent, transparent calc(1.8em - 1px),
    rgba(125,110,99,0.07) calc(1.8em - 1px),
    rgba(125,110,99,0.07) 1.8em
  )`,
  backgroundAttachment: 'local',
}

export default function TakeNotesPage() {
  const { state } = useCRM()
  const user = state.currentUser
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth())
  const [calYear, setCalYear] = useState(() => new Date().getFullYear())
  const [selected, setSelected] = useState(() => todayKey())
  const [notes, setNotes] = useState({})
  const [savedAt, setSavedAt] = useState(null)
  const editorRef = useRef(null)
  const saveTimer = useRef(null)

  const storageKey = `so_diary_${user?.email||'default'}_${year}`

  /* Load notes on year change */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      setNotes(raw ? JSON.parse(raw) : {})
    } catch { setNotes({}) }
  }, [storageKey])

  /* Sync editor when selected date changes */
  useEffect(() => {
    if (!editorRef.current) return
    editorRef.current.innerHTML = notes[selected] || ''
    editorRef.current.focus()
    setSavedAt(null)
  }, [selected]) // eslint-disable-line

  /* Debounced auto-save */
  const autosave = useCallback(() => {
    if (!editorRef.current) return
    const html = editorRef.current.innerHTML
    const isEmpty = !html || html.replace(/<[^>]*>/g,'').trim() === ''
    setNotes(prev => {
      const next = { ...prev }
      if (isEmpty) delete next[selected]
      else next[selected] = html
      localStorage.setItem(storageKey, JSON.stringify(next))
      return next
    })
    setSavedAt(new Date())
  }, [selected, storageKey])

  function handleInput() {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(autosave, 600)
  }

  function selectDate(key) {
    clearTimeout(saveTimer.current)
    autosave()
    // Year jump if needed
    const [y] = key.split('-').map(Number)
    if (y !== year) setYear(y)
    setSelected(key)
  }

  function deleteNote() {
    if (!editorRef.current) return
    editorRef.current.innerHTML = ''
    setNotes(prev => {
      const next = { ...prev }
      delete next[selected]
      localStorage.setItem(storageKey, JSON.stringify(next))
      return next
    })
    setSavedAt(null)
  }

  function changeCalMonth(dir) {
    setCalMonth(m => {
      let nm = m + dir
      if (nm < 0) { setCalYear(y=>y-1); return 11 }
      if (nm > 11) { setCalYear(y=>y+1); return 0 }
      return nm
    })
  }

  function exec(cmd, val=null) {
    document.execCommand(cmd, false, val)
    editorRef.current?.focus()
    handleInput()
  }

  /* Check current format state */
  function fmt(cmd) {
    try { return document.queryCommandState(cmd) } catch { return false }
  }

  const noteCount = Object.keys(notes).length
  const selHasNote = !!notes[selected]

  /* Sorted entries for the list */
  const allEntries = Object.entries(notes).sort((a,b) => b[0].localeCompare(a[0]))

  /* ── @ mention ── */
  const [mention, setMention] = useState({ open: false, query: '', results: [], rect: null })
  const allLeads = state.leads || []
  const allOpps  = state.opportunities || []

  function handleEditorKeyUp(e) {
    const sel = window.getSelection()
    if (!sel.rangeCount) return
    const range = sel.getRangeAt(0)
    const text  = range.startContainer.textContent || ''
    const caret = range.startOffset
    const before = text.slice(0, caret)
    const atIdx = before.lastIndexOf('@')
    if (atIdx === -1) { setMention(m => ({ ...m, open: false })); return }
    const query = before.slice(atIdx + 1)
    if (query.length > 30 || query.includes(' ')) { setMention(m => ({ ...m, open: false })); return }

    const q = query.toLowerCase()
    const results = allLeads
      .filter(l => l.companyName?.toLowerCase().includes(q) || l.contactPerson?.toLowerCase().includes(q))
      .slice(0, 6)

    if (!results.length && query.length > 0) { setMention(m => ({ ...m, open: false })); return }

    // Position dropdown below caret
    const r = range.getClientRects()[0] || editorRef.current.getBoundingClientRect()
    const editorBox = editorRef.current.getBoundingClientRect()
    setMention({ open: results.length > 0 || query.length === 0, query, results, rect: { top: r.bottom - editorBox.top + 4, left: r.left - editorBox.left } })
  }

  function insertMention(lead) {
    // Find and delete the @query text
    const sel = window.getSelection()
    if (!sel.rangeCount) return
    const range = sel.getRangeAt(0)
    const caret = range.startOffset
    const node  = range.startContainer
    const text  = node.textContent || ''
    const atIdx = text.slice(0, caret).lastIndexOf('@')

    // Delete @query
    const deleteRange = document.createRange()
    deleteRange.setStart(node, atIdx)
    deleteRange.setEnd(node, caret)
    deleteRange.deleteContents()

    // Get matched opportunity for vol/TC
    const opp = allOpps.find(o => o.companyName === lead.companyName) ||
                allOpps.find(o => o.leadId === lead.id)
    const vol = opp ? formatCurrency(opp.expectedMonthlyVolume) : '—'
    const tc  = opp ? formatCurrency(opp.expectedMonthlyRevenue) : '—'

    // Insert formatted mention block
    const info = `📌 ${lead.companyName} · ${lead.contactPerson || '—'} · ${lead.email || '—'} · ${lead.phone || '—'} · Vol: ${vol} · TC: ${tc}`
    document.execCommand('insertHTML', false,
      `<span style="background:var(--so-blue-soft);color:var(--so-blue);border-radius:5px;padding:2px 7px;font-size:12px;font-weight:600;white-space:nowrap" contenteditable="false">${info}</span>&nbsp;`
    )
    setMention({ open: false, query: '', results: [], rect: null })
    editorRef.current?.focus()
    handleInput()
  }

  return (
    <div className="page">
      {/* ── Page header ── */}
      <div className="page-header" style={{ gap:12, flexWrap:'wrap' }}>
        <div>
          <h2 style={{ margin:0 }}>Take Notes</h2>
          <div style={{ fontSize:11, color:'var(--text-tertiary)', marginTop:2 }}>
            Personal Diary · {noteCount > 0 ? `${noteCount} entr${noteCount===1?'y':'ies'}` : 'No entries yet'} · {year}
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={()=>{ const t=todayKey(); const [y]=t.split('-').map(Number); setYear(y); setCalYear(y); setCalMonth(new Date().getMonth()); selectDate(t) }}
            style={{ padding:'5px 14px', borderRadius:20, border:'1px solid var(--border-strong-color)', background:'var(--bg-card)', cursor:'pointer', fontFamily:'var(--font)', fontSize:12, fontWeight:600, color:'var(--text-secondary)', transition:'all 140ms' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--so-blue)';e.currentTarget.style.color='var(--so-blue)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-strong-color)';e.currentTarget.style.color='var(--text-secondary)'}}
          >Today</button>

          <div style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:20, border:'1px solid var(--border-strong-color)', background:'var(--bg-card)' }}>
            <button onClick={()=>setYear(y=>y-1)} style={{ ...navBtn, border:'none', background:'transparent', width:20, height:20 }}>‹</button>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', minWidth:36, textAlign:'center' }}>{year}</span>
            <button onClick={()=>setYear(y=>y+1)} style={{ ...navBtn, border:'none', background:'transparent', width:20, height:20 }}>›</button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="page-body" style={{ padding:0, display:'flex', minHeight:0, height:'100%' }}>

        {/* ── LEFT SIDEBAR ── */}
        <div style={{
          width:260, flexShrink:0, display:'flex', flexDirection:'column',
          borderRight:'1px solid var(--border-color)',
          background:'var(--bg-secondary)',
          overflowY:'auto',
        }}>
          {/* Mini calendar */}
          <div style={{ padding:'16px 14px 12px', borderBottom:'1px solid var(--border-color)' }}>
            <MiniCalendar
              year={calYear} month={calMonth}
              notes={notes} selected={selected}
              onSelect={selectDate}
              onChangeMonth={changeCalMonth}
            />
          </div>

          {/* All notes list */}
          <div style={{ flex:1, padding:'12px 10px', overflowY:'auto' }}>
            {allEntries.length === 0 ? (
              <div style={{ fontSize:11, color:'var(--text-hint)', textAlign:'center', padding:'20px 0', lineHeight:1.6 }}>
                No notes yet.<br/>Click a date to start writing.
              </div>
            ) : (
              <>
                <div style={{ fontSize:9, fontWeight:700, letterSpacing:'1.2px', textTransform:'uppercase', color:'var(--text-hint)', marginBottom:8, paddingLeft:4 }}>
                  All Entries
                </div>
                {allEntries.map(([key, html]) => {
                  const isSel = key === selected
                  const preview = html.replace(/<[^>]*>/g,'').trim().slice(0,60)
                  const d = parseKey(key)
                  const label = d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
                  return (
                    <div key={key} onClick={()=>selectDate(key)}
                      style={{
                        padding:'9px 10px', borderRadius:9, cursor:'pointer', marginBottom:4,
                        border:`1.5px solid ${isSel?'var(--so-blue)':'transparent'}`,
                        background: isSel ? 'var(--so-blue-soft)' : 'var(--bg-card)',
                        boxShadow: isSel ? 'none' : 'var(--shadow-xs)',
                        transition:'all 130ms ease',
                      }}
                      onMouseEnter={e=>{ if(!isSel) e.currentTarget.style.background='var(--bg-tertiary)' }}
                      onMouseLeave={e=>{ if(!isSel) e.currentTarget.style.background='var(--bg-card)' }}
                    >
                      <div style={{ fontSize:11, fontWeight:700, color: isSel?'var(--so-blue)':'var(--text-primary)', marginBottom:2 }}>{label}</div>
                      <div style={{ fontSize:10, color:'var(--text-tertiary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.4 }}>
                        {preview || '(empty)'}
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>

        {/* ── MAIN: Notebook page ── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--bg-primary)' }}>

          {/* Date header */}
          <div style={{
            padding:'16px 28px 14px',
            borderBottom:'1px solid var(--border-color)',
            background:'var(--bg-secondary)',
            flexShrink:0,
          }}>
            <div style={{ fontSize:9, fontWeight:800, letterSpacing:'1.4px', textTransform:'uppercase', background:'var(--so-gradient)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', marginBottom:4 }}>
              Daily Note — {year}
            </div>
            <div style={{ fontSize:20, fontWeight:700, color:'var(--text-primary)', letterSpacing:'-0.4px', lineHeight:1.2 }}>
              {formatLong(selected)}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:6 }}>
              {savedAt && (
                <span style={{ fontSize:10, color:'var(--text-tertiary)' }}>
                  Saved {savedAt.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true})}
                </span>
              )}
              {selHasNote && !savedAt && (
                <span style={{ fontSize:10, color:'var(--so-purple)', display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--so-purple)', display:'inline-block' }}/>
                  Has note
                </span>
              )}
            </div>
          </div>

          {/* Toolbar */}
          <div style={{
            display:'flex', alignItems:'center', gap:1, flexWrap:'wrap',
            padding:'8px 16px', borderBottom:'1px solid var(--border-color)',
            background:'var(--bg-secondary)', flexShrink:0,
          }}>
            <TB title="Bold" label={<b>B</b>} onCmd={()=>exec('bold')} active={fmt('bold')} />
            <TB title="Italic" label={<i>I</i>} onCmd={()=>exec('italic')} active={fmt('italic')} />
            <TB title="Underline" label={<u>U</u>} onCmd={()=>exec('underline')} active={fmt('underline')} />
            <TB title="Strikethrough" label={<s>S</s>} onCmd={()=>exec('strikeThrough')} active={fmt('strikeThrough')} />
            <div style={{ width:1, height:18, background:'var(--border-strong-color)', margin:'0 4px' }}/>
            <TB title="Heading 1" label="H1" onCmd={()=>exec('formatBlock','H1')} />
            <TB title="Heading 2" label="H2" onCmd={()=>exec('formatBlock','H2')} />
            <TB title="Normal text" label="¶" onCmd={()=>exec('formatBlock','P')} />
            <div style={{ width:1, height:18, background:'var(--border-strong-color)', margin:'0 4px' }}/>
            <TB title="Bullet list" label="•" onCmd={()=>exec('insertUnorderedList')} active={fmt('insertUnorderedList')} />
            <TB title="Numbered list" label="1." onCmd={()=>exec('insertOrderedList')} active={fmt('insertOrderedList')} />
            <TB title="Indent" label="→" onCmd={()=>exec('indent')} />
            <TB title="Outdent" label="←" onCmd={()=>exec('outdent')} />
            <div style={{ width:1, height:18, background:'var(--border-strong-color)', margin:'0 4px' }}/>
            <TB title="Align left" label={
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><rect x="0" y="1" width="16" height="2"/><rect x="0" y="5" width="12" height="2"/><rect x="0" y="9" width="16" height="2"/><rect x="0" y="13" width="10" height="2"/></svg>
            } onCmd={()=>exec('justifyLeft')} />
            <TB title="Center" label={
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><rect x="0" y="1" width="16" height="2"/><rect x="2" y="5" width="12" height="2"/><rect x="0" y="9" width="16" height="2"/><rect x="3" y="13" width="10" height="2"/></svg>
            } onCmd={()=>exec('justifyCenter')} />
            <TB title="Align right" label={
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><rect x="0" y="1" width="16" height="2"/><rect x="4" y="5" width="12" height="2"/><rect x="0" y="9" width="16" height="2"/><rect x="6" y="13" width="10" height="2"/></svg>
            } onCmd={()=>exec('justifyRight')} />
            <div style={{ flex:1 }}/>
            {selHasNote && (
              <button onClick={deleteNote}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 12px', borderRadius:18, border:'1.5px solid rgba(217,48,37,0.3)', background:'rgba(217,48,37,0.06)', cursor:'pointer', fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'#D93025', transition:'all 140ms ease' }}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(217,48,37,0.12)';e.currentTarget.style.borderColor='rgba(217,48,37,0.5)'}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(217,48,37,0.06)';e.currentTarget.style.borderColor='rgba(217,48,37,0.3)'}}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
                Delete Note
              </button>
            )}
          </div>

          {/* Notebook writing area */}
          <div style={{ flex:1, overflowY:'auto', padding:'24px 40px', position: 'relative' }}>
            {/* @ mention dropdown */}
            {mention.open && mention.results.length > 0 && mention.rect && (
              <div style={{
                position: 'absolute', zIndex: 50,
                top: mention.rect.top + 24, left: Math.max(0, mention.rect.left),
                background: 'var(--bg-card)', border: '1px solid var(--so-blue)',
                borderRadius: 12, overflow: 'hidden',
                boxShadow: '0 8px 28px rgba(71,150,227,0.18)', minWidth: 280,
              }}>
                <div style={{ padding: '6px 12px 4px', fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-hint)', borderBottom: '0.5px solid var(--border-color)' }}>
                  Client — type to filter
                </div>
                {mention.results.map(lead => {
                  const opp = allOpps.find(o => o.companyName === lead.companyName)
                  return (
                    <div key={lead.id} onMouseDown={e => { e.preventDefault(); insertMention(lead) }}
                      style={{ padding: '9px 12px', cursor: 'pointer', borderBottom: '0.5px solid var(--border-color)', transition: 'background 130ms' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--so-blue-soft)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{lead.companyName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span>{lead.contactPerson || '—'}</span>
                        {lead.phone && <span style={{ color: '#25D366' }}>{lead.phone}</span>}
                        {opp && <span style={{ color: 'var(--so-blue)' }}>Vol: {formatCurrency(opp.expectedMonthlyVolume)}</span>}
                        {opp && <span style={{ color: 'var(--green)' }}>TC: {formatCurrency(opp.expectedMonthlyRevenue)}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              onKeyUp={handleEditorKeyUp}
              onKeyDown={e => {
                if (e.key === 'Escape') { setMention(m => ({ ...m, open: false })); return }
                if (e.key === 'Tab') { e.preventDefault(); exec('insertHTML','&nbsp;&nbsp;&nbsp;&nbsp;') }
              }}
              style={{
                minHeight:'calc(100vh - 280px)',
                outline:'none',
                fontFamily:'var(--font)',
                fontSize:15,
                lineHeight:'1.8em',
                color:'var(--text-primary)',
                caretColor:'var(--so-blue)',
                ...notebookBg,
              }}
              data-placeholder={`Start writing your note for ${formatLong(selected)}…`}
            />
            <style>{`
              [contenteditable]:empty:before {
                content: attr(data-placeholder);
                color: var(--text-hint);
                pointer-events: none;
                display: block;
              }
              [contenteditable] h1 {
                font-size: 22px; font-weight: 700; color: var(--text-primary);
                margin: 0.8em 0 0.3em; letter-spacing: -0.4px;
              }
              [contenteditable] h2 {
                font-size: 17px; font-weight: 700; color: var(--text-primary);
                margin: 0.6em 0 0.2em;
              }
              [contenteditable] ul, [contenteditable] ol {
                padding-left: 24px; margin: 4px 0;
              }
              [contenteditable] li { margin: 2px 0; }
              [contenteditable] p { margin: 0; }
            `}</style>
          </div>
        </div>
      </div>
    </div>
  )
}
