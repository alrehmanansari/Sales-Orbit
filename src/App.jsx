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
import TakeNotesPage from './pages/TakeNotesPage'
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

function BackendError({ message }) {
  return (
    <div style={{
      display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)', flexDirection: 'column', gap: 12, padding: 24, textAlign: 'center'
    }}>
      <div style={{ fontSize: 32 }}>⚠️</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Backend not reachable</div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 420, lineHeight: 1.6 }}>{message}</div>
      <div style={{
        marginTop: 8, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
        borderRadius: 10, padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)'
      }}>
        cd backend &nbsp;&&nbsp; npm run dev
      </div>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: 8, padding: '9px 24px', borderRadius: 24, border: 'none',
          background: 'var(--so-gradient)', color: '#fff', cursor: 'pointer',
          fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600
        }}
      >
        Retry
      </button>
    </div>
  )
}

function AppContent() {
  const [page, setPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, toggleTheme, colorScheme, isDark, setColorScheme } = useTheme()
  const { logout } = useAuth()
  const { crmLoading, crmError } = useCRM()
  const isMobile = useIsMobile()

  if (crmLoading) return <LoadingScreen />
  if (crmError)   return <BackendError message={crmError} />

  const PAGES = {
    dashboard:     <Dashboard />,
    leads:         <LeadsPage />,
    opportunities: <OpportunitiesPage />,
    pipeline:      <PipelinePage />,
    reports:       <ReportsPage />,
    customReports: <CustomReportsPage />,
    salesScript:   <SalesScriptPage />,
    takeNotes:     <TakeNotesPage />,
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
          colorScheme={colorScheme}
          isDark={isDark}
          setColorScheme={setColorScheme}
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
