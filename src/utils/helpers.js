export function generateLeadId() {
  const d = new Date()
  const date = d.toISOString().slice(0, 10).replace(/-/g, '')
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return `LD-${date}-${seq}`
}

export function generateOpportunityId() {
  const d = new Date()
  const date = d.toISOString().slice(0, 10).replace(/-/g, '')
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return `OPP-${date}-${seq}`
}

export function generateActivityId() {
  return `ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  })
}

export function formatRelativeTime(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(iso)
}

export function formatCurrency(n) {
  if (n == null || n === '') return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export function daysDiff(from, to) {
  if (!from) return null
  const f = new Date(from)
  const t = to ? new Date(to) : new Date()
  return Math.floor((t - f) / 86400000)
}

export function getDateRange(filter) {
  const now = new Date()
  const start = new Date()
  switch (filter) {
    case 'week':
      start.setDate(now.getDate() - now.getDay())
      start.setHours(0, 0, 0, 0)
      break
    case 'month':
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      break
    case 'quarter':
      start.setMonth(Math.floor(now.getMonth() / 3) * 3, 1)
      start.setHours(0, 0, 0, 0)
      break
    case 'year':
      start.setMonth(0, 1)
      start.setHours(0, 0, 0, 0)
      break
    default:
      return null
  }
  return { start, end: now }
}

export function filterByDateRange(items, field, filter) {
  if (filter === 'all') return items
  const range = getDateRange(filter)
  if (!range) return items
  return items.filter(item => {
    const d = new Date(item[field])
    return d >= range.start && d <= range.end
  })
}

export function exportToCSV(data, filename) {
  if (!data.length) return
  const headers = Object.keys(data[0])
  const rows = data.map(row =>
    headers.map(h => {
      const v = row[h] ?? ''
      const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
      return `"${s.replace(/"/g, '""')}"`
    }).join(',')
  )
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function parseCSV(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const rows = lines.slice(1).map(line => {
    const values = []
    let inQuote = false
    let current = ''
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote }
      else if (ch === ',' && !inQuote) { values.push(current.trim()); current = '' }
      else { current += ch }
    }
    values.push(current.trim())
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
  return { headers, rows }
}

export function getDailyVolume(activities, days = 14) {
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    const next = new Date(d)
    next.setDate(next.getDate() + 1)
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const count = activities.filter(a => {
      const t = new Date(a.dateTime)
      return t >= d && t < next
    }).length
    result.push({ date: label, calls: count })
  }
  return result
}

export function calcSalesVelocity(opps, activities) {
  const won = opps.filter(o => ['Won', 'Onboarded', 'Activated'].includes(o.stage))
  if (!won.length) return null
  const avgDeal = won.reduce((s, o) => s + (o.expectedMonthlyRevenue || 0), 0) / won.length
  const winRate = won.length / opps.filter(o => o.stage !== 'On Hold').length || 0
  const cycles = won.map(o => {
    const acts = activities.filter(a => a.entityId === o.leadId || a.entityId === o.id)
    if (!acts.length) return null
    const firstAct = acts.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))[0]
    const wonStage = o.stageHistory.find(s => s.stage === 'Won')
    if (!wonStage) return null
    return daysDiff(firstAct.dateTime, wonStage.enteredAt)
  }).filter(Boolean)
  const avgCycle = cycles.length ? cycles.reduce((s, v) => s + v, 0) / cycles.length : 0
  if (!avgCycle) return null
  return {
    velocity: (won.length * winRate * avgDeal) / Math.max(avgCycle, 1),
    winRate,
    avgDeal,
    avgCycle
  }
}

export function getStageVelocity(opps) {
  const stages = ['Prospecting', 'Won', 'Onboarded', 'Activated']
  return stages.map(stage => {
    const times = []
    opps.forEach(opp => {
      const entry = opp.stageHistory.find(s => s.stage === stage)
      if (!entry) return
      const idx = opp.stageHistory.indexOf(entry)
      const exitedAt = entry.exitedAt || (opp.stage !== stage ? opp.stageHistory[idx + 1]?.enteredAt : null) || new Date().toISOString()
      const days = daysDiff(entry.enteredAt, exitedAt)
      if (days != null && days >= 0) times.push(days)
    })
    const avg = times.length ? Math.round(times.reduce((s, v) => s + v, 0) / times.length) : 0
    return { stage, avgDays: avg, count: times.length }
  })
}

export function isOverdue(dateStr) {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

export function searchFilter(item, query) {
  if (!query) return true
  const q = query.toLowerCase()
  return Object.values(item).some(v =>
    String(v || '').toLowerCase().includes(q)
  )
}
