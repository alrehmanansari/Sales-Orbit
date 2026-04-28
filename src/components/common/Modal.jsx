import React, { useEffect } from 'react'

export function Modal({ children, size = 'md', onClose, title, headerAction }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose?.() }}>
      <div className={`modal modal-${size}`}>
        {title && (
          <div className="modal-header">
            <h3 style={{ margin: 0 }}>{title}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {headerAction}
              <button className="btn-icon" onClick={onClose} style={{ fontSize: 16 }}>✕</button>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export function Drawer({ children, onClose, title, subtitle }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-header">
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{title}</h3>
            {subtitle && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
          </div>
          <button className="btn-icon" onClick={onClose} style={{ fontSize: 16 }}>✕</button>
        </div>
        <div className="drawer-body">{children}</div>
      </div>
    </>
  )
}
