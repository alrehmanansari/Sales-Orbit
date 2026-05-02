import React, { createContext, useContext, useState, useEffect } from 'react'
import * as api from '../services/api'

const AuthContext = createContext(null)

const TOKEN_KEY = 'so_token'
const USER_KEY  = 'so_user'

function loadStoredUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(loadStoredUser)

  // On mount, validate the stored token (in case it expired)
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return

    api.auth.me().then(res => {
      const user = { ...res.user }
      localStorage.setItem(USER_KEY, JSON.stringify(user))
      setCurrentUser(user)
    }).catch(err => {
      // BACKEND_UNREACHABLE: keep the stored user so the app loads from cache
      // Any other error (401, expired token): clear the session
      if (err.message !== 'BACKEND_UNREACHABLE') {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setCurrentUser(null)
      }
    })
  }, [])

  async function signup(data) {
    try {
      const res = await api.auth.signup(data)
      return { otp: res.otp }
    } catch (err) {
      if (err.message === 'BACKEND_UNREACHABLE')
        return { error: 'Cannot reach the backend. Open a terminal and run:\ncd backend && npm run dev' }
      return { error: err.message }
    }
  }

  async function login(email) {
    try {
      const res = await api.auth.login(email)
      return { otp: res.otp }
    } catch (err) {
      if (err.message === 'BACKEND_UNREACHABLE')
        return { error: 'Cannot reach the backend. Open a terminal and run:\ncd backend && npm run dev' }
      return { error: err.message }
    }
  }

  async function verifyOtp(email, otp) {
    try {
      const res = await api.auth.verifyOtp(email, otp)
      localStorage.setItem(TOKEN_KEY, res.token)
      const user = { ...res.user }
      localStorage.setItem(USER_KEY, JSON.stringify(user))
      setCurrentUser(user)
      return {}
    } catch (err) {
      if (err.message === 'BACKEND_UNREACHABLE')
        return { error: 'Lost connection to backend. Make sure it is still running.' }
      return { error: err.message }
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setCurrentUser(null)
  }

  async function updateUser(data) {
    try {
      const res = await api.auth.updateMe(data)
      const updated = { ...currentUser, ...res.user }
      localStorage.setItem(USER_KEY, JSON.stringify(updated))
      setCurrentUser(updated)
      return {}
    } catch (err) {
      return { error: err.message }
    }
  }

  return (
    <AuthContext.Provider value={{
      currentUser,
      isManager: currentUser?.role === 'Manager',
      signup,
      login,
      verifyOtp,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
