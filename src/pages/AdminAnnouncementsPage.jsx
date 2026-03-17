import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminConfirmDialog, AdminRetroWindow } from '../components/AdminRetroWindow'
import { useAdminAuth } from '../context/adminAuthStore'
import useAsyncData from '../hooks/useAsyncData'
import { createAdminRecord, deleteAdminRecord, fetchAdminCollection, updateAdminRecord } from '../lib/adminAuth'
import {
  fetchAdminSelectors,
  filterCoursesBySemester,
  findSemesterForCourse,
  formatAdminDateLabel,
  slugifyAnnouncementTitle,
  toDateTimeInputValue,
  toPocketBaseDateTime,
} from '../lib/adminResources'

function createEmptyForm() {
  return {
    body: '',
    category: '',
    courseId: '',
    isPinned: false,
    published: true,
    publishedAt: '',
    semesterId: '',
    title: '',
  }
}

function sortAnnouncements(items) {
  return [...items].sort((left, right) => {
    const leftDate = left.publishedAt || left.created || ''
    const rightDate = right.publishedAt || right.created || ''

    if (leftDate !== rightDate) {
      return rightDate.localeCompare(leftDate)
    }

    return (right.created || '').localeCompare(left.created || '')
  })
}

export default function AdminAnnouncementsPage() {
  const { auth } = useAdminAuth()
  const [refreshSeed, setRefreshSeed] = useState(0)
  const [editingId, setEditingId] = useState('')
  const [query, setQuery] = useState('')
  const [publishedFilter, setPublishedFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [form, setForm] = useState(createEmptyForm)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const { data, loading, error } = useAsyncData(
    async () => {
      const [selectors, announcementsResponse] = await Promise.all([
        fetchAdminSelectors(auth.token),
        fetchAdminCollection('announcements', auth.token, { perPage: 500, expand: 'semester,course' }),
      ])

      return {
        ...selectors,
        announcements: sortAnnouncements(
          announcementsResponse.items.map((record) => ({
            body: record.body || '',
            category: record.category || 'General',
            courseId: record.course || '',
            courseName: record.expand?.course?.name || '',
            created: record.created || '',
            id: record.id,
            isPinned: Boolean(record.is_pinned),
            published: Boolean(record.published),
            publishedAt: record.published_at || '',
            semesterId: record.semester || '',
            semesterName: record.expand?.semester?.name || '',
            slug: record.slug || '',
            title: record.title || 'Untitled Announcement',
          })),
        ),
      }
    },
    `admin-announcements:${auth?.record?.id || 'guest'}:${refreshSeed}`,
    {
      announcements: [],
      courses: [],
      semesters: [],
    },
  )

  const categories = useMemo(
    () => ['all', ...new Set(data.announcements.map((announcement) => announcement.category).filter(Boolean))],
    [data.announcements],
  )

  const availableCourses = useMemo(
    () => filterCoursesBySemester(data.courses, form.semesterId),
    [data.courses, form.semesterId],
  )

  const filteredAnnouncements = useMemo(() => {
    return data.announcements.filter((announcement) => {
      const normalizedQuery = query.trim().toLowerCase()
      const matchesQuery =
        !normalizedQuery ||
        announcement.title.toLowerCase().includes(normalizedQuery) ||
        announcement.body.toLowerCase().includes(normalizedQuery) ||
        announcement.category.toLowerCase().includes(normalizedQuery)
      const matchesPublished =
        publishedFilter === 'all' ||
        (publishedFilter === 'published' && announcement.published) ||
        (publishedFilter === 'draft' && !announcement.published)
      const matchesCategory = categoryFilter === 'all' || announcement.category === categoryFilter

      return matchesQuery && matchesPublished && matchesCategory
    })
  }, [categoryFilter, data.announcements, publishedFilter, query])

  function resetForm() {
    setEditingId('')
    setForm(createEmptyForm())
    setFormError('')
  }

  function closeFormModal() {
    resetForm()
    setIsFormOpen(false)
  }

  function openCreateModal() {
    resetForm()
    setIsFormOpen(true)
  }

  function startEditing(announcement) {
    setEditingId(announcement.id)
    setForm({
      body: announcement.body,
      category: announcement.category,
      courseId: announcement.courseId,
      isPinned: announcement.isPinned,
      published: announcement.published,
      publishedAt: toDateTimeInputValue(announcement.publishedAt),
      semesterId: announcement.semesterId,
      title: announcement.title,
    })
    setFormError('')
    setIsFormOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.title.trim() || !form.category.trim() || !form.body.trim()) {
      setFormError('Judul, kategori, dan isi pengumuman wajib diisi.')
      return
    }

    setSubmitting(true)
    setFormError('')

    try {
      const resolvedSemesterId = form.semesterId || (form.courseId ? findSemesterForCourse(data.courses, form.courseId) : '')
      const currentRecord = editingId ? data.announcements.find((item) => item.id === editingId) : null
      const payload = {
        body: form.body.trim(),
        category: form.category.trim(),
        course: form.courseId || '',
        is_pinned: form.isPinned,
        published: form.published,
        published_at: form.published
          ? toPocketBaseDateTime(form.publishedAt) || new Date().toISOString()
          : toPocketBaseDateTime(form.publishedAt),
        semester: resolvedSemesterId || '',
        slug: currentRecord?.slug || slugifyAnnouncementTitle(form.title),
        title: form.title.trim(),
      }

      if (editingId) {
        await updateAdminRecord('announcements', editingId, auth.token, payload)
      } else {
        await createAdminRecord('announcements', auth.token, payload)
      }

      closeFormModal()
      setRefreshSeed((value) => value + 1)
    } catch (submitError) {
      setFormError(submitError.message || 'Gagal menyimpan pengumuman')
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return
    }

    setSubmitting(true)
    setFormError('')

    try {
      await deleteAdminRecord('announcements', pendingDelete.id, auth.token)

      if (editingId === pendingDelete.id) {
        closeFormModal()
      }

      setPendingDelete(null)
      setRefreshSeed((value) => value + 1)
    } catch (deleteError) {
      setFormError(deleteError.message || 'Gagal menghapus pengumuman')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="admin-shell">
      <section className="admin-panel admin-panel--wide">
        <div className="admin-header">
          <div>
            <h1>Announcements</h1>
            <p className="admin-copy">
              {loading
                ? 'Loading announcements...'
                : `${data.announcements.length} records. Kelola draft, publish, dan metadata pengumuman.`}
            </p>
          </div>
          <Link to="/admin" className="ghost-btn">
            Back
          </Link>
        </div>

        {(error || formError) && <p className="admin-error">{error?.message || formError}</p>}

        <section className="admin-section">
          <div className="toolbar admin-toolbar">
            <label className="toolbar-field">
              <span>Cari pengumuman</span>
              <input
                className="toolbar-input"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari judul, isi, atau kategori"
              />
            </label>
            <label className="toolbar-field toolbar-field--compact">
              <span>Published</span>
              <select
                className="toolbar-select"
                value={publishedFilter}
                onChange={(event) => setPublishedFilter(event.target.value)}
              >
                <option value="all">Semua</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </label>
            <label className="toolbar-field toolbar-field--compact">
              <span>Kategori</span>
              <select
                className="toolbar-select"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'Semua' : category}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="action-btn" onClick={openCreateModal}>
              Tambah Pengumuman
            </button>
          </div>

          <p className="list-summary">Menampilkan {filteredAnnouncements.length} dari {data.announcements.length} pengumuman.</p>

          {loading ? (
            <p className="empty-state">Memuat pengumuman...</p>
          ) : filteredAnnouncements.length ? (
            <>
              <div className="materials-table-wrap">
                <table className="materials-table admin-announcements-table">
                  <thead>
                    <tr>
                      <th>Judul</th>
                      <th>Kategori</th>
                      <th>Published</th>
                      <th>Pinned</th>
                      <th>Tanggal</th>
                      <th>Semester / Matkul</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAnnouncements.map((announcement) => (
                      <tr key={announcement.id}>
                        <td>
                          <strong>{announcement.title}</strong>
                          <p className="admin-table-copy">{announcement.body}</p>
                        </td>
                        <td>{announcement.category}</td>
                        <td>{announcement.published ? 'Published' : 'Draft'}</td>
                        <td>{announcement.isPinned ? 'Pinned' : '-'}</td>
                        <td>{formatAdminDateLabel(announcement.publishedAt || announcement.created, true)}</td>
                        <td>{announcement.courseName || announcement.semesterName || '-'}</td>
                        <td>
                          <div className="material-actions">
                            <button type="button" className="action-btn" onClick={() => startEditing(announcement)}>
                              Edit
                            </button>
                            <button type="button" className="ghost-btn" onClick={() => setPendingDelete(announcement)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="materials-mobile-list">
                {filteredAnnouncements.map((announcement) => (
                  <article key={announcement.id} className="material-card">
                    <h3>{announcement.title}</h3>
                    <p>
                      {announcement.category} · {announcement.published ? 'Published' : 'Draft'} ·{' '}
                      {announcement.isPinned ? 'Pinned' : 'Not pinned'}
                    </p>
                    <p>{announcement.body}</p>
                    <p>{announcement.courseName || announcement.semesterName || '-'}</p>
                    <div className="material-actions">
                      <button type="button" className="action-btn" onClick={() => startEditing(announcement)}>
                        Edit
                      </button>
                      <button type="button" className="ghost-btn" onClick={() => setPendingDelete(announcement)}>
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <p className="empty-state">Belum ada pengumuman yang cocok dengan filter.</p>
          )}
        </section>
      </section>

      {isFormOpen && (
        <AdminRetroWindow
          title={editingId ? 'Edit Announcement' : 'Tambah Announcement'}
          onClose={closeFormModal}
          wide
          footer={
            <div className="admin-inline-actions">
              <button type="button" className="ghost-btn" onClick={closeFormModal} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" form="announcement-form" className="action-btn" disabled={submitting}>
                {submitting ? 'Saving...' : editingId ? 'Update Announcement' : 'Create Announcement'}
              </button>
            </div>
          }
        >
          <form id="announcement-form" className="admin-form admin-form--materials" onSubmit={handleSubmit}>
            <label className="admin-field admin-field--full">
              <span>Judul</span>
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Judul pengumuman"
                required
              />
            </label>

            <label className="admin-field">
              <span>Kategori</span>
              <input
                type="text"
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                placeholder="System / Academic / Deadline"
                required
              />
            </label>

            <label className="admin-field">
              <span>Semester</span>
              <select
                value={form.semesterId}
                onChange={(event) => {
                  const semesterId = event.target.value
                  setForm((current) => ({
                    ...current,
                    courseId: filterCoursesBySemester(data.courses, semesterId).some((course) => course.id === current.courseId)
                      ? current.courseId
                      : '',
                    semesterId,
                  }))
                }}
              >
                <option value="">Semua semester</option>
                {data.semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    {semester.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span>Matkul</span>
              <select
                value={form.courseId}
                onChange={(event) => setForm((current) => ({ ...current, courseId: event.target.value }))}
              >
                <option value="">Semua matkul</option>
                {availableCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span>Published At</span>
              <input
                type="datetime-local"
                value={form.publishedAt}
                onChange={(event) => setForm((current) => ({ ...current, publishedAt: event.target.value }))}
              />
            </label>

            <label className="admin-field admin-field--checkbox">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(event) => setForm((current) => ({ ...current, published: event.target.checked }))}
              />
              <span>Published</span>
            </label>

            <label className="admin-field admin-field--checkbox">
              <input
                type="checkbox"
                checked={form.isPinned}
                onChange={(event) => setForm((current) => ({ ...current, isPinned: event.target.checked }))}
              />
              <span>Pinned</span>
            </label>

            <label className="admin-field admin-field--full">
              <span>Isi Pengumuman</span>
              <textarea
                value={form.body}
                onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                rows="5"
                placeholder="Isi pengumuman"
                required
              />
            </label>
          </form>
        </AdminRetroWindow>
      )}

      {pendingDelete && (
        <AdminConfirmDialog
          title="Hapus Announcement"
          message={`Hapus "${pendingDelete.title}" dari daftar pengumuman?`}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
          busy={submitting}
          confirmLabel="Delete"
        />
      )}
    </main>
  )
}
