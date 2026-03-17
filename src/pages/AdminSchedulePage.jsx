import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminConfirmDialog, AdminRetroWindow } from '../components/AdminRetroWindow'
import LoadingPanel from '../components/LoadingPanel'
import { useAdminAuth } from '../context/adminAuthStore'
import useAsyncData from '../hooks/useAsyncData'
import { createAdminRecord, deleteAdminRecord, fetchAdminCollection, updateAdminRecord } from '../lib/adminAuth'
import {
  fetchAdminSelectors,
  filterCoursesBySemester,
  findScheduleSlot,
  formatAdminDateLabel,
  getDayLabel,
  getScheduleSlotOptions,
  groupScheduleIntoGrid,
} from '../lib/adminResources'

function createEmptyForm() {
  const firstSlot = getScheduleSlotOptions()[0]

  return {
    classType: 'Kuliah',
    courseId: '',
    dayOfWeek: '1',
    endTime: firstSlot?.endTime || '',
    isActive: true,
    lecturer: '',
    room: '',
    semesterId: '',
    startTime: firstSlot?.startTime || '',
  }
}

export default function AdminSchedulePage() {
  const { auth } = useAdminAuth()
  const [refreshSeed, setRefreshSeed] = useState(0)
  const [selectedSemesterId, setSelectedSemesterId] = useState('')
  const [draftSchedules, setDraftSchedules] = useState({})
  const [editingId, setEditingId] = useState('')
  const [draggingId, setDraggingId] = useState('')
  const [dropTargetKey, setDropTargetKey] = useState('')
  const [form, setForm] = useState(createEmptyForm)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
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
  const activeScheduleEntries = draftSchedules[selectedSemesterId]?.items || semesterEntries
  const grid = useMemo(() => groupScheduleIntoGrid(activeScheduleEntries), [activeScheduleEntries])
  const slotOptions = useMemo(() => getScheduleSlotOptions(), [])
  const availableCourses = useMemo(
    () => filterCoursesBySemester(data.courses, form.semesterId || selectedSemesterId),
    [data.courses, form.semesterId, selectedSemesterId],
  )
  const draftChanges = useMemo(() => {
    const originalMap = new Map(semesterEntries.map((entry) => [entry.id, entry]))

    return activeScheduleEntries.filter((entry) => {
      const original = originalMap.get(entry.id)

      return (
        original &&
        (original.dayOfWeek !== entry.dayOfWeek ||
          original.startTime !== entry.startTime ||
          original.endTime !== entry.endTime)
      )
    })
  }, [activeScheduleEntries, semesterEntries])

  useEffect(() => {
    if (!selectedSemesterId) {
      return
    }

    setDraftSchedules((current) => {
      const existing = current[selectedSemesterId]

      if (existing?.dirty) {
        return current
      }

      return {
        ...current,
        [selectedSemesterId]: {
          dirty: false,
          items: semesterEntries,
        },
      }
    })
  }, [selectedSemesterId, semesterEntries])

  function resetForm() {
    setEditingId('')
    setForm({
      ...createEmptyForm(),
      semesterId: selectedSemesterId || '',
    })
    setFormError('')
  }

  function closeFormModal() {
    resetForm()
    setIsFormOpen(false)
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
    setIsFormOpen(true)
  }

  function openCreateFromCell(dayOfWeek, startTime, endTime) {
    const selectedSlot = findScheduleSlot(startTime, endTime)

    setEditingId('')
    setForm({
      ...createEmptyForm(),
      dayOfWeek: String(dayOfWeek),
      endTime: selectedSlot?.endTime || endTime,
      semesterId: selectedSemesterId || '',
      startTime: selectedSlot?.startTime || startTime,
    })
    setFormError('')
    setIsFormOpen(true)
  }

  function openBlankCreate() {
    resetForm()
    setIsFormOpen(true)
  }

  function resetDraftLayout() {
    setDraftSchedules((current) => ({
      ...current,
      [selectedSemesterId]: {
        dirty: false,
        items: semesterEntries,
      },
    }))
    setDraggingId('')
    setDropTargetKey('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.semesterId || !form.courseId || !form.startTime || !form.endTime) {
      setFormError('Semester, matkul, start time, dan end time wajib diisi.')
      return
    }

    if (!findScheduleSlot(form.startTime, form.endTime)) {
      setFormError('Slot waktu harus mengikuti grid jadwal resmi.')
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

      setDraftSchedules((current) => ({
        ...current,
        [form.semesterId || selectedSemesterId]: {
          dirty: false,
          items: [],
        },
      }))
      closeFormModal()
      setRefreshSeed((value) => value + 1)
    } catch (submitError) {
      setFormError(submitError.message || 'Gagal menyimpan jadwal')
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
      await deleteAdminRecord('schedule', pendingDelete.id, auth.token)

      if (editingId === pendingDelete.id) {
        closeFormModal()
      }

      setDraftSchedules((current) => ({
        ...current,
        [pendingDelete.semesterId || selectedSemesterId]: {
          dirty: false,
          items: [],
        },
      }))
      setPendingDelete(null)
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
      setDraftSchedules((current) => ({
        ...current,
        [form.semesterId || selectedSemesterId]: {
          dirty: false,
          items: [],
        },
      }))
      setRefreshSeed((value) => value + 1)
    } catch (duplicateError) {
      setFormError(duplicateError.message || 'Gagal duplicate entry')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleMoveEntry(entry, dayOfWeek, startTime, endTime) {
    if (!entry || submitting) {
      return
    }

    if (entry.dayOfWeek === dayOfWeek && entry.startTime === startTime && entry.endTime === endTime) {
      setDraggingId('')
      setDropTargetKey('')
      return
    }

    setFormError('')

    setDraftSchedules((current) => {
      const currentSemesterDraft = current[selectedSemesterId]?.items || semesterEntries
      const nextItems = currentSemesterDraft.map((item) =>
        item.id === entry.id
          ? {
              ...item,
              dayOfWeek,
              endTime,
              startTime,
              timeRange: `${startTime} - ${endTime}`,
            }
          : item,
      )

      return {
        ...current,
        [selectedSemesterId]: {
          dirty: true,
          items: nextItems,
        },
      }
    })

    if (editingId === entry.id) {
      setForm((current) => ({
        ...current,
        dayOfWeek: String(dayOfWeek),
        endTime,
        startTime,
      }))
    }

    setDraggingId('')
    setDropTargetKey('')
  }

  function handleDragStart(entry) {
    if (submitting) {
      return
    }

    setDraggingId(entry.id)
    setDropTargetKey('')
  }

  function handleDragEnd() {
    setDraggingId('')
    setDropTargetKey('')
  }

  function handleDragOver(event, dayOfWeek, startTime, endTime) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDropTargetKey(`${dayOfWeek}-${startTime}-${endTime}`)
  }

  function handleDragLeave(dayOfWeek, startTime, endTime) {
    const currentKey = `${dayOfWeek}-${startTime}-${endTime}`

    if (dropTargetKey === currentKey) {
      setDropTargetKey('')
    }
  }

  function handleDrop(event, dayOfWeek, startTime, endTime) {
    event.preventDefault()

    const draggedId = event.dataTransfer.getData('text/plain')
    const entry = activeScheduleEntries.find((item) => item.id === draggedId)

    void handleMoveEntry(entry, dayOfWeek, startTime, endTime)
  }

  async function saveDraftLayout() {
    if (!draftChanges.length) {
      return
    }

    setSubmitting(true)
    setFormError('')

    try {
      await Promise.all(
        draftChanges.map((entry) =>
          updateAdminRecord('schedule', entry.id, auth.token, {
            class_type: entry.classType,
            course: entry.courseId,
            day_of_week: Number(entry.dayOfWeek),
            end_time: entry.endTime,
            is_active: entry.isActive,
            lecturer: entry.lecturer.trim(),
            room: entry.room.trim(),
            semester: entry.semesterId,
            start_time: entry.startTime,
            subject: entry.courseCode || entry.courseName || entry.subject || '',
            time: `${entry.startTime} - ${entry.endTime}`,
          }),
        ),
      )

      setDraftSchedules((current) => ({
        ...current,
        [selectedSemesterId]: {
          dirty: false,
          items: activeScheduleEntries,
        },
      }))
      setRefreshSeed((value) => value + 1)
    } catch (saveError) {
      setFormError(saveError.message || 'Gagal menyimpan draft jadwal')
    } finally {
      setSubmitting(false)
      setDraggingId('')
      setDropTargetKey('')
    }
  }

  return (
    <main className="admin-shell">
      <section className="admin-panel admin-panel--wide admin-panel--xwide">
        <div className="admin-header">
          <div>
            <h1>Schedule</h1>
            <p className="admin-copy">{loading ? '' : `${semesterEntries.length} entry untuk semester yang dipilih.`}</p>
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
              <p className="admin-copy">
                Klik cell kosong untuk quick add, klik entry untuk edit, atau drag card ke slot lain lalu simpan draft.
              </p>
            </div>
            <div className="admin-inline-actions">
              <button type="button" className="action-btn" onClick={openBlankCreate}>
                Tambah Entry
              </button>
              {draftChanges.length > 0 && (
                <>
                  <button type="button" className="ghost-btn" onClick={resetDraftLayout} disabled={submitting}>
                    Reset Draft
                  </button>
                  <button type="button" className="action-btn" onClick={saveDraftLayout} disabled={submitting}>
                    {submitting ? 'Updating...' : `Update Entry (${draftChanges.length})`}
                  </button>
                </>
              )}
            </div>
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
            <LoadingPanel variant="section" label="Memuat grid jadwal..." />
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
                        <td className={`admin-schedule-time ${row.type === 'break' ? 'is-break' : ''}`}>{row.label}</td>
                        {row.type === 'break' ? (
                          <td colSpan={grid.columns.length} className="admin-schedule-break">
                            Waktu istirahat
                          </td>
                        ) : (
                          grid.columns.map((column) => (
                            <td key={`${row.key}-${column.dayIndex}`} className="admin-schedule-cell">
                              <div
                                className={`admin-schedule-dropzone ${
                                  dropTargetKey === `${column.dayIndex}-${row.startTime}-${row.endTime}` ? 'is-active' : ''
                                }`}
                                onDragOver={(event) => handleDragOver(event, column.dayIndex, row.startTime, row.endTime)}
                                onDragLeave={() => handleDragLeave(column.dayIndex, row.startTime, row.endTime)}
                                onDrop={(event) => handleDrop(event, column.dayIndex, row.startTime, row.endTime)}
                              >
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
                                      draggable={!submitting}
                                      onDragStart={(event) => {
                                        event.dataTransfer.setData('text/plain', entry.id)
                                        handleDragStart(entry)
                                      }}
                                      onDragEnd={handleDragEnd}
                                      className={`admin-schedule-entry ${entry.isActive ? '' : 'is-muted'} ${
                                        draggingId === entry.id ? 'is-dragging' : ''
                                      }`}
                                      onClick={() => startEditing(entry)}
                                    >
                                      <strong>{entry.courseCode || entry.courseName}</strong>
                                      <span>{entry.room || '-'}</span>
                                      <span>{entry.lecturer || '-'}</span>
                                      <span>{entry.classType}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </td>
                          ))
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>

      {isFormOpen && (
        <AdminRetroWindow
          title={editingId ? 'Edit Entry' : 'Tambah Entry'}
          onClose={closeFormModal}
          wide
          footer={
            <div className="admin-inline-actions">
              {editingId && (
                <>
                  <button type="button" className="ghost-btn" onClick={handleDuplicate} disabled={submitting}>
                    Duplicate
                  </button>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => setPendingDelete(data.entries.find((entry) => entry.id === editingId) || null)}
                    disabled={submitting}
                  >
                    Delete
                  </button>
                </>
              )}
              <button type="button" className="ghost-btn" onClick={closeFormModal} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" form="schedule-form" className="action-btn" disabled={submitting}>
                {submitting ? 'Saving...' : editingId ? 'Update Entry' : 'Create Entry'}
              </button>
            </div>
          }
        >
          <form id="schedule-form" className="admin-form admin-form--materials" onSubmit={handleSubmit}>
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
              <span>Slot Waktu</span>
              <select
                value={`${form.startTime}-${form.endTime}`}
                onChange={(event) => {
                  const nextSlot = slotOptions.find((slot) => slot.key === event.target.value)

                  if (!nextSlot) {
                    return
                  }

                  setForm((current) => ({
                    ...current,
                    endTime: nextSlot.endTime,
                    startTime: nextSlot.startTime,
                  }))
                }}
              >
                {slotOptions.map((slot) => (
                  <option key={slot.key} value={slot.key}>
                    {slot.label}
                  </option>
                ))}
              </select>
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

            <p className="admin-copy admin-field--full">
              {editingId
                ? `Editing entry. Last update ${formatAdminDateLabel(
                    data.entries.find((entry) => entry.id === editingId)?.updated,
                    true,
                  )}.`
                : 'Mode tambah aktif.'}
            </p>
          </form>
        </AdminRetroWindow>
      )}

      {pendingDelete && (
        <AdminConfirmDialog
          title="Hapus Entry Jadwal"
          message={`Hapus entry "${pendingDelete.courseCode || pendingDelete.courseName}" dari grid jadwal?`}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
          busy={submitting}
          confirmLabel="Delete"
        />
      )}
    </main>
  )
}
