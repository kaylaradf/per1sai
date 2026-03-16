import { useEffect, useState } from 'react'
import Breadcrumbs from '../components/Breadcrumbs'
import { getAnnouncementsSeed, getAnnouncementStream } from '../data/mockDb'
import useDesktopPageMeta from '../hooks/useDesktopPageMeta'

const MAX_LIVE_ITEMS = 30

export default function AnnouncementsPage() {
  const [items, setItems] = useState(getAnnouncementsSeed)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const stream = getAnnouncementStream()
  const categories = ['all', ...new Set(items.map((item) => item.category))]
  const filteredItems = items.filter((item) => {
    const normalizedQuery = query.trim().toLowerCase()
    const matchesQuery =
      !normalizedQuery ||
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.body.toLowerCase().includes(normalizedQuery) ||
      item.category.toLowerCase().includes(normalizedQuery)
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter

    return matchesQuery && matchesCategory
  })

  useDesktopPageMeta('Announcement Board', `${items.length} pengumuman · realtime simulasi`)

  useEffect(() => {
    let index = 0

    const timer = window.setInterval(() => {
      const next = stream[index % stream.length]
      index += 1

      setItems((prev) => [
        {
          id: `sim-${Date.now()}`,
          category: next.category,
          title: next.title,
          body: next.body,
          time: 'Baru saja',
        },
        ...prev,
      ].slice(0, MAX_LIVE_ITEMS))
    }, 12000)

    return () => window.clearInterval(timer)
  }, [stream])

  return (
    <div className="page-content">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Pengumuman' }]} />
      <p className="live-indicator">Live simulation: ON</p>
      <div className="toolbar">
        <label className="toolbar-field">
          <span>Cari pengumuman</span>
          <input
            className="toolbar-input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari judul, isi, atau kategori"
          />
        </label>
        <label className="toolbar-field toolbar-field--compact">
          <span>Kategori</span>
          <select
            className="toolbar-select"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'all' ? 'Semua' : category}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="list-summary">
        Menampilkan {filteredItems.length} dari {items.length} pengumuman. History live dibatasi {MAX_LIVE_ITEMS} item.
      </p>

      {filteredItems.length === 0 ? (
        <p className="empty-state">Tidak ada pengumuman yang cocok dengan filter saat ini.</p>
      ) : (
        <div className="announcement-list">
          {filteredItems.map((item) => (
            <article key={item.id} className="announcement-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <div className="card-meta-row">
                <span className="type-chip">{item.category}</span>
                <span>{item.time}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
