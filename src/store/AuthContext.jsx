import React, { createContext, useContext, useState, useEffect } from 'react'
import { MANAGER_DESIGNATIONS } from '../data/constants'

const AuthContext = createContext(null)
const USERS_KEY = 'salesorbit_users_v1'
const SESSION_KEY = 'salesorbit_session_v1'

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || [] } catch { return [] }
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}
function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) } catch { return null }
}
function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(loadSession)
  const [users, setUsers] = useState(loadUsers)

  useEffect(() => {
    saveUsers(users)
  }, [users])

  function isManager(user) {
    return MANAGER_DESIGNATIONS.includes(user?.designation)
  }

  function signup(userData) {
    const existing = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())
    if (existing) return { error: 'An account with this email already exists.' }
    const newUser = {
      id: `USR-${Date.now()}`,
      firstName: userData.firstName,
      lastName: userData.lastName,
      name: `${userData.firstName} ${userData.lastName}`,
      designation: userData.designation,
      email: userData.email,
      role: MANAGER_DESIGNATIONS.includes(userData.designation) ? 'Manager' : 'Rep',
      createdAt: new Date().toISOString()
    }
    setUsers(prev => [...prev, newUser])
    return { user: newUser }
  }

  function login(email) {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (!user) return { error: 'No account found with this email. Please sign up first.' }
    return { user }
  }

  function confirmLogin(user) {
    setCurrentUser(user)
    saveSession(user)
  }

  function logout() {
    setCurrentUser(null)
    clearSession()
  }

  function updateUser(updated) {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
    if (currentUser?.id === updated.id) {
      setCurrentUser(updated)
      saveSession(updated)
    }
  }

  return (
    <AuthContext.Provider value={{ currentUser, users, isManager: isManager(currentUser), signup, login, confirmLogin, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
