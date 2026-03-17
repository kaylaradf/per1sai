import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import LoadingPanel from '../components/LoadingPanel'
import { getCourseById, getMaterials, getSemesterById } from '../data/archiveApi'
import useAsyncData from '../hooks/useAsyncData'
import useDesktopPageMeta from '../hooks/useDesktopPageMeta'
import { getMaterialViewTarget, getTypeLabel } from '../lib/materialActions'

const categoryLabels = {
  teori: 'Teori',
  praktikum: 'Praktikum',
}

export default function MaterialsPage() {
  const { semesterId, courseId, category } = useParams()
  const categoryLabel = categoryLabels[category] ?? category
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [visibleCount, setVisibleCount] = useState(10)
  const { data, loading } = useAsyncData(
    async () => {
      const [semester, course, materials] = await Promise.all([
        getSemesterById(semesterId),
        getCourseById(semesterId, courseId),
        getMaterials(semesterId, courseId, category),
      ])

      return {
        course,
        materials,
        semester,
      }
    },
    `materials:${semesterId}:${courseId}:${category}`,
    {
      course: null,
      materials: [],
      semester: null,
    },
  )
  const { semester, course, materials } = data

  const title = loading ? 'Memuat materi...' : course ? `${course.name} · ${categoryLabel}` : 'Materi tidak ditemukan'
  const status = loading ? 'Sinkronisasi daftar materi' : course ? `${materials.length} materi tersedia` : 'Periksa route materi'

  useDesktopPageMeta(title, status)

  if (loading) {
    return (
      <div className="page-content">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Loading' }]} />
        <LoadingPanel variant="page" label="Memuat daftar materi..." />
      </div>
    )
  }

  if (!semester || !course || !categoryLabels[category]) {
    return (
      <div className="page-content">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Not Found' }]} />
        <p className="empty-state">Kategori materi tidak ditemukan.</p>
        <Link to="/" className="text-link">
          Kembali ke Home
        </Link>
      </div>
    )
  }

  const filteredMaterials = materials
    .filter((material) => {
      const normalizedQuery = query.trim().toLowerCase()
      const typeLabel = getTypeLabel(material.fileName)
      const matchesQuery =
        !normalizedQuery ||
        material.title.toLowerCase().includes(normalizedQuery) ||
        material.fileName.toLowerCase().includes(normalizedQuery) ||
        material.week.toLowerCase().includes(normalizedQuery)
      const matchesType = typeFilter === 'all' || typeLabel === typeFilter

      return matchesQuery && matchesType
    })
    .sort((left, right) => {
      if (sortBy === 'oldest') {
        return left.updatedAt.localeCompare(right.updatedAt)
      }

      if (sortBy === 'title') {
        return left.title.localeCompare(right.title)
      }

      return right.updatedAt.localeCompare(left.updatedAt)
    })

  const visibleMaterials = filteredMaterials.slice(0, visibleCount)
  const canLoadMore = visibleMaterials.length < filteredMaterials.length

  return (
    <div className="page-content">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: semester.name, to: `/semester/${semester.id}` },
          { label: course.name, to: `/semester/${semester.id}/matkul/${course.id}` },
          { label: categoryLabel },
        ]}
      />

      <div className="toolbar">
        <label className="toolbar-field">
          <span>Cari materi</span>
          <input
            className="toolbar-input"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setVisibleCount(10)
            }}
            placeholder="Cari judul, minggu, atau nama file"
          />
        </label>
        <label className="toolbar-field toolbar-field--compact">
          <span>Tipe</span>
          <select
            className="toolbar-select"
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value)
              setVisibleCount(10)
            }}
          >
            <option value="all">Semua</option>
            <option value="PDF">PDF</option>
            <option value="WORD">WORD</option>
            <option value="PPT">PPT</option>
          </select>
        </label>
        <label className="toolbar-field toolbar-field--compact">
          <span>Urutkan</span>
          <select
            className="toolbar-select"
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value)
              setVisibleCount(10)
            }}
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="title">Judul A-Z</option>
          </select>
        </label>
      </div>

      <p className="list-summary">
        Menampilkan {visibleMaterials.length} dari {filteredMaterials.length} materi.
      </p>

      {filteredMaterials.length === 0 ? (
        <p className="empty-state">
          {materials.length === 0
            ? 'Belum ada materi di kategori ini.'
            : 'Tidak ada materi yang cocok dengan filter saat ini.'}
        </p>
      ) : (
        <>
          <div className="materials-table-wrap">
            <table className="materials-table">
              <thead>
                <tr>
                  <th>Materi</th>
                  <th>Minggu</th>
                  <th>Tipe</th>
                  <th>Update</th>
                  <th>Ukuran</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {visibleMaterials.map((material) => {
                  const viewTarget = getMaterialViewTarget(material)

                  return (
                    <tr key={material.id}>
                    <td>{material.title}</td>
                    <td>{material.week}</td>
                    <td>
                      <span className="type-chip">{getTypeLabel(material.fileName)}</span>
                    </td>
                    <td>{material.updatedAt}</td>
                    <td>{material.size}</td>
                    <td>
                      <div className="material-actions">
                        <a href={viewTarget.href || material.url} target="_blank" rel="noreferrer" className="action-btn">
                          View
                        </a>
                        <a href={material.url} target="_blank" rel="noreferrer" className="action-btn">
                          Download
                        </a>
                      </div>
                    </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="materials-mobile-list">
            {visibleMaterials.map((material) => {
              const viewTarget = getMaterialViewTarget(material)

              return (
                <article key={material.id} className="material-card">
                  <h3>{material.title}</h3>
                  <p className="material-card-meta">
                    <span>{material.week}</span>
                    <span className="type-chip">{getTypeLabel(material.fileName)}</span>
                    <span>{material.size}</span>
                    <span>{material.updatedAt}</span>
                  </p>
                  <div className="material-actions">
                    <a href={viewTarget.href || material.url} target="_blank" rel="noreferrer" className="action-btn">
                      View
                    </a>
                    <a href={material.url} target="_blank" rel="noreferrer" className="action-btn">
                      Download
                    </a>
                  </div>
                </article>
              )
            })}
          </div>

          {canLoadMore && (
            <button type="button" className="ghost-btn" onClick={() => setVisibleCount((count) => count + 10)}>
              Load 10 materi lagi
            </button>
          )}
        </>
      )}
    </div>
  )
}
