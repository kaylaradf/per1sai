import { hasPocketBaseConfigured, pocketBaseUrl } from './pocketbase'

const STORAGE_KEY = 'adata.admin.auth'

function parseStoredAuth() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getStoredAdminAuth() {
  if (typeof window === 'undefined') {
    return null
  }

  return parseStoredAuth()
}

export function persistAdminAuth(auth) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
}

export function clearStoredAdminAuth() {
  window.localStorage.removeItem(STORAGE_KEY)
}

export async function loginAdmin(identity, password) {
  if (!hasPocketBaseConfigured) {
    throw new Error('VITE_POCKETBASE_URL belum dikonfigurasi')
  }

  const response = await fetch(`${pocketBaseUrl}/api/collections/admins/auth-with-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      identity,
      password,
    }),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.message || 'Login admin gagal')
  }

  const auth = {
    record: payload.record,
    token: payload.token,
  }

  persistAdminAuth(auth)
  return auth
}

export async function fetchAdminCollection(collectionName, token, params = {}) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  })

  const response = await fetch(
    `${pocketBaseUrl}/api/collections/${collectionName}/records${query.toString() ? `?${query.toString()}` : ''}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.message || `Gagal memuat ${collectionName}`)
  }

  return payload
}
