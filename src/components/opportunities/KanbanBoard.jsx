import React, { useState, useRef } from 'react'
import { useCRM } from '../../store/CRMContext'
import { ACTIVE_STAGES, STAGE_COLORS } from '../../data/constants'
import { formatCurrency, daysDiff } from '../../utils/helpers'
import { StageBadge, PriorityBadge } from '../common/Badge'
import StageModal from './StageModal'

export default function KanbanBoard({ onOpenDetail }) {
  const { state, dispatch } = useCRM()
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [stageModal, setStageModal] = useState(null)

  const opps = state.opportunities.filter(o => !['Lost', 'On Hold'].includes(o.stage))

  const columns = ACTIVE_STAGES.map(stage => ({
    stage,
    items: opps.filter(o => o.stage === stage),
    total: opps.filter(o => o.stage === stage).reduce((s, o) => s + (o.expectedMonthlyRevenue || 0), 0)
  }))

  function onDragStart(e, opp) {
    setDragging(opp)
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(e, stage) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(stage)
  }

  function onDrop(e, stage) {
    e.preventDefault()
    setDragOver(null)
    if (!dragging || dragging.stage === stage) { setDragging(null); return }
    setStageModal({ opp: dragging, newStage: stage })
    setDragging(null)
  }

  function onDragEnd() {
    setDragging(null)
    setDragOver(null)
  }

  function handleMove({ newStage, note, lostReason, onHoldReviewDate }) {
    dispatch({ type: 'MOVE_STAGE', payload: { id: stageModal.opp.id, newStage, note, lostReason, onHoldReviewDate } })
    setStageModal(null)
  }

  const STAGE_ACCENT = {
    Prospecting: '#8b5cf6', Won: '#10b981', Onboarded: '#f59e0b', Activated: '#06b6d4'
  }

  return (
    <>
      <div className="kanban-board">
        {columns.map(col => (
          <div
            key={col.stage}
            className="kanban-col"
            onDragOver={e => onDragOver(e, col.stage)}
            onDrop={e => onDrop(e, col.stage)}
            onDragLeave={() => setDragOver(null)}
            style={{ borderTop: `3px solid ${STAGE_ACCENT[col.stage]}`, boxShadow: dragOver === col.stage ? `0 0 0 2px ${STAGE_ACCENT[col.stage]}44` : undefined }}
          >
            <div className="kanban-col-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: STAGE_ACCENT[col.stage], display: 'inline-block' }} />
                <span style={{ color: STAGE_ACCENT[col.stage] }}>{col.stage}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 11, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '1px 7px', color: 'var(--text-muted)' }}>
                  {col.items.length}
                </span>
              </div>
            </div>

            <div style={{ padding: '6px 10px 4px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>MRR: </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(col.total)}</span>
            </div>

            <div className="kanban-col-body">
              {dragOver === col.stage && dragging && dragging.stage !== col.stage && (
                <div className="kanban-drop-zone" style={{ flexShrink: 0 }} />
              )}
              {col.items.length === 0 && dragOver !== col.stage && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '20px 0' }}>Drop here</div>
              )}
              {col.items.map(opp => (
                <KanbanCard
                  key={opp.id}
                  opp={opp}
                  isDragging={dragging?.id === opp.id}
                  onDragStart={e => onDragStart(e, opp)}
                  onDragEnd={onDragEnd}
                  onClick={() => onOpenDetail(opp)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {stageModal && (
        <StageModal
          opportunity={{ ...stageModal.opp, stage: stageModal.newStage }}
          onClose={() => setStageModal(null)}
          onMove={handleMove}
        />
      )}
    </>
  )
}

function KanbanCard({ opp, isDragging, onDragStart, onDragEnd, onClick }) {
  const days = daysDiff(opp.createdAt)
  const isOverdue = opp.expectedCloseDate && new Date(opp.expectedCloseDate) < new Date()

  return (
    <div
      className={`kanban-card ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, flex: 1, marginRight: 8, overflow: 'hidden' }}>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {opp.opportunityName}
          </div>
          {opp.clientId && (
            <div style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 10, marginTop: 2 }}>— {opp.clientId}</div>
          )}
        </div>
        <PriorityBadge priority={opp.priority} />
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {opp.contactPerson}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>
          {formatCurrency(opp.expectedMonthlyRevenue)}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {days}d
        </div>
      </div>

      {opp.vertical && (
        <div style={{ fontSize: 10, color: 'var(--blue)', background: 'rgba(59,130,246,0.1)', borderRadius: 20, padding: '1px 7px', display: 'inline-block', marginBottom: 6 }}>
          {opp.vertical}
        </div>
      )}

      {isOverdue && (
        <div style={{ fontSize: 10, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 3 }}>
          ⚠ Close date passed
        </div>
      )}

      <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border-subtle)', fontSize: 10, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
        <span>{opp.leadOwner?.split(' ')[0]}</span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>{opp.id.slice(-8)}</span>
      </div>
    </div>
  )
}
