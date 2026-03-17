import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminAuth } from '../context/adminAuthStore'
import useAsyncData from '../hooks/useAsyncData'
import { createAdminRecord, deleteAdminRecord, fetchAdminCollection, updateAdminRecord } from '../lib/adminAuth'
import {
  fetchAdminSelectors,
  filterCoursesBySemester,
  formatAdminDateLabel,
  getDayLabel,
  groupScheduleIntoGrid,
} from '../lib/adminResources'

function createEmptyForm() {
  return {
    classType: 'Kuliah',
    courseId: '',
    dayOfWeek: '1',
    endTime: '',
    isActive: true,
    lecturer: '',
    room: '',
    semesterId: '',
    startTime: '',
  }
}

export default function AdminSchedulePage() {
  const { auth } = useAdminAuth()
  const [refreshSeed, setRefreshSeed] = useState(0)
  const [selectedSemesterId, setSelectedSemesterId] = useState('')
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(createEmptyForm)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data, loading, error } = useAsyncData(
    async () => {
      const [selectors, scheduleResponse] = await Promise.all([
        fetchAdminSelectors(auth.token),
        fetchAdminCollection('schedule', auth.token, { perPage: 500, expand: 'course,semester' }),
      ])

      return {
        ...selectors,
        entries: scheduleResponse.items.map((record) => ({
          classType: record.class_type || 'Kuliah',
          courseCode: record.expand?.course?.code || '',
          courseId: record.course || '',
          courseName: record.expand?.course?.name || record.subject || 'Untitled Course',
          created: record.created || '',
          dayOfWeek: Number(record.day_of_week) || 0,
          endTime: record.end_time || '',
          id: record.id,
          isActive: Boolean(record.is_active),
          lecturer: record.lecturer || '',
          room: record.room || '',
          semesterId: record.semester || '',
          semesterName: record.expand?.semester?.name || '',
          startTime: record.start_time || '',
          subject: record.subject || '',
          timeRange: record.time || '',
          updated: record.updated || '',
        })),
      }
    },
    `admin-schedule:${auth?.record?.id || 'guest'}:${refreshSeed}`,
    {
      courses: [],
      entries: [],
      semesters: [],
    },
  )

  useEffect(() => {
    if (!selectedSemesterId && data.semesters.length) {
      setSelectedSemesterId(data.semesters[0].id)
      setForm((current) => ({ ...current, semesterId: data.semesters[0].id }))
    }
  }, [data.semesters, selectedSemesterId])

  const semesterEntries = useMemo(
    () => data.entries.filter((entry) => entry.semesterId === selectedSemesterId),
    [data.entries, selectedSemesterId],
  )
  const grid = useMemo(() => groupScheduleIntoGrid(semesterEntries), [semesterEntries])
  const availableCourses = useMemo(
    () => filterCoursesBySemester(data.courses, form.semesterId || selectedSemesterId),
    [data.courses, form.semesterId, selectedSemesterId],
  )

  function resetForm() {
    setEditingId('')
    setForm({
      ...createEmptyForm(),
      semesterId: selectedSemesterId || '',
    })
    setFormError('')
  }

  function startEditing(entry) {
    setEditingId(entry.id)
    setForm({
      classType: entry.classType,
      courseId: entry.courseId,
      dayOfWeek: String(entry.dayOfWeek),
      endTime: entry.endTime,
      isActive: entry.isActive,
      lecturer: entry.lecturer,
      room: entry.room,
      semesterId: entry.semesterId,
      startTime: entry.startTime,
    })
    setFormError('')
  }

  function openCreateFromCell(dayOfWeek, startTime, endTime) {
    setEditingId('')
    setForm({
      ...createEmptyForm(),
      dayOfWeek: String(dayOfWeek),
      endTime,
      semesterId: selectedSemesterId || '',
      startTime,
    })
    setFormError('')
  }

  function openBlankCreate() {
    resetForm()
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.semesterId || !form.courseId || !form.startTime || !form.endTime) {
      setFormError('Semester, matkul, start time, dan end time wajib diisi.')
      return
    }

    if (form.startTime >= form.endTime) {
      setFormError('Start time harus lebih kecil dari end time.')
      return
    }

    setSubmitting(true)
    setFormError('')

    try {
      const course = data.courses.find((item) => item.id === form.courseId)
      const payload = {
        class_type: form.classType,
        course: form.courseId,
        day_of_week: Number(form.dayOfWeek),
        end_time: form.endTime,
        is_active: form.isActive,
        lecturer: form.lecturer.trim(),
        room: form.room.trim(),
        semester: form.semesterId,
        start_time: form.startTime,
        subject: course?.code || course?.name || '',
        time: `${form.startTime} - ${form.endTime}`,
      }

      if (editingId) {
        await updateAdminRecord('schedule', editingId, auth.token, payload)
      } else {
        await createAdminRecord('schedule', auth.token, payload)
      }

      resetForm()
      setRefreshSeed((value) => value + 1)
    } catch (submitError) {
      setFormError(submitError.message || 'Gagal menyimpan jadwal')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(recordId) {
    if (!window.confirm('Hapus entry jadwal ini?')) {
      return
    }

    setSubmitting(true)
    setFormError('')

    try {
      await deleteAdminRecord('schedule', recordId, auth.token)

      if (editingId === recordId) {
        resetForm()
      }

      setRefreshSeed((value) => value + 1)
    } catch (deleteError) {
      setFormError(deleteError.message || 'Gagal menghapus jadwal')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDuplicate() {
    if (!editingId) {
      return
    }

    if (!form.semesterId || !form.courseId || !form.startTime || !form.endTime) {
      setFormError('Lengkapi form sebelum duplicate entry.')
      return
    }

    setSubmitting(true)
    setFormError('')

    try {
      const course = data.courses.find((item) => item.id === form.courseId)
      await createAdminRecord('schedule', auth.token, {
        class_type: form.classType,
        course: form.courseId,
        day_of_week: Number(form.dayOfWeek),
        end_time: form.endTime,
        is_active: form.isActive,
        lecturer: form.lecturer.trim(),
        room: form.room.trim(),
        semester: form.semesterId,
        start_time: form.startTime,
        subject: course?.code || course?.name || '',
        time: `${form.startTime} - ${form.endTime}`,
      })
      setRefreshSeed((value) => value + 1)
    } catch (duplicateError) {
      setFormError(duplicateError.message || 'Gagal duplicate entry')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="admin-shell">
      <section className="admin-panel admin-panel--wide admin-panel--xwide">
        <div className="admin-header">
          <div>
            <h1>Schedule</h1>
            <p className="admin-copy">
              {loading ? 'Loading schedule...' : `${semesterEntries.length} entry untuk semester yang dipilih.`}
            </p>
          </div>
          <Link to="/admin" className="ghost-btn">
            Back
          </Link>
        </div>

        {(error || formError) && <p className="admin-error">{error?.message || formError}</p>}

        <section className="admin-section">
          <div className="admin-section-head">
            <div>
              <h2>Grid Jadwal</h2>
              <p className="admin-copy">Klik cell kosong untuk quick add, atau klik entry untuk edit.</p>
            </div>
            <button type="button" className="action-btn" onClick={openBlankCreate}>
              Tambah Entry
            </button>
          </div>

          <div className="day-tabs">
            {data.semesters.map((semester) => (
              <button
                key={semester.id}
                type="button"
                className={`day-tab ${semester.id === selectedSemesterId ? 'is-active' : ''}`}
                onClick={() => {
                  setSelectedSemesterId(semester.id)
                  setEditingId('')
                  setForm((current) => ({ ...createEmptyForm(), semesterId: semester.id || current.semesterId }))
                }}
              >
                {semester.name}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="empty-state">Memuat grid jadwal...</p>
          ) : (
            <div className="admin-schedule-wrap">
              <table className="admin-schedule-table">
                <thead>
                  <tr>
                    <th>Waktu</th>
                    {grid.columns.map((column) => (
                      <th key={column.dayIndex}>{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grid.rows.length === 0 ? (
                    <tr>
                      <td colSpan={grid.columns.length + 1}>
                        <p className="empty-state">Belum ada entry jadwal untuk semester ini.</p>
                      </td>
                    </tr>
                  ) : (
                    grid.rows.map((row) => (
                      <tr key={row.key}>
                        <td className="admin-schedule-time">{row.label}</td>
                        {grid.columns.map((column) => (
                          <td key={`${row.key}-${column.dayIndex}`} className="admin-schedule-cell">
                            <button
                              type="button"
                              className="admin-schedule-empty"
                              onClick={() => openCreateFromCell(column.dayIndex, row.startTime, row.endTime)}
                            >
                              +
                            </button>
                            <div className="admin-schedule-stack">
                              {row.cells[column.dayIndex].map((entry) => (
                                <button
                                  key={entry.id}
                                  type="button"
                                  className={`admin-schedule-entry ${entry.isActive ? '' : 'is-muted'}`}
                                  onClick={() => startEditing(entry)}
                                >
                                  <strong>{entry.courseCode || entry.courseName}</strong>
                                  <span>{entry.room || '-'}</span>
                                  <span>{entry.lecturer || '-'}</span>
                                  <span>{entry.classType}</span>
                                </button>
                              ))}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="admin-section">
          <div className="admin-section-head">
            <div>
              <h2>{editingId ? 'Edit Entry' : 'Tambah Entry'}</h2>
              <p className="admin-copy">
                Subject dan time dibuat otomatis dari matkul dan slot waktu. Entry nonaktif tetap terlihat di admin.
              </p>
            </div>
          </div>

          <form className="admin-form admin-form--materials" onSubmit={handleSubmit}>
            <label className="admin-field">
              <span>Semester</span>
              <select
                value={form.semesterId}
                onChange={(event) => {
                  const semesterId = event.target.value
                  setForm((current) => ({
                    ...current,
                    courseId: '',
                    semesterId,
                  }))
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
                {availableCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span>Hari</span>
              <select value={form.dayOfWeek} onChange={(event) => setForm((current) => ({ ...current, dayOfWeek: event.target.value }))}>
                {Array.from({ length: 7 }, (_, index) => (
                  <option key={index} value={index}>
                    {getDayLabel(index)}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span>Class Type</span>
              <select value={form.classType} onChange={(event) => setForm((current) => ({ ...current, classType: event.target.value }))}>
                <option value="Kuliah">Kuliah</option>
                <option value="Praktikum">Praktikum</option>
              </select>
            </label>

            <label className="admin-field">
              <span>Start Time</span>
              <input
                type="time"
                value={form.startTime}
                onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
                required
              />
            </label>

            <label className="admin-field">
              <span>End Time</span>
              <input
                type="time"
                value={form.endTime}
                onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))}
                required
              />
            </label>

            <label className="admin-field">
              <span>Ruang</span>
              <input
                type="text"
                value={form.room}
                onChange={(event) => setForm((current) => ({ ...current, room: event.target.value }))}
              />
            </label>

            <label className="admin-field">
              <span>Dosen</span>
              <input
                type="text"
                value={form.lecturer}
                onChange={(event) => setForm((current) => ({ ...current, lecturer: event.target.value }))}
              />
            </label>

            <label className="admin-field admin-field--checkbox">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              <span>Active</span>
            </label>

            <div className="admin-actions admin-actions--split">
              <div className="admin-copy">
                {editingId
                  ? `Editing entry. Last update ${formatAdminDateLabel(
                      data.entries.find((entry) => entry.id === editingId)?.updated,
                      true,
                    )}.`
                  : 'Mode tambah aktif.'}
              </div>
              <div className="admin-inline-actions">
                {editingId && (
                  <>
                    <button type="button" className="ghost-btn" onClick={handleDuplicate} disabled={submitting}>
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => handleDelete(editingId)}
                      disabled={submitting}
                    >
                      Delete
                    </button>
                    <button type="button" className="ghost-btn" onClick={resetForm} disabled={submitting}>
                      Cancel
                    </button>
                  </>
                )}
                <button type="submit" className="action-btn" disabled={submitting}>
                  {submitting ? 'Saving...' : editingId ? 'Update Entry' : 'Create Entry'}
                </button>
              </div>
            </div>
          </form>
        </section>
      </section>
    </main>
  )
}

