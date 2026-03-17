import { Link } from 'react-router-dom'

export default function ErrorPanel({
  actionLabel = 'Kembali ke Home',
  actionTo = '/',
  code = '404',
  message = 'Halaman yang kamu cari tidak tersedia.',
  secondaryActionLabel,
  secondaryActionTo,
  title = 'Page Not Found',
  visual,
}) {
  return (
    <section className="error-panel">
      <div className="error-visual-wrap">
        <img className="error-visual" src={visual} alt="" />
      </div>
      <div className="error-copy">
        <p className="error-code">{code}</p>
        <h2 className="error-title">{title}</h2>
        <p className="error-message">{message}</p>
        <div className="error-actions">
          <Link to={actionTo} className="action-btn">
            {actionLabel}
          </Link>
          {secondaryActionLabel && secondaryActionTo ? (
            <Link to={secondaryActionTo} className="action-btn action-btn--ghost">
              {secondaryActionLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}
