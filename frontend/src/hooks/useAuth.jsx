import { createContext, useContext, useState, useEffect } from 'react'
import { auth, token } from '../api/client'

// Shared auth state across the whole app.
// user === undefined  →  still verifying (loading)
// user === null       →  not logged in
// user === { ... }    →  logged in
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    if (!token.get()) {
      setUser(null)
      return
    }
    // Verify the stored token is still valid and hydrate user data
    auth.me()
      .then(setUser)
      .catch(() => {
        token.clear()
        setUser(null)
      })
  }, [])

  function logout() {
    auth.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
