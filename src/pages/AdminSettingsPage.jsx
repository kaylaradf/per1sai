import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminAuth } from '../context/adminAuthStore'
import useAsyncData from '../hooks/useAsyncData'
import { createAdminRecord, fetchAdminCollection, updateAdminRecord } from '../lib/adminAuth'
import { isSafeHttpUrl, normalizeSafeExternalUrl } from '../lib/urlSafety'

function createEmptyForm() {
  return {
    aboutName: '',
    aboutRole: '',
    aboutSummary: '',
    blogUrl: '',
    githubUrl: '',
    siteTitle: '',
  }
}

export default function AdminSettingsPage() {
  const { auth } = useAdminAuth()
  const [refreshSeed, setRefreshSeed] = useState(0)
  const [form, setForm] = useState(createEmptyForm)
  const [recordId, setRecordId] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data, loading, error } = useAsyncData(
    async () => {
      const response = await fetchAdminCollection('site_settings', auth.token, { perPage: 1 })
      const record = response.items[0] || null

      const nextForm = record
        ? {
            aboutName: record.about_name || '',
            aboutRole: record.about_role || '',
            aboutSummary: record.about_summary || '',
            blogUrl: record.blog_url || '',
            githubUrl: record.github_url || '',
            siteTitle: record.site_title || '',
          }
        : createEmptyForm()

      setRecordId(record?.id || '')
      setForm(nextForm)

      return {
        hasRecord: Boolean(record),
        recordId: record?.id || '',
      }
    },
    `admin-settings:${auth?.record?.id || 'guest'}:${refreshSeed}`,
    {
      hasRecord: false,
      recordId: '',
    },
  )

  const singletonCopy = useMemo(() => (data.hasRecord ? '1 active settings record.' : 'Belum ada record settings.'), [data.hasRecord])

  async function handleSubmit(event) {
    event.preventDefault()

    if (!isSafeHttpUrl(form.githubUrl) || !isSafeHttpUrl(form.blogUrl)) {
      setFormError('GitHub URL dan Blog URL harus berupa URL valid dengan protokol http:// atau https://.')
      return
    }

    setSubmitting(true)
    setFormError('')

    try {
      const payload = {
        about_name: form.aboutName.trim(),
        about_role: form.aboutRole.trim(),
        about_summary: form.aboutSummary.trim(),
        blog_url: normalizeSafeExternalUrl(form.blogUrl),
        github_url: normalizeSafeExternalUrl(form.githubUrl),
        site_title: form.siteTitle.trim(),
      }

      if (recordId) {
        await updateAdminRecord('site_settings', recordId, auth.token, payload)
      } else {
        await createAdminRecord('site_settings', auth.token, payload)
      }

      setRefreshSeed((value) => value + 1)
    } catch (submitError) {
      setFormError(submitError.message || 'Gagal menyimpan site settings')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="admin-shell">
      <section className="admin-panel">
        <div className="admin-header">
          <div>
            <h1>Site Settings</h1>
            <p className="admin-copy">{loading ? 'Loading settings...' : singletonCopy}</p>
          </div>
          <Link to="/admin" className="ghost-btn">
            Back
          </Link>
        </div>

        {(error || formError) && <p className="admin-error">{error?.message || formError}</p>}

        <form className="admin-form" onSubmit={handleSubmit}>
          <label className="admin-field">
            <span>Site Title</span>
            <input
              type="text"
              value={form.siteTitle}
              onChange={(event) => setForm((current) => ({ ...current, siteTitle: event.target.value }))}
            />
          </label>

          <label className="admin-field">
            <span>About Name</span>
            <input
              type="text"
              value={form.aboutName}
              onChange={(event) => setForm((current) => ({ ...current, aboutName: event.target.value }))}
            />
          </label>

          <label className="admin-field">
            <span>About Role</span>
            <input
              type="text"
              value={form.aboutRole}
              onChange={(event) => setForm((current) => ({ ...current, aboutRole: event.target.value }))}
            />
          </label>

          <label className="admin-field admin-field--full">
            <span>About Summary</span>
            <textarea
              rows="5"
              value={form.aboutSummary}
              onChange={(event) => setForm((current) => ({ ...current, aboutSummary: event.target.value }))}
            />
          </label>

          <label className="admin-field">
            <span>GitHub URL</span>
            <input
              type="url"
              value={form.githubUrl}
              onChange={(event) => setForm((current) => ({ ...current, githubUrl: event.target.value }))}
            />
          </label>

          <label className="admin-field">
            <span>Blog URL</span>
            <input
              type="url"
              value={form.blogUrl}
              onChange={(event) => setForm((current) => ({ ...current, blogUrl: event.target.value }))}
            />
          </label>

          <div className="admin-actions">
            <button type="submit" className="action-btn" disabled={submitting}>
              {submitting ? 'Saving...' : recordId ? 'Update Settings' : 'Create Settings'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}
