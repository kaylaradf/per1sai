import { Link } from 'react-router-dom'

function FolderIcon() {
  return (
    <svg className="folder-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22 19V7H12L10 5H2v14h20z" />
    </svg>
  )
}

export default function FolderGrid({ items, emptyMessage = 'Belum ada item.' }) {
  if (!items.length) {
    return <p className="empty-state">{emptyMessage}</p>
  }

  return (
    <div className="folder-grid">
      {items.map((item) => (
        <Link key={item.id} to={item.to} className="folder-tile">
          <FolderIcon />
          <span className="folder-label">{item.label}</span>
          {item.meta && <span className="folder-meta">{item.meta}</span>}
        </Link>
      ))}
    </div>
  )
}
