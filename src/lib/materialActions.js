const officeExtensions = new Set(['doc', 'docx', 'ppt', 'pptx'])

export function getFileExtension(fileName) {
  const parts = fileName.split('.')
  return parts.length > 1 ? parts.at(-1).toLowerCase() : ''
}

export function getViewUrl(material) {
  if (material.viewUrl) {
    return material.viewUrl
  }

  const ext = getFileExtension(material.fileName)

  if (ext === 'pdf') {
    return material.url
  }

  if (officeExtensions.has(ext)) {
    return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(material.url)}`
  }

  return material.url
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
