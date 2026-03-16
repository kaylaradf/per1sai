import { Link, useParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import FolderGrid from '../components/FolderGrid'
import { getCourseById, getSemesterById } from '../data/archiveApi'
import useAsyncData from '../hooks/useAsyncData'
import useDesktopPageMeta from '../hooks/useDesktopPageMeta'

const categoryLabels = {
  teori: 'Teori',
  praktikum: 'Praktikum',
}

export default function CoursePage() {
  const { semesterId, courseId } = useParams()
  const { data, loading } = useAsyncData(
    async () => {
      const [semester, course] = await Promise.all([getSemesterById(semesterId), getCourseById(semesterId, courseId)])

      return {
        course,
        semester,
      }
    },
    `course:${semesterId}:${courseId}`,
    {
      course: null,
      semester: null,
    },
  )
  const { semester, course } = data
  const totalMaterials = course ? Object.values(course.categories).flat().length : 0

  const title = loading ? 'Memuat mata kuliah...' : course ? course.name : 'Mata kuliah tidak ditemukan'
  const status = loading
    ? 'Sinkronisasi mata kuliah'
    : course
      ? `${totalMaterials} materi · 2 kategori`
      : 'Periksa semester/mata kuliah'

  useDesktopPageMeta(title, status)

  if (loading) {
    return (
      <div className="page-content">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Loading' }]} />
        <p className="empty-state">Memuat mata kuliah...</p>
      </div>
    )
  }

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
