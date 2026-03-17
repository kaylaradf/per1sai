import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import DailySplashOverlay from './DailySplashOverlay'
import { useDesktopMeta } from '../context/desktopMetaStore'

const navItems = [
  { label: 'Tugas', to: '/tasks' },
  { label: 'Jadwal', to: '/schedule' },
  { label: 'Pengumuman', to: '/announcements' },
  { label: 'About', to: '/about' },
]
const dailySplashStorageKey = 'archive-daily-splash'

function getTodayStorageValue() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatClock(date) {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function DesktopLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [clock, setClock] = useState(() => new Date())
  const [showDailySplash, setShowDailySplash] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    const todayValue = getTodayStorageValue()

    try {
      const lastSeenValue = window.localStorage.getItem(dailySplashStorageKey)

      if (lastSeenValue === todayValue) {
        return false
      }

      window.localStorage.setItem(dailySplashStorageKey, todayValue)
      return true
    } catch {
      return true
    }
  })
  const { meta } = useDesktopMeta()

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClock(new Date())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!showDailySplash) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setShowDailySplash(false)
    }, 2200)

    return () => window.clearTimeout(timer)
  }, [showDailySplash])

  const handleWindowClose = () => {
    if (location.pathname === '/') {
      return
    }

    navigate(-1)
  }

  return (
    <div className="desktop-app">
      {showDailySplash ? <DailySplashOverlay onClose={() => setShowDailySplash(false)} /> : null}
      <nav className="top-nav" data-purpose="top-navigation">
        <button className="brand-mark" type="button" onClick={() => navigate('/')} aria-label="Go home">
          <svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16" aria-hidden="true">
            <path d="M2 6h7l2 2h11v10H2z" />
            <path d="M2 8h20v10H2z" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
        <div className="menu-row">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)

            return (
              <button
                key={item.to}
                type="button"
                className={`menu-item ${isActive ? 'is-active' : ''}`}
                onClick={() => navigate(item.to)}
              >
                {item.label}
              </button>
            )
          })}
        </div>
        <div className="clock">{formatClock(clock)}</div>
      </nav>

      <main className="desktop-workspace" data-purpose="desktop-workspace">
        <button className="desktop-icon drive-icon" type="button" onClick={() => navigate('/')}>
          <span className="icon-chip">
            <span className="chip-line" />
            <span className="chip-dot" />
          </span>
          <span>Archive HD</span>
        </button>

        <div className="desktop-icon trash-icon" aria-hidden="true">
          <span className="trash-lid" />
          <span className="trash-body">
            <span />
            <span />
            <span />
          </span>
          <span>Trash</span>
        </div>

        <section className="archive-window" data-purpose="archive-window">
          <header className="window-header">
            <button
              type="button"
              className="window-control"
              aria-label="Toggle archive window"
              onClick={handleWindowClose}
            />
            <div className="title-bar-lines" />
            <h1 className="window-title">{meta.title}</h1>
            <div className="title-bar-lines" />
            <span className="window-zoom" aria-hidden="true">
              <span />
            </span>
          </header>

          <div className="window-content">
            <Outlet />
          </div>

          <footer className="window-status">{meta.status}</footer>
        </section>
      </main>
    </div>
  )
}
