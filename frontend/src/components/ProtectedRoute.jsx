import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

// Renders children when logged in.
// Shows nothing while the token is being verified (avoids a login-page flash).
// Redirects to /login when not authenticated.
export default function ProtectedRoute({ children }) {
  const { user } = useAuth()

  if (user === undefined) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}
