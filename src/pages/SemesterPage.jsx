import { Link, useParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import FolderGrid from '../components/FolderGrid'
import { getSemesterById } from '../data/mockDb'
import useDesktopPageMeta from '../hooks/useDesktopPageMeta'

export default function SemesterPage() {
  const { semesterId } = useParams()
  const semester = getSemesterById(semesterId)

  const title = semester ? semester.name : 'Semester tidak ditemukan'
  const status = semester ? `${semester.courses.length} mata kuliah` : 'Periksa route semester'

  useDesktopPageMeta(title, status)

  if (!semester) {
    return (
      <div className="page-content">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Not Found' }]} />
        <p className="empty-state">Semester tidak ditemukan.</p>
        <Link to="/" className="text-link">
          Kembali ke Home
        </Link>
      </div>
    )
  }

  const folders = semester.courses.map((course) => ({
    id: course.id,
    label: course.name,
    to: `/semester/${semester.id}/matkul/${course.id}`,
    meta: `${Object.values(course.categories).flat().length} materi`,
  }))

  return (
    <div className="page-content">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: semester.name }]} />
      <FolderGrid items={folders} emptyMessage="Belum ada mata kuliah untuk semester ini." />
    </div>
  )
}
