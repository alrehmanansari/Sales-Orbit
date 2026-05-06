import React from 'react'

export async function copyAsImage(el, filename = 'chart.png') {
  try {
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: null })
    canvas.toBlob(async blob => {
      if (!blob) return
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      } catch {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = filename; a.click()
        URL.revokeObjectURL(url)
      }
    })
  } catch (e) { console.error('Copy image failed:', e) }
}

const COPY_ICON = React.createElement('svg', {
  width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: '2.5',
  strokeLinecap: 'round', strokeLinejoin: 'round',
}, React.createElement('rect', { x: 9, y: 9, width: 13, height: 13, rx: 2 }),
   React.createElement('path', { d: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' }))

export function CopyImgBtn({ targetRef, style: extraStyle = {} }) {
  return React.createElement('button', {
    onClick: e => { e.stopPropagation(); targetRef?.current && copyAsImage(targetRef.current) },
    title: 'Copy as HD image',
    style: {
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 26, height: 26, borderRadius: 7,
      border: '1px solid var(--border-strong-color)',
      background: 'var(--bg-tertiary)', cursor: 'pointer',
      color: 'var(--text-tertiary)', transition: 'all 140ms ease',
      flexShrink: 0, ...extraStyle,
    },
    onMouseEnter: e => {
      e.currentTarget.style.borderColor = 'var(--so-blue)'
      e.currentTarget.style.color = 'var(--so-blue)'
      e.currentTarget.style.background = 'var(--so-blue-soft)'
    },
    onMouseLeave: e => {
      e.currentTarget.style.borderColor = 'var(--border-strong-color)'
      e.currentTarget.style.color = 'var(--text-tertiary)'
      e.currentTarget.style.background = 'var(--bg-tertiary)'
    },
  }, COPY_ICON)
}
