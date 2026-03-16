import { Link } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import useDesktopPageMeta from '../hooks/useDesktopPageMeta'

export default function NotFoundPage() {
  useDesktopPageMeta('404', 'Halaman tidak ditemukan')

  return (
    <div className="page-content">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: '404' }]} />
      <p className="empty-state">Halaman yang kamu cari tidak tersedia.</p>
      <Link to="/" className="text-link">
        Kembali ke Home
      </Link>
    </div>
  )
}
