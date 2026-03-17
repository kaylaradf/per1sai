import loadingVisual from '../assets/loading/daily-loading.svg'

export default function LoadingPanel({ className = '', label = 'Memuat data...', variant = 'section' }) {
  const panelClassName = ['loading-panel', `loading-panel--${variant}`, className].filter(Boolean).join(' ')

  return (
    <div className={panelClassName} role="status" aria-live="polite" aria-label={label}>
      <img className="loading-panel__visual" src={loadingVisual} alt="" />
      <span className="sr-only">{label}</span>
    </div>
  )
}
