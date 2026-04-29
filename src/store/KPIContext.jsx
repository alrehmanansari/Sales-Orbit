import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import * as api from '../services/api'

const KPIContext = createContext(null)

export const QUARTERS = ['Q2', 'Q3', 'Q4']
export const KPI_WEIGHTS = { tc: 70, ac: 30 }

export function calcScore(q) {
  if (!q) return 0
  const tcPct = q.tcTarget > 0 ? Math.min(q.tcAch / q.tcTarget, 1) : 0
  const acPct = q.acTarget > 0 ? Math.min(q.acAch / q.acTarget, 1) : 0
  return Math.round(tcPct * KPI_WEIGHTS.tc + acPct * KPI_WEIGHTS.ac)
}

function buildEmpty() {
  return { version: 3, kpiData: {} }
}

// Convert backend array to frontend shape keyed by userName
function fromApi(rows) {
  const kpiData = {}
  rows.forEach(r => {
    if (!kpiData[r.userName]) kpiData[r.userName] = {}
    kpiData[r.userName][r.quarter] = {
      tcTarget: r.tcTarget,
      tcAch: r.tcAch,
      acTarget: r.acTarget,
      acAch: r.acAch,
    }
  })
  return { version: 3, kpiData }
}

export function KPIProvider({ children }) {
  const [data, setData] = useState(buildEmpty)
  const [userIdMap, setUserIdMap] = useState({}) // { "Alice Johnson": "USR-..." }
  const currentYear = new Date().getFullYear()
  const dataRef = useRef(data)
  useEffect(() => { dataRef.current = data }, [data])

  useEffect(() => {
    Promise.all([
      api.kpis.list(currentYear),
      api.users.list(),
    ]).then(([kpiRes, userRes]) => {
      setData(fromApi(kpiRes.kpis))
      const map = {}
      userRes.users.forEach(u => { map[u.name] = u.userId })
      setUserIdMap(map)
    }).catch(err => {
      console.error('Failed to load KPIs:', err)
    })
  }, [])

  function updateKPI(name, quarter, field, value) {
    const newVal = parseFloat(value) || 0

    setData(prev => {
      const updated = {
        ...prev,
        kpiData: {
          ...prev.kpiData,
          [name]: {
            ...prev.kpiData[name],
            [quarter]: {
              ...prev.kpiData[name]?.[quarter],
              [field]: newVal,
            },
          },
        },
      }
      return updated
    })

    // Sync to backend
    const userId = userIdMap[name]
    if (!userId) return

    const q = dataRef.current.kpiData[name]?.[quarter] || { tcTarget: 0, tcAch: 0, acTarget: 0, acAch: 0 }
    api.kpis.upsert([{
      userId,
      userName: name,
      quarter,
      year: currentYear,
      ...q,
      [field]: newVal,
    }]).catch(err => {
      console.error('Failed to sync KPI:', err)
    })
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
