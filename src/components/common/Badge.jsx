import React from 'react'
import { PRIORITY_BADGE, STATUS_BADGE, STAGE_BADGE, OUTCOME_COLORS } from '../../data/constants'

export function PriorityBadge({ priority }) {
  const cls = PRIORITY_BADGE[priority] || 'badge-neutral'
  return <span className={`badge ${cls}`}>{priority}</span>
}

export function StatusBadge({ status }) {
  const cls = STATUS_BADGE[status] || 'badge-neutral'
  return <span className={`badge ${cls}`}>{status}</span>
}

export function StageBadge({ stage }) {
  const cls = STAGE_BADGE[stage] || 'badge-neutral'
  return <span className={`badge ${cls}`}>{stage}</span>
}

export function OutcomeBadge({ outcome }) {
  const cls = OUTCOME_COLORS[outcome] || 'badge-neutral'
  return <span className={`badge ${cls}`} style={{ fontSize: 10, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>{outcome}</span>
}
