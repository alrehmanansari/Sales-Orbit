import { useState, useEffect } from 'react'

const STORAGE_KEY = 'so-theme'

export const COLOR_SCHEMES = [
  { id: 'default', label: 'Default',  color: '#4796E3' },
  { id: 'ocean',   label: 'Ocean',    color: '#0288D1' },
  { id: 'slate',   label: 'Slate',    color: '#546E7A' },
  { id: 'ivory',   label: 'Ivory',    color: '#8B7355' },
  { id: 'sand',    label: 'Sand',     color: '#B8960C' },
  { id: 'taupe',   label: 'Taupe',    color: '#7D6E63' },
]

function parseTheme(raw) {
  if (!raw || raw === 'light') return { scheme: 'default', mode: 'light' }
  if (raw === 'dark') return { scheme: 'default', mode: 'dark' }
  const parts = raw.split('-')
  const mode = parts[parts.length - 1]
  if (mode !== 'light' && mode !== 'dark') return { scheme: 'default', mode: 'light' }
  const scheme = parts.slice(0, -1).join('-')
  return { scheme: scheme || 'default', mode }
}

function buildTheme(scheme, mode) {
  if (scheme === 'default') return mode === 'dark' ? 'dark' : 'light'
  return `${scheme}-${mode}`
}

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEY) || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const { scheme: colorScheme, mode } = parseTheme(theme)
  const isDark = mode === 'dark'

  function toggleTheme() {
    setTheme(t => {
      const { scheme, mode } = parseTheme(t)
      return buildTheme(scheme, mode === 'dark' ? 'light' : 'dark')
    })
  }

  function setColorScheme(scheme) {
    setTheme(t => {
      const { mode } = parseTheme(t)
      return buildTheme(scheme, mode)
    })
  }

  return { theme, toggleTheme, colorScheme, isDark, setColorScheme }
}
