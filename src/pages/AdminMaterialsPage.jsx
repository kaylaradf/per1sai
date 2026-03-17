import { Link, useParams } from 'react-router-dom'
import { useAdminAuth } from '../context/adminAuthStore'
import useAsyncData from '../hooks/useAsyncData'
import { fetchAdminMaterialsOverview } from '../lib/adminMaterials'

export default function AdminMaterialsPage() {
  const { auth } = useAdminAuth()
  const { semesterNumber } = useParams()
  const activeSemesterNumber = Number(semesterNumber) || 0
  const { data, loading, error } = useAsyncData(
    () => fetchAdminMaterialsOverview(auth.token),
    `admin-materials:${auth?.record?.id || 'guest'}`,
    {
      materialGroups: [],
      totalCourses: 0,
      totalMaterials: 0,
    },
  )

  const activeSemester =
    data.materialGroups.find((semester) => semester.number === activeSemesterNumber) || data.materialGroups[0]

  if (activeSemesterNumber > 0) {
    return (
      <main className="admin-shell">
        <section className="admin-panel admin-panel--wide">
          <div className="admin-header">
            <div>
              <h1>{activeSemester?.name || `Semester ${activeSemesterNumber}`}</h1>
              <p className="admin-copy">
                {loading
                  ? 'Loading courses...'
                  : `${activeSemester?.courses ?? 0} mata kuliah · ${activeSemester?.materials ?? 0} materi`}
              </p>
            </div>
            <Link to="/admin/materials" className="ghost-btn">
              Back
            </Link>
          </div>

          {error && <p className="admin-error">{error.message}</p>}

          <p className="list-summary">Pilih mata kuliah untuk turun ke kontrol materi teori dan praktikum.</p>

          {loading ? (
            <p className="empty-state">Memuat daftar mata kuliah...</p>
          ) : activeSemester?.courseItems.length ? (
            <>
              <div className="materials-table-wrap">
                <table className="materials-table admin-course-table">
                  <thead>
                    <tr>
                      <th>Mata Kuliah</th>
                      <th>Total</th>
                      <th>Teori</th>
                      <th>Praktikum</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSemester.courseItems.map((course) => (
                      <tr key={course.id}>
                        <td>{course.name}</td>
                        <td>{course.materials}</td>
                        <td>{course.teori}</td>
                        <td>{course.praktikum}</td>
                        <td>
                          <div className="material-actions">
                            <Link
                              to={`/admin/materials/semester/${activeSemesterNumber}/course/${course.id}/teori`}
                              className="action-btn"
                            >
                              Kelola Teori
                            </Link>
                            <Link
                              to={`/admin/materials/semester/${activeSemesterNumber}/course/${course.id}/praktikum`}
                              className="ghost-btn"
                            >
                              Kelola Praktikum
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="materials-mobile-list">
                {activeSemester.courseItems.map((course) => (
                  <article key={course.id} className="material-card">
                    <h3>{course.name}</h3>
                    <p>
                      Total: {course.materials} · Teori: {course.teori} · Praktikum: {course.praktikum}
                    </p>
                    <div className="material-actions">
                      <Link
                        to={`/admin/materials/semester/${activeSemesterNumber}/course/${course.id}/teori`}
                        className="action-btn"
                      >
                        Kelola Teori
                      </Link>
                      <Link
                        to={`/admin/materials/semester/${activeSemesterNumber}/course/${course.id}/praktikum`}
                        className="ghost-btn"
                      >
                        Kelola Praktikum
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <p className="empty-state">Belum ada mata kuliah untuk semester ini.</p>
          )}
        </section>
      </main>
    )
  }

  return (
    <main className="admin-shell">
      <section className="admin-panel admin-panel--wide">
        <div className="admin-header">
          <div>
            <h1>Material Controls</h1>
            <p className="admin-copy">Pilih semester, lalu pilih mata kuliah untuk masuk ke kontrol teori/praktikum.</p>
          </div>
          <Link to="/admin" className="ghost-btn">
            Back
          </Link>
        </div>

        {error && <p className="admin-error">{error.message}</p>}

        <section className="admin-section">
          <div className="admin-section-head">
            <div>
              <h2>Semesters</h2>
              <p className="admin-copy">
                {loading
                  ? 'Loading semesters...'
                  : `${data.totalMaterials} materials across ${data.totalCourses} courses.`}
              </p>
            </div>
          </div>

          <div className="admin-grid admin-grid--semesters">
            {data.materialGroups.map((semester) => (
              <Link
                key={semester.id}
                to={`/admin/materials/semester/${semester.number}`}
                className={`admin-card admin-card--interactive ${
                  semester.number === activeSemesterNumber ? 'admin-card--active' : ''
                }`}
              >
                <h3>{semester.name}</h3>
                <p>{loading ? 'Loading...' : `${semester.courses} mata kuliah`}</p>
                <p>{loading ? 'Loading...' : `${semester.materials} materi`}</p>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
