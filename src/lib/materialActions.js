const officeExtensions = new Set(['doc', 'docx', 'ppt', 'pptx'])
const imageExtensions = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'])

export function getFileExtension(fileName) {
  const parts = fileName.split('.')
  return parts.length > 1 ? parts.at(-1).toLowerCase() : ''
}

function isHttpUrl(value) {
  try {
    const parsed = new URL(String(value || ''))
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function isDriveUrl(value) {
  try {
    return new URL(String(value || '')).hostname.includes('drive.google.com')
  } catch {
    return false
  }
}

export function isMobileBrowser() {
  if (typeof navigator === 'undefined') {
    return false
  }

  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent)
}

function getGoogleDocsViewerUrl(url) {
  if (!isHttpUrl(url)) {
    return ''
  }

  return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`
}

function getMaterialRawUrl(material) {
  if (isHttpUrl(material.viewUrl)) {
    return material.viewUrl
  }

  if (isHttpUrl(material.url)) {
    return material.url
  }

  return ''
}

function extractDriveId(material) {
  if (material.driveId) {
    return material.driveId
  }

  const candidates = [material.viewUrl, material.url]

  for (const candidate of candidates) {
    const value = String(candidate || '')
    const pathMatch = value.match(/\/file\/d\/([^/]+)/)

    if (pathMatch?.[1]) {
      return pathMatch[1]
    }

    const queryMatch = value.match(/[?&]id=([^&#]+)/)

    if (queryMatch?.[1]) {
      return queryMatch[1]
    }
  }

  return ''
}

export function getDrivePreviewUrl(material) {
  const driveId = extractDriveId(material)

  if (!driveId && !isDriveUrl(material.viewUrl) && !isDriveUrl(material.url)) {
    return ''
  }

  if (!driveId) {
    return isHttpUrl(material.viewUrl) ? material.viewUrl : ''
  }

  return `https://drive.google.com/file/d/${driveId}/preview`
}

export function getMaterialViewTarget(material) {
  const ext = getFileExtension(material.fileName)
  const rawUrl = getMaterialRawUrl(material)
  const mobile = isMobileBrowser()
  const drivePreviewUrl = getDrivePreviewUrl(material)

  if (drivePreviewUrl) {
    return {
      href: drivePreviewUrl,
      source: 'drive-preview',
      type: 'drive',
    }
  }

  if (ext === 'pdf') {
    return {
      href: mobile ? getGoogleDocsViewerUrl(rawUrl) || rawUrl : rawUrl,
      source: mobile ? 'google-docs' : 'native-pdf',
      type: 'pdf',
    }
  }

  if (officeExtensions.has(ext)) {
    return {
      href: getGoogleDocsViewerUrl(rawUrl) || rawUrl,
      source: 'google-docs',
      type: ext === 'ppt' || ext === 'pptx' ? 'ppt' : 'word',
    }
  }

  if (imageExtensions.has(ext)) {
    return {
      href: rawUrl,
      source: 'raw-file',
      type: 'image',
    }
  }

  return {
    href: rawUrl,
    source: 'raw-file',
    type: 'file',
  }
}

export function getViewUrl(material) {
  return getMaterialViewTarget(material).href || material.url
}

export function getTypeLabel(fileName) {
  const ext = getFileExtension(fileName)

  if (ext === 'pdf') {
    return 'PDF'
  }

  if (ext === 'doc' || ext === 'docx') {
    return 'WORD'
  }

  if (ext === 'ppt' || ext === 'pptx') {
    return 'PPT'
  }

  return ext.toUpperCase() || 'FILE'
}
