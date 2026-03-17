import loadingVisual from '../assets/loading/daily-loading.svg'

export default function DailySplashOverlay({ onClose }) {
  return (
    <div className="daily-splash" role="presentation" onClick={onClose}>
      <div className="daily-splash__panel">
        <div className="daily-splash__stage">
          <img className="daily-splash__visual" src={loadingVisual} alt="" />
        </div>
        <p className="daily-splash__label">Loading archive session...</p>
      </div>
    </div>
  )
}
