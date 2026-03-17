import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAdminAuth } from '../context/adminAuthStore'
import useAsyncData from '../hooks/useAsyncData'
import { fetchAdminCollection } from '../lib/adminAuth'
import { fetchAdminMaterialsOverview } from '../lib/adminMaterials'

const managementCollections = [
  { id: 'schedule', label: 'Schedule' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'announcements', label: 'Announcements' },
  { id: 'site_settings', label: 'Site Settings' },
]

export default function AdminDashboardPage() {
  const { auth, logout } = useAdminAuth()
  const { data, loading, error } = useAsyncData(
    async () => {
      const [materialsOverview, ...summaryResponses] = await Promise.all([
        fetchAdminMaterialsOverview(auth.token),
        ...managementCollections.map((collection) => fetchAdminCollection(collection.id, auth.token, { perPage: 1 })),
      ])

      return {
        ...materialsOverview,
        summaries: managementCollections.map((collection, index) => ({
          ...collection,
          total: summaryResponses[index].totalItems,
        })),
      }
    },
    `admin-dashboard:${auth?.record?.id || 'guest'}`,
    {
      materialGroups: [],
      summaries: [],
      totalCourses: 0,
      totalMaterials: 0,
    },
  )

  const adminLabel = useMemo(
    () => auth?.record?.name || auth?.record?.email || 'Admin',
    [auth?.record?.email, auth?.record?.name],
  )

  const materialCopy = useMemo(() => {
    if (loading) {
      return 'Loading controls...'
    }

    return `${data.totalMaterials} materials across ${data.totalCourses} courses. Klik Semester untuk masuk ke halaman pemilihan semester dan mata kuliah.`
  }, [data.totalCourses, data.totalMaterials, loading])

  return (
    <main className="admin-shell">
      <section className="admin-panel admin-panel--wide">
        <div className="admin-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p className="admin-copy">
              Signed in as <strong>{adminLabel}</strong>. Semester tidak dikelola sebagai resource CRUD karena struktur
              1-8 bersifat tetap.
            </p>
          </div>
          <button type="button" className="ghost-btn" onClick={logout}>
            Logout
          </button>
        </div>

        {error && <p className="admin-error">{error.message}</p>}

        <section className="admin-section">
          <div className="admin-section-head">
            <div>
              <h2>Controls</h2>
              <p className="admin-copy">{materialCopy}</p>
            </div>
          </div>

          <div className="admin-grid">
            <Link to="/admin/materials" className="admin-card admin-card--interactive">
              <h3>Semester</h3>
              <p>{loading ? 'Loading...' : '8 semester fixed'}</p>
              <p className="task-meta">Klik untuk membuka daftar semester, lalu turun ke daftar mata kuliah.</p>
            </Link>
            {data.summaries.map((collection) => (
              <article key={collection.id} className="admin-card">
                <h3>{collection.label}</h3>
                <p>{loading ? 'Loading...' : `${collection.total ?? 0} records`}</p>
                <p className="task-meta">CRUD UI belum dipasang, tapi auth, guard, dan koneksi admin sudah siap.</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
