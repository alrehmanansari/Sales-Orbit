import React, { useState, useEffect } from 'react'
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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return isMobile
}

function AppContent() {
  const [page, setPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { currentUser, logout } = useAuth()
  const isMobile = useIsMobile()

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

  function navigate(id) {
    setPage(id)
    if (isMobile) setSidebarOpen(false)
  }

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', position: 'relative' }}>
      {/* Mobile sidebar backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
            animation: 'fadeIn 0.18s ease'
          }}
        />
      )}

      <Sidebar
        page={page}
        onNav={navigate}
        onLogout={logout}
        isMobile={isMobile}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Header
          page={page}
          onNav={navigate}
          theme={theme}
          toggleTheme={toggleTheme}
          isMobile={isMobile}
          onMenuToggle={() => setSidebarOpen(o => !o)}
        />
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
