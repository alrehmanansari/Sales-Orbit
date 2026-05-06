import React, { useState, useEffect } from 'react'
import { useAuth } from '../store/AuthContext'
import { DESIGNATIONS } from '../data/constants'

/* ── Star logo ── */
const Star = ({ size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none"
    style={{ animation: 'fanSpin 3.5s linear infinite', flexShrink: 0 }}>
    <defs>
      <linearGradient id="ag" x1="40" y1="4" x2="40" y2="76" gradientUnits="userSpaceOnUse">
        <stop offset="0%"   stopColor="#4796E3"/>
        <stop offset="45%"  stopColor="#9177C7"/>
        <stop offset="100%" stopColor="#CA6673"/>
      </linearGradient>
    </defs>
    <path d="M40 4 C40 4 41.6 22 47 35 C53 49 68 40 76 40 C68 40 53 31 47 45 C41.6 58 40 76 40 76 C40 76 38.4 58 33 45 C27 31 12 40 4 40 C12 40 27 49 33 35 C38.4 22 40 4 40 4Z" fill="url(#ag)"/>
  </svg>
)

/* ── Glass card input ── */
function AuthInput({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )
}

const fieldStyle = (focused) => ({
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '11px 14px', borderRadius: 12,
  background: 'rgba(255,255,255,0.55)',
  border: `1.5px solid ${focused ? 'var(--so-purple)' : 'rgba(0,0,0,0.12)'}`,
  boxShadow: focused ? '0 0 0 3.5px var(--so-purple-soft)' : 'none',
  transition: 'all 0.22s',
})
const fieldStyleDark = (focused) => ({
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '11px 14px', borderRadius: 12,
  background: 'rgba(255,255,255,0.04)',
  border: `1.5px solid ${focused ? 'var(--so-purple)' : 'rgba(255,255,255,0.12)'}`,
  boxShadow: focused ? '0 0 0 3.5px var(--so-purple-soft)' : 'none',
  transition: 'all 0.22s',
})

function GlassInput({ type = 'text', value, onChange, placeholder, onKeyDown, children, isDark }) {
  const [focused, setFocused] = useState(false)
  const style = isDark ? fieldStyleDark(focused) : fieldStyle(focused)
  return (
    <div style={style}>
      {children}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font)', fontSize: 14, color: 'var(--text-primary)' }}
      />
    </div>
  )
}

function GlassSelect({ value, onChange, children, isDark }) {
  const [focused, setFocused] = useState(false)
  const style = isDark ? fieldStyleDark(focused) : fieldStyle(focused)
  return (
    <div style={style}>
      <select value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font)', fontSize: 14, color: 'var(--text-primary)', cursor: 'pointer' }}>
        {children}
      </select>
    </div>
  )
}

export default function AuthPage() {
  const { signup, login, verifyOtp } = useAuth()
  const [mode, setMode] = useState('login')
  const [pendingEmail, setPendingEmail] = useState('')
  const [otpFromApi, setOtpFromApi] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [serverOnline, setServerOnline] = useState(null)
  const [form, setForm] = useState({ firstName: '', lastName: '', designation: '', email: '', loginEmail: '' })

  // Detect dark mode
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'

  useEffect(() => {
    fetch('/api/v1/auth/me')
      .then(r => setServerOnline(r.status < 600))
      .catch(() => setServerOnline(false))
  }, [])

  function setF(k, v) { setForm(p => ({ ...p, [k]: v })); setError('') }

  async function handleSignup() {
    const { firstName, lastName, designation, email } = form
    if (!firstName.trim()) return setError('First name is required.')
    if (!lastName.trim())  return setError('Last name is required.')
    if (!designation)       return setError('Please select a designation.')
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email.')
    setLoading(true)
    const result = await signup({ firstName, lastName, designation, email })
    setLoading(false)
    if (result.error) return setError(result.error)
    setOtpFromApi(result.otp || ''); setPreviewUrl(result.previewUrl || '')
    setPendingEmail(email); setMode('otp')
  }

  async function handleLogin() {
    const email = form.loginEmail.trim()
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email.')
    setLoading(true)
    const result = await login(email)
    setLoading(false)
    if (result.error) return setError(result.error)
    setOtpFromApi(result.otp || ''); setPreviewUrl(result.previewUrl || '')
    setPendingEmail(email); setMode('otp')
  }

  async function handleOTP() {
    setLoading(true)
    const result = await verifyOtp(pendingEmail, otpInput)
    setLoading(false)
    if (result.error) return setError(result.error)
  }

  async function resendOTP() {
    setLoading(true)
    const result = await login(pendingEmail)
    setLoading(false)
    if (result.error) return setError(result.error)
    setOtpFromApi(result.otp || ''); setPreviewUrl(result.previewUrl || '')
    setOtpInput(''); setError('')
  }

  /* ── Glass card style ── */
  const cardBg = isDark
    ? 'rgba(20,20,22,0.62)'
    : 'rgba(255,255,255,0.58)'
  const cardBorder = isDark
    ? 'rgba(255,255,255,0.10)'
    : 'rgba(255,255,255,0.65)'

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, position: 'relative', overflow: 'hidden',
    }} className="aurora-bg">
      {/* Aurora orbs */}
      <div className="aurora-orb" style={{ width: 300, height: 300, background: '#4796E3', top: '-80px', left: '-60px' }} />
      <div className="aurora-orb" style={{ width: 260, height: 260, background: '#9177C7', bottom: '-60px', right: '-50px', animationDelay: '-5s' }} />
      <div className="aurora-orb" style={{ width: 200, height: 200, background: '#CA6673', top: '35%', right: '18%', animationDelay: '-9s' }} />

      {/* Glass card */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 420,
        background: cardBg,
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        border: `1px solid ${cardBorder}`,
        borderRadius: 24, overflow: 'hidden',
        boxShadow: isDark
          ? '0 32px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(145,119,199,0.18), 0 0 60px -16px rgba(145,119,199,0.4)'
          : '0 32px 64px rgba(31,38,135,0.15), 0 0 0 1px rgba(145,119,199,0.08)',
        animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>

        {/* Logo header strip */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
          padding: '22px 28px 20px',
          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.72)',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)'}`,
          backdropFilter: 'blur(20px)',
        }}>
          <Star size={48} />
          <div style={{ fontFamily: 'var(--font)', fontSize: 32, fontWeight: 500, letterSpacing: '-0.5px', lineHeight: 1 }}>
            <span style={{ background: 'linear-gradient(90deg,#4796E3,#9177C7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Sales </span>
            <span style={{ background: 'linear-gradient(90deg,#9177C7,#CA6673)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Orbit</span>
          </div>
        </div>

        {/* Card body */}
        <div style={{ padding: '28px 32px 32px' }}>

          {/* Status banner */}
          {serverOnline === false && (
            <div style={{ background: 'rgba(217,48,37,0.10)', border: '1px solid rgba(217,48,37,0.25)', borderRadius: 10, padding: '9px 12px', fontSize: 12, color: '#D93025', marginBottom: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 3 }}>⚠ Backend server not running</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>cd backend && npm run dev</div>
            </div>
          )}
          {serverOnline === true && mode !== 'otp' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 14 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1E8E3E', boxShadow: '0 0 8px rgba(52,168,83,0.6)', display: 'inline-block' }} />
              Server connected
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(217,48,37,0.09)', border: '1px solid rgba(217,48,37,0.25)', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#D93025', marginBottom: 16, whiteSpace: 'pre-line' }}>
              ⚠ {error}
            </div>
          )}

          {/* ── OTP ── */}
          {mode === 'otp' && (
            <>
              <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.5px', color: 'var(--text-primary)', marginBottom: 6 }}>
                Verify <span style={{ background: 'var(--so-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>identity.</span>
              </div>
              <div style={{ background: 'var(--so-blue-soft)', border: '1px solid rgba(71,150,227,0.22)', borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                OTP sent to <strong>{pendingEmail}</strong>
                {!otpFromApi && !previewUrl && <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-tertiary)' }}>Check your inbox for the 6-digit code.</div>}
                {previewUrl && (
                  <div style={{ marginTop: 8 }}>
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--so-blue)', background: 'var(--bg-card)', border: '1px solid rgba(71,150,227,0.3)', borderRadius: 8, padding: '6px 12px', textDecoration: 'none' }}>
                      📬 View OTP Email
                    </a>
                  </div>
                )}
                {otpFromApi && !previewUrl && (
                  <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 12px' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Your OTP:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 800, color: 'var(--so-blue)', letterSpacing: 4 }}>{otpFromApi}</span>
                  </div>
                )}
              </div>

              <AuthInput label="6-Digit OTP">
                <div style={{ ...(isDark ? fieldStyleDark(false) : fieldStyle(false)) }}>
                  <input
                    value={otpInput} onChange={e => { setOtpInput(e.target.value.replace(/\D/g,'').slice(0,6)); setError('') }}
                    placeholder="000000" maxLength={6}
                    onKeyDown={e => e.key === 'Enter' && otpInput.length === 6 && handleOTP()}
                    style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800, letterSpacing: 8, textAlign: 'center', color: 'var(--text-primary)' }}
                  />
                </div>
              </AuthInput>

              <button onClick={handleOTP} disabled={otpInput.length !== 6 || loading}
                style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: 'var(--so-gradient)', color: '#fff', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, cursor: otpInput.length !== 6 || loading ? 'not-allowed' : 'pointer', opacity: otpInput.length !== 6 || loading ? 0.55 : 1, boxShadow: '0 8px 20px -6px rgba(145,119,199,0.5)', transition: 'all 0.2s' }}>
                {loading ? 'Verifying…' : 'Verify & Continue →'}
              </button>

              <div style={{ marginTop: 16, textAlign: 'center', display: 'flex', gap: 16, justifyContent: 'center', fontSize: 13 }}>
                <button onClick={resendOTP} disabled={loading} style={{ background: 'none', border: 'none', color: 'var(--so-blue)', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 500 }}>Resend OTP</button>
                <span style={{ color: 'var(--border-strong-color)' }}>|</span>
                <button onClick={() => { setMode('login'); setError('') }} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontFamily: 'var(--font)' }}>← Back</button>
              </div>
            </>
          )}

          {/* ── Login ── */}
          {mode === 'login' && (
            <>
              <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.5px', color: 'var(--text-primary)', marginBottom: 4 }}>
                Welcome <span style={{ background: 'var(--so-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>back.</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>Sign in to keep your pipeline in motion.</div>

              <AuthInput label="Work Email">
                <GlassInput type="email" value={form.loginEmail} onChange={e => setF('loginEmail', e.target.value)} placeholder="you@company.com" onKeyDown={e => e.key === 'Enter' && handleLogin()} isDark={isDark}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
                </GlassInput>
              </AuthInput>

              <button onClick={handleLogin} disabled={loading}
                style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: 'var(--so-gradient)', color: '#fff', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: isDark ? '0 0 28px -4px rgba(145,119,199,0.7)' : '0 8px 20px -6px rgba(145,119,199,0.5)', transition: 'all 0.2s', marginBottom: 20 }}>
                {loading ? 'Sending OTP…' : 'Send OTP →'}
              </button>

              <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                New here?{' '}
                <button onClick={() => { setMode('signup'); setError('') }} style={{ background: 'none', border: 'none', color: 'var(--so-purple)', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font)', fontSize: 13 }}>Create account</button>
              </div>
            </>
          )}

          {/* ── Signup ── */}
          {mode === 'signup' && (
            <>
              <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.5px', color: 'var(--text-primary)', marginBottom: 4 }}>
                Start selling <span style={{ background: 'var(--so-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>faster.</span>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 22 }}>
                Sales Orbit · BD Platform
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <AuthInput label="First Name">
                  <GlassInput value={form.firstName} onChange={e => setF('firstName', e.target.value)} placeholder="Ariya" isDark={isDark} />
                </AuthInput>
                <AuthInput label="Last Name">
                  <GlassInput value={form.lastName} onChange={e => setF('lastName', e.target.value)} placeholder="Reyes" isDark={isDark} />
                </AuthInput>
              </div>

              <AuthInput label="Designation">
                <GlassSelect value={form.designation} onChange={e => setF('designation', e.target.value)} isDark={isDark}>
                  <option value="">Select your role…</option>
                  {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </GlassSelect>
              </AuthInput>

              <AuthInput label="Work Email">
                <GlassInput type="email" value={form.email} onChange={e => setF('email', e.target.value)} placeholder="you@company.com" isDark={isDark}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
                </GlassInput>
              </AuthInput>

              <button onClick={handleSignup} disabled={loading}
                style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: 'var(--so-gradient)', color: '#fff', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: isDark ? '0 0 28px -4px rgba(145,119,199,0.7)' : '0 8px 20px -6px rgba(145,119,199,0.5)', transition: 'all 0.2s', marginBottom: 20, marginTop: 6 }}>
                {loading ? 'Creating Account…' : 'Create Account →'}
              </button>

              <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                Already have an account?{' '}
                <button onClick={() => { setMode('login'); setError('') }} style={{ background: 'none', border: 'none', color: 'var(--so-purple)', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font)', fontSize: 13 }}>Sign in</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
