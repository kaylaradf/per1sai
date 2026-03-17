import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import errorVisual from '../assets/errors/404.svg'
import ErrorPanel from '../components/ErrorPanel'

function resolveErrorDetails(error) {
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return {
        code: '404',
        message: 'Route yang kamu buka tidak tersedia atau resource yang diminta tidak ditemukan.',
        title: 'Halaman Tidak Ditemukan',
      }
    }

    return {
      code: String(error.status || 'ERR'),
      message: error.statusText || 'Terjadi error saat membuka halaman.',
      title: 'Route Error',
    }
  }

  return {
    code: 'ERR',
    message: error instanceof Error ? error.message : 'Terjadi error yang tidak terduga.',
    title: 'Route Error',
  }
}

export default function RouteErrorPage({ mode = 'app' }) {
  const error = useRouteError()
  const details = resolveErrorDetails(error)
  const actionTo = mode === 'admin' ? '/admin' : '/'
  const actionLabel = mode === 'admin' ? 'Kembali ke Admin' : 'Kembali ke Home'

  return (
    <main className={`route-error-shell ${mode === 'admin' ? 'route-error-shell--admin' : ''}`}>
      <section className="route-error-window">
        <header className="window-header">
          <button type="button" className="window-control" aria-hidden="true" />
          <div className="title-bar-lines" />
          <h1 className="window-title">Error Handler</h1>
          <div className="title-bar-lines" />
          <span className="window-zoom" aria-hidden="true">
            <span />
          </span>
        </header>
        <div className="window-content">
          <ErrorPanel
            visual={errorVisual}
            code={details.code}
            title={details.title}
            message={details.message}
            actionLabel={actionLabel}
            actionTo={actionTo}
            secondaryActionLabel="Reload"
            secondaryActionTo={mode === 'admin' ? '/admin/login' : '/'}
          />
          <p className="error-meta">
            Jika error ini muncul terus, cek route yang dibuka atau muat ulang aplikasi dari awal.
          </p>
        </div>
        <footer className="window-status">
          <Link to={actionTo}>SYSTEM RECOVERY LINK</Link>
        </footer>
      </section>
    </main>
  )
}
