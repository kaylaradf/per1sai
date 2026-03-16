import Breadcrumbs from '../components/Breadcrumbs'
import FolderGrid from '../components/FolderGrid'
import { getSemesters } from '../data/archiveApi'
import useAsyncData from '../hooks/useAsyncData'
import useDesktopPageMeta from '../hooks/useDesktopPageMeta'

export default function HomePage() {
  const { data: semesters, loading } = useAsyncData(() => getSemesters(), 'home', [])
  const totalCourses = semesters.reduce((sum, semester) => sum + semester.courses.length, 0)

  useDesktopPageMeta(
    'Archive',
    loading ? 'Memuat arsip dari PocketBase...' : `${semesters.length} semester · ${totalCourses} mata kuliah`,
  )

  const folders = semesters.map((semester) => ({
    id: semester.id,
    label: semester.name,
    to: `/semester/${semester.id}`,
    meta: `${semester.courses.length} mata kuliah`,
  }))

  return (
    <div className="page-content">
      <Breadcrumbs items={[{ label: 'Home' }]} />
      <p className="page-description">
        Kasih Paha
      </p>
      {loading ? <p className="empty-state">Memuat daftar semester...</p> : <FolderGrid items={folders} />}
    </div>
  )
}
