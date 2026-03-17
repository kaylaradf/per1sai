import { hasPocketBaseConfigured, pocketBaseUrl } from './pocketbase'

const STORAGE_KEY = 'adata.admin.auth'

function parseStoredAuth() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
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
  window.localStorage.removeItem(STORAGE_KEY)
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
}

export function clearStoredAdminAuth() {
  window.localStorage.removeItem(STORAGE_KEY)
  window.sessionStorage.removeItem(STORAGE_KEY)
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

async function requestAdmin(path, token, options = {}) {
  const response = await fetch(`${pocketBaseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.message || 'PocketBase admin request gagal')
  }

  return payload
}

export async function fetchAdminCollection(collectionName, token, params = {}) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  })

  return requestAdmin(
    `/api/collections/${collectionName}/records${query.toString() ? `?${query.toString()}` : ''}`,
    token,
  )
}

export async function fetchAdminRecord(collectionName, recordId, token, params = {}) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  })

  return requestAdmin(
    `/api/collections/${collectionName}/records/${recordId}${query.toString() ? `?${query.toString()}` : ''}`,
    token,
  )
}

export async function createAdminRecord(collectionName, token, body) {
  return requestAdmin(`/api/collections/${collectionName}/records`, token, {
    body: body instanceof FormData ? body : JSON.stringify(body),
    method: 'POST',
  })
}

export async function updateAdminRecord(collectionName, recordId, token, body) {
  return requestAdmin(`/api/collections/${collectionName}/records/${recordId}`, token, {
    body: body instanceof FormData ? body : JSON.stringify(body),
    method: 'PATCH',
  })
}

export async function deleteAdminRecord(collectionName, recordId, token) {
  return requestAdmin(`/api/collections/${collectionName}/records/${recordId}`, token, {
    method: 'DELETE',
  })
}
