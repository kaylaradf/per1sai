import { Navigate, RouterProvider, createHashRouter } from 'react-router-dom'
import AboutPage from './pages/AboutPage'
import AdminRoute from './components/AdminRoute'
import DesktopLayout from './components/DesktopLayout'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { DesktopMetaProvider } from './context/DesktopMetaContext'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminAnnouncementsPage from './pages/AdminAnnouncementsPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminMaterialManagerPage from './pages/AdminMaterialManagerPage'
import AdminMaterialsPage from './pages/AdminMaterialsPage'
import AdminSchedulePage from './pages/AdminSchedulePage'
import AdminSettingsPage from './pages/AdminSettingsPage'
import AdminTasksPage from './pages/AdminTasksPage'
import AnnouncementsPage from './pages/AnnouncementsPage'
import CoursePage from './pages/CoursePage'
import HomePage from './pages/HomePage'
import MaterialsPage from './pages/MaterialsPage'
import NotFoundPage from './pages/NotFoundPage'
import SchedulePage from './pages/SchedulePage'
import SemesterPage from './pages/SemesterPage'
import TasksPage from './pages/TasksPage'

const router = createHashRouter([
  { path: '/admin/login', element: <AdminLoginPage /> },
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminDashboardPage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/materials',
    element: (
      <AdminRoute>
        <AdminMaterialsPage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/materials/semester/:semesterNumber',
    element: (
      <AdminRoute>
        <AdminMaterialsPage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/materials/semester/:semesterNumber/course/:courseId/:category',
    element: (
      <AdminRoute>
        <AdminMaterialManagerPage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/announcements',
    element: (
      <AdminRoute>
        <AdminAnnouncementsPage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/tasks',
    element: (
      <AdminRoute>
        <AdminTasksPage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/settings',
    element: (
      <AdminRoute>
        <AdminSettingsPage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/schedule',
    element: (
      <AdminRoute>
        <AdminSchedulePage />
      </AdminRoute>
    ),
  },
  {
    element: <DesktopLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: '/semester/:semesterId', element: <SemesterPage /> },
      { path: '/semester/:semesterId/matkul/:courseId', element: <CoursePage /> },
      {
        path: '/semester/:semesterId/matkul/:courseId/:category',
        element: <MaterialsPage />,
      },
      { path: '/tasks', element: <TasksPage /> },
      { path: '/schedule', element: <SchedulePage /> },
      { path: '/announcements', element: <AnnouncementsPage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/blog', element: <Navigate to="/about" replace /> },
      { path: '/blog/:slug', element: <Navigate to="/about" replace /> },
      { path: '/info', element: <Navigate to="/about" replace /> },
      { path: '/not-found', element: <NotFoundPage /> },
      { path: '/home', element: <Navigate to="/" replace /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

function App() {
  return (
    <AdminAuthProvider>
      <DesktopMetaProvider>
        <RouterProvider router={router} />
      </DesktopMetaProvider>
    </AdminAuthProvider>
  )
}

export default App
