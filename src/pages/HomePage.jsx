import Breadcrumbs from '../components/Breadcrumbs'
import FolderGrid from '../components/FolderGrid'
import { getSemesters } from '../data/mockDb'
import useDesktopPageMeta from '../hooks/useDesktopPageMeta'

export default function HomePage() {
  const semesters = getSemesters()
  const totalCourses = semesters.reduce((sum, semester) => sum + semester.courses.length, 0)

  useDesktopPageMeta('University Archive', `${semesters.length} semester · ${totalCourses} mata kuliah`)

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
        Navigasi materi kuliah dimulai dari semester. Seed dummy sekarang lebih padat supaya UI tetap teruji saat data
        membesar.
      </p>
      <FolderGrid items={folders} />
    </div>
  )
}
