import { Link, useParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import FolderGrid from '../components/FolderGrid'
import LoadingPanel from '../components/LoadingPanel'
import { getSemesterById } from '../data/archiveApi'
import useAsyncData from '../hooks/useAsyncData'
import useDesktopPageMeta from '../hooks/useDesktopPageMeta'

export default function SemesterPage() {
  const { semesterId } = useParams()
  const { data: semester, loading } = useAsyncData(() => getSemesterById(semesterId), `semester:${semesterId}`, null)

  const title = loading ? 'Memuat semester...' : semester ? semester.name : 'Semester tidak ditemukan'
  const status = loading
    ? 'Sinkronisasi data semester'
    : semester
      ? `${semester.courses.length} mata kuliah`
      : 'Periksa route semester'

  useDesktopPageMeta(title, status)

  if (loading) {
    return (
      <div className="page-content">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Loading' }]} />
        <LoadingPanel variant="page" label="Memuat semester..." />
      </div>
    )
  }

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
