import errorVisual from '../assets/errors/404.svg'
import Breadcrumbs from '../components/Breadcrumbs'
import ErrorPanel from '../components/ErrorPanel'
import useDesktopPageMeta from '../hooks/useDesktopPageMeta'

export default function NotFoundPage() {
  useDesktopPageMeta('404', 'Halaman tidak ditemukan')

  return (
    <div className="page-content">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: '404' }]} />
      <ErrorPanel
        visual={errorVisual}
        code="404"
        title="Halaman Tidak Ditemukan"
        message="Route yang kamu buka tidak tersedia atau sudah dipindahkan dari arsip ini."
        actionLabel="Kembali ke Home"
        actionTo="/"
      />
    </div>
  )
}
