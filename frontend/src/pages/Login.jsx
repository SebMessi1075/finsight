import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { BarChart2 } from 'lucide-react'
import { auth } from '../api/client'
import { useAuth } from '../hooks/useAuth.jsx'
import '../styles/auth.css'

export default function Login() {
  const navigate = useNavigate()
  const { user, setUser } = useAuth()

  if (user) return <Navigate to="/dashboard" replace />
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await auth.login(email, password)
      const me = await auth.me()
      setUser(me)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-wordmark">
          <BarChart2 size={18} className="auth-wordmark-icon" />
          <span className="auth-wordmark-text">FinSight</span>
        </div>

        <h1 className="auth-title">Sign in</h1>
        <p className="auth-subtitle">Enter your credentials to continue.</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer">
          No account? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  )
}
