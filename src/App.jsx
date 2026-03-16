import { Navigate, RouterProvider, createHashRouter } from 'react-router-dom'
import AboutPage from './pages/AboutPage'
import DesktopLayout from './components/DesktopLayout'
import { DesktopMetaProvider } from './context/DesktopMetaContext'
import AnnouncementsPage from './pages/AnnouncementsPage'
import CoursePage from './pages/CoursePage'
import HomePage from './pages/HomePage'
import MaterialsPage from './pages/MaterialsPage'
import NotFoundPage from './pages/NotFoundPage'
import SchedulePage from './pages/SchedulePage'
import SemesterPage from './pages/SemesterPage'
import TasksPage from './pages/TasksPage'

const router = createHashRouter([
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
    <DesktopMetaProvider>
      <RouterProvider router={router} />
    </DesktopMetaProvider>
  )
}

export default App
