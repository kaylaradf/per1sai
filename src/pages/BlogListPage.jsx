import { useState } from 'react'
import { Link } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import { getBlogPosts } from '../data/mockDb'
import useDesktopPageMeta from '../hooks/useDesktopPageMeta'

export default function BlogListPage() {
  const posts = getBlogPosts()
  const [query, setQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(4)

  useDesktopPageMeta('Blog & Catatan', `${posts.length} artikel`)

  const filteredPosts = posts.filter((post) => {
    const normalizedQuery = query.trim().toLowerCase()

    return (
      !normalizedQuery ||
      post.title.toLowerCase().includes(normalizedQuery) ||
      post.excerpt.toLowerCase().includes(normalizedQuery)
    )
  })

  const visiblePosts = filteredPosts.slice(0, visibleCount)
  const canLoadMore = visiblePosts.length < filteredPosts.length

  return (
    <div className="page-content">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Info' }]} />
      <div className="toolbar">
        <label className="toolbar-field">
          <span>Cari artikel</span>
          <input
            className="toolbar-input"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setVisibleCount(4)
            }}
            placeholder="Cari judul atau ringkasan"
          />
        </label>
      </div>
      <p className="list-summary">
        Menampilkan {visiblePosts.length} dari {filteredPosts.length} artikel.
      </p>
      {visiblePosts.length === 0 ? (
        <p className="empty-state">Tidak ada artikel yang cocok dengan pencarian.</p>
      ) : (
        <div className="blog-list">
          {visiblePosts.map((post) => (
            <article key={post.id} className="blog-card">
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
              <div className="blog-meta-row">
                <span>{post.createdAt}</span>
                <Link to={`/blog/${post.slug}`} className="text-link">
                  Baca
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
      {canLoadMore && (
        <button type="button" className="ghost-btn" onClick={() => setVisibleCount((count) => count + 4)}>
          Load 4 artikel lagi
        </button>
      )}
    </div>
  )
}
