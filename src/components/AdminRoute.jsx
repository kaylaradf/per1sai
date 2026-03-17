import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../context/adminAuthStore'

export default function AdminRoute({ children }) {
  const location = useLocation()
  const { isAuthenticated } = useAdminAuth()

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  return children
}
