export const pocketBaseUrl = import.meta.env.VITE_POCKETBASE_URL?.replace(/\/$/, '') || ''
export const hasPocketBaseConfigured = Boolean(pocketBaseUrl)

function buildQuery(params) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  })

  return query.toString()
}

export async function listRecords(collectionName, params = {}) {
  if (!hasPocketBaseConfigured) {
    throw new Error(`PocketBase URL is not configured for ${collectionName}`)
  }

  const query = buildQuery(params)
  const url = `${pocketBaseUrl}/api/collections/${collectionName}/records${query ? `?${query}` : ''}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`PocketBase request failed for ${collectionName}: ${response.status}`)
  }

  return response.json()
}

export function getFileUrl(record, fileName) {
  if (!hasPocketBaseConfigured) {
    return ''
  }

  return `${pocketBaseUrl}/api/files/${record.collectionId}/${record.id}/${fileName}`
}
