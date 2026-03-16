import { Link, useParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import FolderGrid from '../components/FolderGrid'
import { getCourseById, getSemesterById } from '../data/mockDb'
import useDesktopPageMeta from '../hooks/useDesktopPageMeta'

const categoryLabels = {
  teori: 'Teori',
  praktikum: 'Praktikum',
}

export default function CoursePage() {
  const { semesterId, courseId } = useParams()
  const semester = getSemesterById(semesterId)
  const course = getCourseById(semesterId, courseId)
  const totalMaterials = course ? Object.values(course.categories).flat().length : 0

  const title = course ? course.name : 'Mata kuliah tidak ditemukan'
  const status = course ? `${totalMaterials} materi · 2 kategori` : 'Periksa semester/mata kuliah'

  useDesktopPageMeta(title, status)

  if (!semester || !course) {
    return (
      <div className="page-content">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Not Found' }]} />
        <p className="empty-state">Mata kuliah tidak ditemukan.</p>
        <Link to="/" className="text-link">
          Kembali ke Home
        </Link>
      </div>
    )
  }

  const folders = Object.entries(course.categories).map(([category, materials]) => ({
    id: category,
    label: categoryLabels[category],
    to: `/semester/${semester.id}/matkul/${course.id}/${category}`,
    meta: `${materials.length} materi`,
  }))

  return (
    <div className="page-content">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: semester.name, to: `/semester/${semester.id}` },
          { label: course.name },
        ]}
      />
      <p className="page-description">Pilih kategori untuk melihat daftar file materi.</p>
      <FolderGrid items={folders} emptyMessage="Kategori belum tersedia." />
    </div>
  )
}
