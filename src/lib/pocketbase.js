const DEFAULT_POCKETBASE_URL = 'https://manage.projectpop.xyz'

export const pocketBaseUrl = (import.meta.env.VITE_POCKETBASE_URL || DEFAULT_POCKETBASE_URL).replace(/\/$/, '')

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
  const query = buildQuery(params)
  const url = `${pocketBaseUrl}/api/collections/${collectionName}/records${query ? `?${query}` : ''}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`PocketBase request failed for ${collectionName}: ${response.status}`)
  }

  return response.json()
}

export function getFileUrl(record, fileName) {
  return `${pocketBaseUrl}/api/files/${record.collectionId}/${record.id}/${fileName}`
}
