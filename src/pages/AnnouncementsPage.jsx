import { useState } from 'react'
import Breadcrumbs from '../components/Breadcrumbs'
import LoadingPanel from '../components/LoadingPanel'
import { getAnnouncementsFeed } from '../data/archiveApi'
import useAsyncData from '../hooks/useAsyncData'
import useDesktopPageMeta from '../hooks/useDesktopPageMeta'

export default function AnnouncementsPage() {
  const { data, loading } = useAsyncData(
    () => getAnnouncementsFeed(),
    'announcements',
    {
      items: [],
      source: 'pocketbase',
    },
  )
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const { items, source } = data
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

  useDesktopPageMeta(
    'Announcement Board',
    loading ? 'Memuat pengumuman...' : `${items.length} pengumuman · ${source === 'mock' ? 'demo fallback' : 'PocketBase'}`,
  )

  return (
    <div className="page-content">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Pengumuman' }]} />
      <p className="live-indicator">{source === 'mock' ? 'Source fallback: demo data' : 'Live source: PocketBase'}</p>
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
      {loading ? (
        <LoadingPanel variant="page" label="Memuat pengumuman..." />
      ) : filteredItems.length === 0 ? (
        <>
          <p className="list-summary">
            Menampilkan {filteredItems.length} dari {items.length} pengumuman.
          </p>
          <p className="empty-state">Tidak ada pengumuman yang cocok dengan filter saat ini.</p>
        </>
      ) : (
        <>
          <p className="list-summary">
            Menampilkan {filteredItems.length} dari {items.length} pengumuman.
          </p>
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
        </>
      )}
    </div>
  )
}
