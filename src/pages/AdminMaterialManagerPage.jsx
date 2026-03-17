import { useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AdminConfirmDialog, AdminRetroWindow } from '../components/AdminRetroWindow'
import { useAdminAuth } from '../context/adminAuthStore'
import useAsyncData from '../hooks/useAsyncData'
import { getMaterialViewTarget } from '../lib/materialActions'
import {
  createAdminMaterial,
  deleteAdminMaterial,
  fetchAdminMaterialCategory,
  normalizeCategory,
  updateAdminMaterial,
} from '../lib/adminMaterials'

const categoryCopy = {
  praktikum: 'Kelola materi praktikum untuk mata kuliah ini.',
  teori: 'Kelola materi teori untuk mata kuliah ini.',
}

function createEmptyForm() {
  return {
    description: '',
    file: null,
    published: true,
    sortOrder: '',
    title: '',
    weekNumber: '',
  }
}

export default function AdminMaterialManagerPage() {
  const { auth } = useAdminAuth()
  const { category, courseId, semesterNumber } = useParams()
  const normalizedCategory = normalizeCategory(category)
  const [refreshSeed, setRefreshSeed] = useState(0)
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(createEmptyForm)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const fileInputRef = useRef(null)
  const { data, loading, error } = useAsyncData(
    () =>
      fetchAdminMaterialCategory({
        category: normalizedCategory,
        courseId,
        semesterNumber,
        token: auth.token,
      }),
    `admin-material-manager:${auth?.record?.id || 'guest'}:${semesterNumber}:${courseId}:${normalizedCategory}:${refreshSeed}`,
    {
      category: normalizedCategory,
      categoryLabel: normalizedCategory === 'praktikum' ? 'Praktikum' : 'Teori',
      course: null,
      materials: [],
      semester: null,
    },
  )

  const heading = useMemo(() => {
    if (loading) {
      return 'Loading material manager...'
    }

    if (!data.course || !data.semester) {
      return 'Material manager'
    }

    return `${data.course.name} · ${data.categoryLabel}`
  }, [data.categoryLabel, data.course, data.semester, loading])

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

  function startEditing(material) {
    setEditingId(material.id)
    setForm({
      description: material.description || '',
      file: null,
      published: Boolean(material.published),
      sortOrder: material.sortOrder ? String(material.sortOrder) : '',
      title: material.title || '',
      weekNumber: material.weekNumber ? String(material.weekNumber) : '',
    })
    setFormError('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    setIsFormOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.title.trim()) {
      setFormError('Judul materi wajib diisi.')
      return
    }

    if (!editingId && !form.file) {
      setFormError('Upload file diperlukan saat membuat materi baru.')
      return
    }

    setSubmitting(true)
    setFormError('')

    try {
      const payload = {
        category: normalizedCategory,
        courseId,
        description: form.description,
        file: form.file,
        published: form.published,
        semesterRecordId: data.semester?.id || '',
        sortOrder: Number(form.sortOrder) || 0,
        title: form.title,
        weekNumber: Number(form.weekNumber) || 0,
      }

      if (editingId) {
        await updateAdminMaterial(auth.token, editingId, payload)
      } else {
        await createAdminMaterial(auth.token, payload)
      }

      closeFormModal()
      setRefreshSeed((value) => value + 1)
    } catch (submitError) {
      setFormError(submitError.message || 'Gagal menyimpan materi')
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
      await deleteAdminMaterial(auth.token, pendingDelete.id)

      if (editingId === pendingDelete.id) {
        closeFormModal()
      }

      setPendingDelete(null)
      setRefreshSeed((value) => value + 1)
    } catch (deleteError) {
      setFormError(deleteError.message || 'Gagal menghapus materi')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="admin-shell">
      <section className="admin-panel admin-panel--wide">
        <div className="admin-header">
          <div>
            <h1>{heading}</h1>
            <p className="admin-copy">
              {loading
                ? 'Loading materials...'
                : `${data.materials.length} materi ditemukan. ${categoryCopy[normalizedCategory] || ''}`}
            </p>
          </div>
          <Link to={`/admin/materials/semester/${semesterNumber}`} className="ghost-btn">
            Back
          </Link>
        </div>

        {(error || formError) && <p className="admin-error">{error?.message || formError}</p>}

        <section className="admin-section">
          <div className="admin-section-head admin-section-head--mobile-stack">
            <div>
              <h2>Daftar Material</h2>
              <p className="admin-copy">Edit, hapus, atau cek file yang sudah ada di kategori ini.</p>
            </div>
            <button type="button" className="action-btn" onClick={openCreateModal}>
              Tambah Material
            </button>
          </div>

          {loading ? (
            <p className="empty-state">Memuat daftar materi...</p>
          ) : data.materials.length ? (
            <>
              <div className="materials-table-wrap">
                <table className="materials-table admin-materials-table">
                  <thead>
                    <tr>
                      <th>Judul</th>
                      <th>Minggu</th>
                      <th>Urut</th>
                      <th>File</th>
                      <th>Status</th>
                      <th>Update</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.materials.map((material) => (
                      (() => {
                        const viewTarget = getMaterialViewTarget({
                          driveId: material.driveId,
                          fileName: material.fileName,
                          url: material.fileUrl,
                          viewUrl: material.viewUrl,
                        })

                        return (
                          <tr key={material.id}>
                            <td>
                              <strong>{material.title}</strong>
                              {material.description ? <p className="admin-table-copy">{material.description}</p> : null}
                            </td>
                            <td>{material.weekNumber || '-'}</td>
                            <td>{material.sortOrder || '-'}</td>
                            <td>{material.fileName || '-'}</td>
                            <td>{material.published ? 'Published' : 'Draft'}</td>
                            <td>{material.updatedAt}</td>
                            <td>
                              <div className="material-actions">
                                <button type="button" className="action-btn" onClick={() => startEditing(material)}>
                                  Edit
                                </button>
                                {viewTarget.href ? (
                                  <a href={viewTarget.href} target="_blank" rel="noreferrer" className="ghost-btn">
                                    View
                                  </a>
                                ) : null}
                                <button type="button" className="ghost-btn" onClick={() => setPendingDelete(material)}>
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
                {data.materials.map((material) => {
                  const viewTarget = getMaterialViewTarget({
                    driveId: material.driveId,
                    fileName: material.fileName,
                    url: material.fileUrl,
                    viewUrl: material.viewUrl,
                  })

                  return (
                    <article key={material.id} className="material-card admin-mobile-list-card admin-mobile-list-card--triple">
                      <h3>{material.title}</h3>
                      <p>
                        Minggu {material.weekNumber || '-'} · Urut {material.sortOrder || '-'} ·{' '}
                        {material.published ? 'Published' : 'Draft'}
                      </p>
                      {material.description ? <p>{material.description}</p> : null}
                      <p>{material.fileName || 'No file attached'}</p>
                      <div className="material-actions">
                        <button type="button" className="action-btn" onClick={() => startEditing(material)}>
                          Edit
                        </button>
                        {viewTarget.href ? (
                          <a href={viewTarget.href} target="_blank" rel="noreferrer" className="ghost-btn">
                            View
                          </a>
                        ) : null}
                        <button type="button" className="ghost-btn" onClick={() => setPendingDelete(material)}>
                          Delete
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </>
          ) : (
            <p className="empty-state">Belum ada materi di kategori ini.</p>
          )}
        </section>
      </section>

      {isFormOpen && (
        <AdminRetroWindow
          title={editingId ? 'Edit Material' : 'Tambah Material'}
          onClose={closeFormModal}
          wide
          footer={
            <div className="admin-inline-actions">
              <button type="button" className="ghost-btn" onClick={closeFormModal} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" form="material-form" className="action-btn" disabled={submitting}>
                {submitting ? 'Saving...' : editingId ? 'Update Material' : 'Create Material'}
              </button>
            </div>
          }
        >
          <form id="material-form" className="admin-form admin-form--materials" onSubmit={handleSubmit}>
            <label className="admin-field">
              <span>Judul</span>
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Contoh: Modul 1"
                required
              />
            </label>

            <label className="admin-field">
              <span>Minggu</span>
              <input
                type="number"
                min="0"
                value={form.weekNumber}
                onChange={(event) => setForm((current) => ({ ...current, weekNumber: event.target.value }))}
                placeholder="1"
              />
            </label>

            <label className="admin-field">
              <span>Urutan</span>
              <input
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
                placeholder="1"
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

            <label className="admin-field admin-field--full">
              <span>Deskripsi</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows="4"
                placeholder="Catatan singkat atau deskripsi materi"
              />
            </label>

            <label className="admin-field admin-field--full">
              <span>{editingId ? 'Ganti file (opsional)' : 'File'}</span>
              <input
                ref={fileInputRef}
                type="file"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    file: event.target.files?.[0] || null,
                  }))
                }
                accept=".pdf,.doc,.docx,.ppt,.pptx"
              />
            </label>
          </form>
        </AdminRetroWindow>
      )}

      {pendingDelete && (
        <AdminConfirmDialog
          title="Hapus Material"
          message={`Hapus "${pendingDelete.title}" dari daftar materi?`}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
          busy={submitting}
          confirmLabel="Delete"
        />
      )}
    </main>
  )
}
