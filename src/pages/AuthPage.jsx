import React, { useState } from 'react'
import { useAuth, generateOTP } from '../store/AuthContext'
import { DESIGNATIONS } from '../data/constants'

const StarLogo = () => (
  <svg width="72" height="72" viewBox="0 0 80 80" fill="none" style={{ animation: 'fanSpin 3.5s linear infinite' }}>
    <defs>
      <linearGradient id="auth-grad" x1="40" y1="4" x2="40" y2="76" gradientUnits="userSpaceOnUse">
        <stop offset="0%"   stopColor="#4796E3"/>
        <stop offset="45%"  stopColor="#9177C7"/>
        <stop offset="100%" stopColor="#CA6673"/>
      </linearGradient>
    </defs>
    <path d="M40 4 C40 4 41.6 22 47 35 C53 49 68 40 76 40 C68 40 53 31 47 45 C41.6 58 40 76 40 76 C40 76 38.4 58 33 45 C27 31 12 40 4 40 C12 40 27 49 33 35 C38.4 22 40 4 40 4Z" fill="url(#auth-grad)" stroke="url(#auth-grad)" strokeWidth="1"/>
  </svg>
)

const inputStyle = {
  width: '100%', padding: '11px 14px',
  background: 'var(--bg-tertiary)', border: '1px solid var(--border-strong-color)',
  borderRadius: 10, color: 'var(--text-primary)', fontFamily: 'var(--font)',
  fontSize: 14, outline: 'none', transition: 'border-color 0.18s, box-shadow 0.18s',
  boxSizing: 'border-box'
}

function InputField({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )
}

function GradientBtn({ onClick, disabled, children, style }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', padding: '12px', borderRadius: 24, border: 'none',
      background: 'var(--so-gradient)', color: '#fff', fontFamily: 'var(--font)',
      fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1, transition: 'opacity 0.2s, transform 0.18s',
      ...style
    }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '0.88' }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.opacity = '1' }}
    >
      {children}
    </button>
  )
}

export default function AuthPage() {
  const { signup, login, confirmLogin } = useAuth()
  const [mode, setMode] = useState('login') // login | signup | otp
  const [pendingUser, setPendingUser] = useState(null)
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({ firstName: '', lastName: '', designation: '', email: '', loginEmail: '' })

  function setF(k, v) { setForm(p => ({ ...p, [k]: v })); setError('') }

  function handleSignup() {
    const { firstName, lastName, designation, email } = form
    if (!firstName.trim()) return setError('First name is required.')
    if (!lastName.trim())  return setError('Last name is required.')
    if (!designation)       return setError('Please select a designation.')
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email.')
    const result = signup({ firstName, lastName, designation, email })
    if (result.error) return setError(result.error)
    const code = generateOTP()
    setGeneratedOtp(code)
    setPendingUser(result.user)
    setMode('otp')
  }

  function handleLogin() {
    const email = form.loginEmail.trim()
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email.')
    const result = login(email)
    if (result.error) return setError(result.error)
    const code = generateOTP()
    setGeneratedOtp(code)
    setPendingUser(result.user)
    setMode('otp')
  }

  function handleOTP() {
    if (otpInput.trim() !== generatedOtp) return setError('Incorrect OTP. Please try again.')
    confirmLogin(pendingUser)
  }

  function resendOTP() {
    const code = generateOTP()
    setGeneratedOtp(code)
    setOtpInput('')
    setError('')
  }

  const cardStyle = {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 420,
    boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
    animation: 'scaleIn 0.3s cubic-bezier(0.4,0,0.2,1) both'
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)', padding: 20, position: 'relative', overflow: 'hidden',
      backgroundImage: 'radial-gradient(ellipse at 20% 20%, rgba(71,150,227,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(202,102,115,0.06) 0%, transparent 60%)'
    }}>



      <div style={{ ...cardStyle, position: 'relative', zIndex: 1 }}>
        {/* Logo — icon + wordmark horizontally aligned, perfectly centered in card */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          {/* Logo row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <StarLogo />
            {/* Wordmark + tagline stacked */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ fontWeight: 800, fontSize: 28, letterSpacing: '-0.5px', lineHeight: 1, whiteSpace: 'nowrap' }}>
                <span style={{ background: 'linear-gradient(90deg,#4796E3,#9177C7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Sales </span>
                <span style={{ background: 'linear-gradient(90deg,#9177C7,#CA6673)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Orbit</span>
              </div>
              <div style={{
                fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1,
                textAlign: 'justify', textAlignLast: 'justify',
                animation: 'taglineFloat 0.55s cubic-bezier(0.4,0,0.2,1) 0.2s both'
              }}>
                {mode === 'otp' ? 'Verify your identity' : 'Sell Faster. Orbit Further.'}
              </div>
            </div>
          </div>

          {/* Thin full-width divider */}
          <div style={{
            marginTop: 22, width: '100%',
            height: '0.5px',
            background: 'linear-gradient(90deg, transparent, var(--border-color), transparent)'
          }} />
        </div>

        {error && (
          <div style={{ background: 'rgba(217,48,37,0.08)', border: '1px solid rgba(217,48,37,0.25)', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: '#D93025', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            ⚠ {error}
          </div>
        )}

        {/* OTP Screen */}
        {mode === 'otp' && (
          <>
            <div style={{ background: 'var(--so-blue-soft)', border: '1px solid rgba(71,150,227,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              📧 OTP sent to <strong>{pendingUser?.email}</strong>
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-tertiary)' }}>Demo mode — no email service configured</div>
              <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 12px' }}>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Your OTP:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 800, color: 'var(--so-blue)', letterSpacing: 4 }}>{generatedOtp}</span>
              </div>
            </div>

            <InputField label="6-Digit OTP">
              <input
                style={{ ...inputStyle, textAlign: 'center', fontSize: 20, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: 8 }}
                value={otpInput} onChange={e => { setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                placeholder="000000" maxLength={6}
                onFocus={e => { e.target.style.borderColor = 'var(--so-blue)'; e.target.style.boxShadow = '0 0 0 3px var(--so-blue-soft)' }}
                onBlur={e => { e.target.style.borderColor = ''; e.target.style.boxShadow = '' }}
              />
            </InputField>

            <GradientBtn onClick={handleOTP} disabled={otpInput.length !== 6}>
              Verify & Continue →
            </GradientBtn>

            <div style={{ marginTop: 16, textAlign: 'center', display: 'flex', gap: 16, justifyContent: 'center', fontSize: 13 }}>
              <button onClick={resendOTP} style={{ background: 'none', border: 'none', color: 'var(--so-blue)', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 500 }}>Resend OTP</button>
              <span style={{ color: 'var(--border-color)' }}>|</span>
              <button onClick={() => { setMode(mode === 'otp' && !pendingUser?.createdAt ? 'login' : 'login'); setError('') }} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontFamily: 'var(--font)' }}>← Back</button>
            </div>
          </>
        )}

        {/* Login */}
        {mode === 'login' && (
          <>
            <InputField label="Email Address">
              <input
                style={inputStyle} type="email" value={form.loginEmail}
                onChange={e => setF('loginEmail', e.target.value)}
                placeholder="your@email.com"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                onFocus={e => { e.target.style.borderColor = 'var(--so-blue)'; e.target.style.boxShadow = '0 0 0 3px var(--so-blue-soft)' }}
                onBlur={e => { e.target.style.borderColor = ''; e.target.style.boxShadow = '' }}
              />
            </InputField>
            <GradientBtn onClick={handleLogin}>Send OTP →</GradientBtn>
            <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>
              Don't have an account?{' '}
              <button onClick={() => { setMode('signup'); setError('') }} style={{ background: 'none', border: 'none', color: 'var(--so-blue)', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font)', fontSize: 13 }}>Sign Up</button>
            </div>
          </>
        )}

        {/* Signup */}
        {mode === 'signup' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <InputField label="First Name">
                <input style={inputStyle} value={form.firstName} onChange={e => setF('firstName', e.target.value)} placeholder="John"
                  onFocus={e => { e.target.style.borderColor = 'var(--so-blue)'; e.target.style.boxShadow = '0 0 0 3px var(--so-blue-soft)' }}
                  onBlur={e => { e.target.style.borderColor = ''; e.target.style.boxShadow = '' }}
                />
              </InputField>
              <InputField label="Last Name">
                <input style={inputStyle} value={form.lastName} onChange={e => setF('lastName', e.target.value)} placeholder="Smith"
                  onFocus={e => { e.target.style.borderColor = 'var(--so-blue)'; e.target.style.boxShadow = '0 0 0 3px var(--so-blue-soft)' }}
                  onBlur={e => { e.target.style.borderColor = ''; e.target.style.boxShadow = '' }}
                />
              </InputField>
            </div>

            <InputField label="Designation">
              <select style={inputStyle} value={form.designation} onChange={e => setF('designation', e.target.value)}>
                <option value="">Select your role…</option>
                {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </InputField>

            <InputField label="Work Email">
              <input style={inputStyle} type="email" value={form.email} onChange={e => setF('email', e.target.value)} placeholder="your@company.com"
                onFocus={e => { e.target.style.borderColor = 'var(--so-blue)'; e.target.style.boxShadow = '0 0 0 3px var(--so-blue-soft)' }}
                onBlur={e => { e.target.style.borderColor = ''; e.target.style.boxShadow = '' }}
              />
            </InputField>

            <GradientBtn onClick={handleSignup}>Create Account →</GradientBtn>
            <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>
              Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError('') }} style={{ background: 'none', border: 'none', color: 'var(--so-blue)', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font)', fontSize: 13 }}>Log In</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
