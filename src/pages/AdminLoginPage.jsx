import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { hasPocketBaseConfigured } from '../lib/pocketbase'
import { useAdminAuth } from '../context/adminAuthStore'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, login } = useAdminAuth()
  const [identity, setIdentity] = useState('admin@local.test')
  const [password, setPassword] = useState('adminadmin')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await login(identity, password)
      navigate(location.state?.from || '/admin', { replace: true })
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="admin-shell">
      <section className="admin-panel">
        <h1>Admin Login</h1>
        <p className="admin-copy">
          Dashboard ini memakai collection <code>admins</code> PocketBase. Ganti credential default segera setelah
          masuk.
        </p>
        {!hasPocketBaseConfigured && (
          <p className="empty-state">`VITE_POCKETBASE_URL` belum di-set, jadi mode admin tidak bisa dipakai.</p>
        )}
        <form className="admin-form" onSubmit={handleSubmit}>
          <label className="toolbar-field">
            <span>Email Admin</span>
            <input
              className="toolbar-input"
              type="email"
              value={identity}
              onChange={(event) => setIdentity(event.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="toolbar-field">
            <span>Password</span>
            <input
              className="toolbar-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error && <p className="admin-error">{error}</p>}
          <div className="admin-actions">
            <button type="submit" className="action-btn" disabled={submitting || !hasPocketBaseConfigured}>
              {submitting ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}
