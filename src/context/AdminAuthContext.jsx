import { useCallback, useMemo, useState } from 'react'
import AdminAuthContext from './adminAuthStore'
import { clearStoredAdminAuth, getStoredAdminAuth, loginAdmin as loginAdminRequest } from '../lib/adminAuth'

export function AdminAuthProvider({ children }) {
  const [auth, setAuth] = useState(() => getStoredAdminAuth())

  const login = useCallback(async (identity, password) => {
    const nextAuth = await loginAdminRequest(identity, password)
    setAuth(nextAuth)
    return nextAuth
  }, [])

  const logout = useCallback(() => {
    clearStoredAdminAuth()
    setAuth(null)
  }, [])

  const value = useMemo(
    () => ({
      auth,
      isAuthenticated: Boolean(auth?.token),
      login,
      logout,
    }),
    [auth, login, logout],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}
