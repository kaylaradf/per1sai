import { Link, useParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import { getBlogBySlug } from '../data/mockDb'
import useDesktopPageMeta from '../hooks/useDesktopPageMeta'

export default function BlogDetailPage() {
  const { slug } = useParams()
  const post = getBlogBySlug(slug)

  const title = post ? post.title : 'Artikel tidak ditemukan'
  const status = post ? `Dipublikasi ${post.createdAt}` : 'Periksa slug artikel'
  useDesktopPageMeta(title, status)

  if (!post) {
    return (
      <div className="page-content">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Info', to: '/blog' },
            { label: 'Not Found' },
          ]}
        />
        <p className="empty-state">Artikel tidak ditemukan.</p>
      </div>
    )
  }

  return (
    <div className="page-content">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Info', to: '/blog' },
          { label: post.title },
        ]}
      />
      <article className="blog-detail">
        <h2>{post.title}</h2>
        <p className="blog-date">{post.createdAt}</p>
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>
      <Link to="/blog" className="text-link">
        Kembali ke daftar blog
      </Link>
    </div>
  )
}
