import React, { createContext, useContext, useState, useEffect } from 'react'
import { TEAM_MEMBERS } from '../data/constants'

const KPIContext = createContext(null)
const KPI_KEY = 'salesorbit_kpis_v3'

export const QUARTERS = ['Q2', 'Q3', 'Q4']
export const KPI_WEIGHTS = { tc: 70, ac: 30 }

function buildDefault() {
  const kpiData = {}
  TEAM_MEMBERS.forEach(name => {
    kpiData[name] = {}
    QUARTERS.forEach(q => {
      kpiData[name][q] = { tcTarget: 0, tcAch: 0, acTarget: 0, acAch: 0 }
    })
  })
  return { version: 3, kpiData }
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KPI_KEY))
    if (s?.version === 3) return s
  } catch {}
  return buildDefault()
}

export function calcScore(q) {
  if (!q) return 0
  const tcPct = q.tcTarget > 0 ? Math.min(q.tcAch / q.tcTarget, 1) : 0
  const acPct = q.acTarget > 0 ? Math.min(q.acAch / q.acTarget, 1) : 0
  return Math.round(tcPct * KPI_WEIGHTS.tc + acPct * KPI_WEIGHTS.ac)
}

export function KPIProvider({ children }) {
  const [data, setData] = useState(load)

  useEffect(() => {
    localStorage.setItem(KPI_KEY, JSON.stringify(data))
  }, [data])

  function updateKPI(name, quarter, field, value) {
    setData(prev => ({
      ...prev,
      kpiData: {
        ...prev.kpiData,
        [name]: {
          ...prev.kpiData[name],
          [quarter]: {
            ...prev.kpiData[name]?.[quarter],
            [field]: parseFloat(value) || 0
          }
        }
      }
    }))
  }

  return (
    <KPIContext.Provider value={{ data, updateKPI }}>
      {children}
    </KPIContext.Provider>
  )
}

export function useKPI() {
  const ctx = useContext(KPIContext)
  if (!ctx) throw new Error('useKPI must be used within KPIProvider')
  return ctx
}
