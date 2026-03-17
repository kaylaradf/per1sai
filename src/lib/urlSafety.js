export function normalizeSafeExternalUrl(value) {
  const normalized = String(value || '').trim()

  if (!normalized) {
    return ''
  }

  try {
    const parsed = new URL(normalized)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : ''
  } catch {
    return ''
  }
}

export function isSafeHttpUrl(value) {
  if (!String(value || '').trim()) {
    return true
  }

  return Boolean(normalizeSafeExternalUrl(value))
}
