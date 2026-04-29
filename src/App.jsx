import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './store/AuthContext'
import { CRMProvider, useCRM } from './store/CRMContext'
import { KPIProvider } from './store/KPIContext'
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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return isMobile
}

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)', flexDirection: 'column', gap: 16
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid var(--border-color)',
        borderTopColor: 'var(--so-blue)',
        animation: 'spin 0.7s linear infinite'
      }} />
      <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Loading SalesOrbit…</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function AppContent() {
  const [page, setPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { logout } = useAuth()
  const { crmLoading } = useCRM()
  const isMobile = useIsMobile()

  if (crmLoading) return <LoadingScreen />

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

// Mounts CRM/KPI providers only after login so they fetch with a valid JWT
function AppGate() {
  const { currentUser } = useAuth()
  if (!currentUser) return <AuthPage />
  return (
    <KPIProvider>
      <CRMProvider>
        <AppContent />
      </CRMProvider>
    </KPIProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  )
}
