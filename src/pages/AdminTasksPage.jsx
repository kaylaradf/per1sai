import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminConfirmDialog, AdminRetroWindow } from '../components/AdminRetroWindow'
import { useAdminAuth } from '../context/adminAuthStore'
import useAsyncData from '../hooks/useAsyncData'
import { createAdminRecord, deleteAdminRecord, fetchAdminCollection, updateAdminRecord } from '../lib/adminAuth'
import { getMaterialViewTarget } from '../lib/materialActions'
import {
  fetchAdminSelectors,
  filterCoursesBySemester,
  formatAdminDateLabel,
  getAdminFileUrl,
  getDerivedTaskStatus,
  toDateInputValue,
  toPocketBaseEndOfDay,
} from '../lib/adminResources'

const priorityLabels = {
  high: 'High',
  low: 'Low',
  medium: 'Medium',
}

function createEmptyForm() {
  return {
    attachment: null,
    courseId: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    semesterId: '',
    title: '',
    type: '',
  }
}

export default function AdminTasksPage() {
  const { auth } = useAdminAuth()
  const [refreshSeed, setRefreshSeed] = useState(0)
  const [editingId, setEditingId] = useState('')
  const [query, setQuery] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('all')
  const [courseFilter, setCourseFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [form, setForm] = useState(createEmptyForm)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef(null)

  const { data, loading, error } = useAsyncData(
    async () => {
      const [selectors, tasksResponse] = await Promise.all([
        fetchAdminSelectors(auth.token),
        fetchAdminCollection('tasks', auth.token, { perPage: 500, expand: 'course,semester', sort: 'due_date' }),
      ])

      return {
        ...selectors,
        tasks: tasksResponse.items.map((record) => ({
          attachmentName: record.attachment || '',
          attachmentUrl: getAdminFileUrl(record, 'attachment'),
          courseId: record.course || '',
          courseName: record.expand?.course?.name || '',
          description: record.description || '',
          dueDate: record.due_date || '',
          id: record.id,
          priority: record.priority || 'medium',
          semesterId: record.semester || '',
          semesterName: record.expand?.semester?.name || '',
          status: getDerivedTaskStatus(record),
          title: record.title || 'Untitled Task',
          type: record.type || '',
        })),
      }
    },
    `admin-tasks:${auth?.record?.id || 'guest'}:${refreshSeed}`,
    {
      courses: [],
      semesters: [],
      tasks: [],
    },
  )

  const availableFormCourses = useMemo(
    () => filterCoursesBySemester(data.courses, form.semesterId),
    [data.courses, form.semesterId],
  )

  const availableFilterCourses = useMemo(
    () => filterCoursesBySemester(data.courses, semesterFilter === 'all' ? '' : semesterFilter),
    [data.courses, semesterFilter],
  )

  const filteredTasks = useMemo(() => {
    return [...data.tasks]
      .filter((task) => {
        const normalizedQuery = query.trim().toLowerCase()
        const matchesQuery =
          !normalizedQuery ||
          task.title.toLowerCase().includes(normalizedQuery) ||
          task.description.toLowerCase().includes(normalizedQuery) ||
          task.type.toLowerCase().includes(normalizedQuery) ||
          task.courseName.toLowerCase().includes(normalizedQuery)
        const matchesSemester = semesterFilter === 'all' || task.semesterId === semesterFilter
        const matchesCourse = courseFilter === 'all' || task.courseId === courseFilter
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter

        return matchesQuery && matchesSemester && matchesCourse && matchesPriority && matchesStatus
      })
      .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
  }, [courseFilter, data.tasks, priorityFilter, query, semesterFilter, statusFilter])

  const statusSummary = useMemo(
    () => ({
      expired: data.tasks.filter((task) => task.status === 'expired').length,
      inProgress: data.tasks.filter((task) => task.status === 'in_progress').length,
    }),
    [data.tasks],
  )

  function resetForm() {
    setEditingId('')
    setForm(createEmptyForm())
    setFormError('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function closeFormModal() {
    resetForm()
    setIsFormOpen(false)
  }

  function openCreateModal() {
    resetForm()
    setIsFormOpen(true)
  }

  function startEditing(task) {
    setEditingId(task.id)
    setForm({
      attachment: null,
      courseId: task.courseId,
      description: task.description,
      dueDate: toDateInputValue(task.dueDate),
      priority: task.priority,
      semesterId: task.semesterId,
      title: task.title,
      type: task.type,
    })
    setFormError('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    setIsFormOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.title.trim() || !form.semesterId || !form.courseId || !form.type.trim() || !form.dueDate) {
      setFormError('Judul, semester, matkul, tipe, dan due date wajib diisi.')
      return
    }

    setSubmitting(true)
    setFormError('')

    try {
      const formData = new FormData()
      formData.set('title', form.title.trim())
      formData.set('semester', form.semesterId)
      formData.set('course', form.courseId)
      formData.set('description', form.description.trim())
      formData.set('type', form.type.trim())
      formData.set('priority', form.priority)
      formData.set('due_date', toPocketBaseEndOfDay(form.dueDate))
      formData.set('status', 'pending')

      if (form.attachment) {
        formData.set('attachment', form.attachment)
      }

      if (editingId) {
        await updateAdminRecord('tasks', editingId, auth.token, formData)
      } else {
        await createAdminRecord('tasks', auth.token, formData)
      }

      closeFormModal()
      setRefreshSeed((value) => value + 1)
    } catch (submitError) {
      setFormError(submitError.message || 'Gagal menyimpan task')
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
      await deleteAdminRecord('tasks', pendingDelete.id, auth.token)

      if (editingId === pendingDelete.id) {
        closeFormModal()
      }

      setPendingDelete(null)
      setRefreshSeed((value) => value + 1)
    } catch (deleteError) {
      setFormError(deleteError.message || 'Gagal menghapus task')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="admin-shell">
      <section className="admin-panel admin-panel--wide">
        <div className="admin-header">
          <div>
            <h1>Tasks</h1>
            <p className="admin-copy">
              {loading
                ? 'Loading tasks...'
                : `${data.tasks.length} tasks. In Progress ${statusSummary.inProgress} · Expired ${statusSummary.expired}.`}
            </p>
          </div>
          <Link to="/admin" className="ghost-btn">
            Back
          </Link>
        </div>

        {(error || formError) && <p className="admin-error">{error?.message || formError}</p>}

        <section className="admin-section">
          <div className="admin-status-row">
            <span className="admin-status-chip">In Progress: {statusSummary.inProgress}</span>
            <span className="admin-status-chip admin-status-chip--danger">Expired: {statusSummary.expired}</span>
          </div>

          <div className="toolbar admin-toolbar admin-toolbar--multi">
            <label className="toolbar-field">
              <span>Cari task</span>
              <input
                className="toolbar-input"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari judul, deskripsi, tipe, atau matkul"
              />
            </label>
            <label className="toolbar-field toolbar-field--compact">
              <span>Semester</span>
              <select
                className="toolbar-select"
                value={semesterFilter}
                onChange={(event) => {
                  const nextSemester = event.target.value
                  setSemesterFilter(nextSemester)
                  setCourseFilter('all')
                }}
              >
                <option value="all">Semua</option>
                {data.semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    {semester.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="toolbar-field toolbar-field--compact">
              <span>Matkul</span>
              <select className="toolbar-select" value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)}>
                <option value="all">Semua</option>
                {availableFilterCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="toolbar-field toolbar-field--compact">
              <span>Prioritas</span>
              <select className="toolbar-select" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
                <option value="all">Semua</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
            <label className="toolbar-field toolbar-field--compact">
              <span>Status</span>
              <select className="toolbar-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">Semua</option>
                <option value="in_progress">In Progress</option>
                <option value="expired">Expired</option>
              </select>
            </label>
            <button type="button" className="action-btn" onClick={openCreateModal}>
              Tambah Task
            </button>
          </div>

          <p className="list-summary">Menampilkan {filteredTasks.length} dari {data.tasks.length} tasks.</p>

          {loading ? (
            <p className="empty-state">Memuat task...</p>
          ) : filteredTasks.length ? (
            <>
              <div className="materials-table-wrap">
                <table className="materials-table admin-tasks-table">
                  <thead>
                    <tr>
                      <th>Judul</th>
                      <th>Matkul</th>
                      <th>Semester</th>
                      <th>Tipe</th>
                      <th>Prioritas</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task) => (
                      (() => {
                        const viewTarget = getMaterialViewTarget({
                          fileName: task.attachmentName,
                          url: task.attachmentUrl,
                          viewUrl: task.attachmentUrl,
                        })

                        return (
                          <tr key={task.id}>
                            <td>
                              <strong>{task.title}</strong>
                              {task.description ? <p className="admin-table-copy">{task.description}</p> : null}
                            </td>
                            <td>{task.courseName || '-'}</td>
                            <td>{task.semesterName || '-'}</td>
                            <td>{task.type || '-'}</td>
                            <td>{priorityLabels[task.priority] || task.priority}</td>
                            <td>{formatAdminDateLabel(task.dueDate)}</td>
                            <td>{task.status === 'expired' ? 'Expired' : 'In Progress'}</td>
                            <td>
                              <div className="material-actions">
                                <button type="button" className="action-btn" onClick={() => startEditing(task)}>
                                  Edit
                                </button>
                                {viewTarget.href ? (
                                  <a href={viewTarget.href} target="_blank" rel="noreferrer" className="ghost-btn">
                                    View
                                  </a>
                                ) : null}
                                <button type="button" className="ghost-btn" onClick={() => setPendingDelete(task)}>
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })()
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="materials-mobile-list">
                {filteredTasks.map((task) => {
                  const viewTarget = getMaterialViewTarget({
                    fileName: task.attachmentName,
                    url: task.attachmentUrl,
                    viewUrl: task.attachmentUrl,
                  })

                  return (
                    <article key={task.id} className="material-card">
                      <h3>{task.title}</h3>
                      <p>
                        {task.courseName || '-'} · {priorityLabels[task.priority] || task.priority} ·{' '}
                        {task.status === 'expired' ? 'Expired' : 'In Progress'}
                      </p>
                      <p>Due: {formatAdminDateLabel(task.dueDate)}</p>
                      {task.description ? <p>{task.description}</p> : null}
                      <div className="material-actions">
                        <button type="button" className="action-btn" onClick={() => startEditing(task)}>
                          Edit
                        </button>
                        {viewTarget.href ? (
                          <a href={viewTarget.href} target="_blank" rel="noreferrer" className="ghost-btn">
                            View
                          </a>
                        ) : null}
                        <button type="button" className="ghost-btn" onClick={() => setPendingDelete(task)}>
                          Delete
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </>
          ) : (
            <p className="empty-state">Belum ada task yang cocok dengan filter.</p>
          )}
        </section>
      </section>

      {isFormOpen && (
        <AdminRetroWindow
          title={editingId ? 'Edit Task' : 'Tambah Task'}
          onClose={closeFormModal}
          wide
          footer={
            <div className="admin-inline-actions">
              <button type="button" className="ghost-btn" onClick={closeFormModal} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" form="task-form" className="action-btn" disabled={submitting}>
                {submitting ? 'Saving...' : editingId ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          }
        >
          <form id="task-form" className="admin-form admin-form--materials" onSubmit={handleSubmit}>
            <label className="admin-field admin-field--full">
              <span>Judul</span>
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                required
              />
            </label>

            <label className="admin-field">
              <span>Semester</span>
              <select
                value={form.semesterId}
                onChange={(event) => {
                  const semesterId = event.target.value
                  setForm((current) => ({ ...current, semesterId, courseId: '' }))
                }}
                required
              >
                <option value="">Pilih semester</option>
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
                required
              >
                <option value="">Pilih matkul</option>
                {availableFormCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span>Tipe</span>
              <input
                type="text"
                value={form.type}
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                placeholder="Assignment / Quiz / Report"
                required
              />
            </label>

            <label className="admin-field">
              <span>Prioritas</span>
              <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>

            <label className="admin-field">
              <span>Due Date</span>
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                required
              />
            </label>

            <label className="admin-field admin-field--full">
              <span>Deskripsi</span>
              <textarea
                rows="4"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
            </label>

            <label className="admin-field admin-field--full">
              <span>Attachment</span>
              <input
                ref={fileInputRef}
                type="file"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    attachment: event.target.files?.[0] || null,
                  }))
                }
              />
            </label>
          </form>
        </AdminRetroWindow>
      )}

      {pendingDelete && (
        <AdminConfirmDialog
          title="Hapus Task"
          message={`Hapus "${pendingDelete.title}" dari daftar task?`}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
          busy={submitting}
          confirmLabel="Delete"
        />
      )}
    </main>
  )
}
