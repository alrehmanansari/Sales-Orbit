import React, { useState } from 'react'
import { CRMProvider } from './store/CRMContext'
import { AuthProvider, useAuth } from './store/AuthContext'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import Dashboard from './pages/Dashboard'
import LeadsPage from './pages/LeadsPage'
import OpportunitiesPage from './pages/OpportunitiesPage'
import PipelinePage from './pages/PipelinePage'
import ReportsPage from './pages/ReportsPage'
import CustomReportsPage from './pages/CustomReportsPage'
import SalesScriptPage from './pages/SalesScriptPage'
import AuthPage from './pages/AuthPage'
import { useTheme } from './hooks/useTheme'
import { KPIProvider } from './store/KPIContext'

function AppContent() {
  const [page, setPage] = useState('dashboard')
  const { theme, toggleTheme } = useTheme()
  const { currentUser, logout } = useAuth()

  if (!currentUser) return <AuthPage />

  const PAGES = {
    dashboard:     <Dashboard />,
    leads:         <LeadsPage />,
    opportunities: <OpportunitiesPage />,
    pipeline:      <PipelinePage />,
    reports:       <ReportsPage />,
    customReports: <CustomReportsPage />,
    salesScript:   <SalesScriptPage />
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar page={page} onNav={setPage} onLogout={logout} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Header page={page} onNav={setPage} theme={theme} toggleTheme={toggleTheme} />
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {PAGES[page] || <Dashboard />}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <KPIProvider>
        <CRMProvider>
          <AppContent />
        </CRMProvider>
      </KPIProvider>
    </AuthProvider>
  )
}
