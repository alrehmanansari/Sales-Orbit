const BASE = '/api/v1'

function getToken() {
  return localStorage.getItem('so_token')
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `Request failed (${res.status})`)
  return json
}

const get   = (path)        => request('GET',    path)
const post  = (path, body)  => request('POST',   path, body)
const put   = (path, body)  => request('PUT',    path, body)
const patch = (path, body)  => request('PATCH',  path, body)
const del   = (path)        => request('DELETE', path)

function qs(params = {}) {
  const q = new URLSearchParams(params).toString()
  return q ? `?${q}` : ''
}

export const auth = {
  signup:    (data)        => post('/auth/signup', data),
  login:     (email)       => post('/auth/login', { email }),
  verifyOtp: (email, otp)  => post('/auth/verify-otp', { email, otp }),
  me:        ()            => get('/auth/me'),
  updateMe:  (data)        => put('/auth/me', data),
}

export const users = {
  list: () => get('/users'),
}

export const leads = {
  list:    (params)  => get(`/leads${qs(params)}`),
  create:  (data)    => post('/leads', data),
  update:  (id, data) => put(`/leads/${id}`, data),
  remove:  (id)      => del(`/leads/${id}`),
  bulk:    (rows)    => post('/leads/bulk', { leads: rows }),
  convert: (id, data) => post(`/leads/${id}/convert`, data),
}

export const opportunities = {
  list:      (params)       => get(`/opportunities${qs(params)}`),
  create:    (data)         => post('/opportunities', data),
  update:    (id, data)     => put(`/opportunities/${id}`, data),
  remove:    (id)           => del(`/opportunities/${id}`),
  moveStage: (id, data)     => patch(`/opportunities/${id}/stage`, data),
}

export const activities = {
  list:     (params)     => get(`/activities${qs(params)}`),
  create:   (data)       => post('/activities', data),
  byEntity: (type, id)   => get(`/activities/entity/${type}/${id}`),
}

export const kpis = {
  list:   (year)   => get(`/kpis?year=${year}`),
  upsert: (rows)   => put('/kpis', { kpis: rows }),
}

export const dashboard = {
  stats:             (range) => get(`/dashboard/stats?range=${range}`),
  pipeline:          ()      => get('/dashboard/pipeline'),
  leaderboard:       (range) => get(`/dashboard/leaderboard?range=${range}`),
  activityBreakdown: (range) => get(`/dashboard/activity-breakdown?range=${range}`),
}
