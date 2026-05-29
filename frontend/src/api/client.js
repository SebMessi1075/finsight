const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

// ── Token storage ─────────────────────────────────────────────
export const token = {
  get:   ()  => localStorage.getItem('fs_token'),
  set:   (t) => localStorage.setItem('fs_token', t),
  clear: ()  => localStorage.removeItem('fs_token'),
}

// ── Error type ────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// ── Core fetch wrapper ────────────────────────────────────────
// All requests go through here. Automatically:
//   - Prepends BASE URL
//   - Injects Authorization header when a token exists
//   - Parses JSON response
//   - Throws ApiError on non-2xx (including 401)
async function request(path, options = {}) {
  const headers = { ...options.headers }
  const t = token.get()
  if (t) headers['Authorization'] = `Bearer ${t}`

  let res
  try {
    res = await fetch(`${BASE}${path}`, { ...options, headers })
  } catch {
    throw new ApiError(0, 'Cannot reach server — is the backend running?')
  }

  if (res.status === 401) {
    token.clear()
    throw new ApiError(401, 'Session expired. Please log in again.')
  }

  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      if (body.detail) detail = body.detail
    } catch { /* non-JSON error body */ }
    throw new ApiError(res.status, detail)
  }

  if (res.status === 204) return null
  return res.json()
}

// ── Auth endpoints ─────────────────────────────────────────────
export const auth = {
  // POST /auth/register  {email, name, password} → UserOut
  register: (email, name, password) =>
    request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password }),
    }),

  // POST /auth/token  (OAuth2 form: username=email) → stores token, returns TokenOut
  login: async (email, password) => {
    const form = new URLSearchParams({ username: email, password })
    const data = await request('/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
    token.set(data.access_token)
    return data
  },

  logout: () => token.clear(),

  // GET /auth/me → UserOut
  me: () => request('/auth/me'),
}

// ── Data endpoints (all require token) ────────────────────────
export const api = {
  // POST /api/analyze  multipart file → full analysis JSON
  analyze: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return request('/api/analyze', { method: 'POST', body: fd })
  },

  // GET /api/uploads → UploadOut[]
  getUploads: () => request('/api/uploads'),

  // GET /api/transactions?upload_id=N → TransactionOut[]
  getTransactions: (uploadId) => {
    const qs = uploadId != null ? `?upload_id=${uploadId}` : ''
    return request(`/api/transactions${qs}`)
  },
}
