import Breadcrumbs from '../components/Breadcrumbs'
import { getSiteSettings } from '../data/archiveApi'
import useAsyncData from '../hooks/useAsyncData'
import useDesktopPageMeta from '../hooks/useDesktopPageMeta'

function GitHubIcon() {
  return (
    <svg aria-hidden="true" className="github-icon" viewBox="0 0 24 24">
      <path
        d="M12 2C6.48 2 2 6.58 2 12.12c0 4.43 2.87 8.19 6.84 9.52.5.09.68-.22.68-.48 0-.24-.01-1.03-.01-1.87-2.78.61-3.37-1.19-3.37-1.19-.45-1.17-1.11-1.48-1.11-1.48-.91-.63.07-.62.07-.62 1 .07 1.53 1.04 1.53 1.04.9 1.53 2.35 1.09 2.92.83.09-.66.35-1.09.64-1.34-2.22-.26-4.56-1.13-4.56-5.02 0-1.11.39-2.01 1.03-2.72-.11-.25-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.04A9.4 9.4 0 0 1 12 6.92c.85 0 1.71.12 2.51.36 1.91-1.31 2.75-1.04 2.75-1.04.55 1.41.21 2.46.1 2.71.64.71 1.03 1.61 1.03 2.72 0 3.9-2.34 4.76-4.57 5.02.36.31.69.92.69 1.87 0 1.35-.01 2.44-.01 2.77 0 .27.18.58.69.48A10.14 10.14 0 0 0 22 12.12C22 6.58 17.52 2 12 2z"
        fill="currentColor"
      />
    </svg>
  )
}

function BlogIcon() {
  return (
    <svg aria-hidden="true" className="github-icon" viewBox="0 0 24 24">
      <path
        d="M4 5.5h16v13H4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M7 9h10M7 12h7M7 15h5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  )
}

const avatarUrl = 'https://edodema.sirv.com/projectpop.xyz/noFilter.webp'

export default function AboutPage() {
  const { data: creator, loading } = useAsyncData(() => getSiteSettings(), 'about', {
    aboutName: 'emaa',
    aboutRole: 'Creator & Maintainer.',
    aboutSummary:
      'Frontend archive interface berbasis React dengan gaya retro desktop untuk navigasi materi, tugas, jadwal, dan pengumuman.',
    blogUrl: 'https://your-blog.example',
    githubUrl: 'https://github.com/emaa/adata',
    siteTitle: 'RKSC Adata',
  })

  useDesktopPageMeta('About', loading ? 'Memuat profil...' : 'Maintainer')

  return (
    <div className="page-content">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'About' }]} />

      <section className="profile-card">
        <div className="profile-card-body">
          <div className="profile-hero">
            <div className="profile-avatar-wrap">
              <img className="profile-avatar" src={avatarUrl} alt="Profile avatar" />
            </div>
            <div className="profile-name-wrap">
              <h2>{creator.aboutName}</h2>
            </div>
          </div>

          <div className="profile-divider" />

          <p className="profile-summary">
            <strong>{creator.aboutRole}</strong> {creator.aboutSummary}
          </p>
          <div className="profile-socials">
            <a
              href={creator.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="profile-github-link"
              aria-label="Open GitHub repository"
            >
              <GitHubIcon />
            </a>
            <a
              href={creator.blogUrl}
              target="_blank"
              rel="noreferrer"
              className="profile-github-link"
              aria-label="Open personal blog"
            >
              <BlogIcon />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
