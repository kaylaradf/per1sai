import { createAdminRecord, deleteAdminRecord, fetchAdminCollection, fetchAdminRecord, updateAdminRecord } from './adminAuth'
import { getFileUrl } from './pocketbase'

export function normalizeCategory(value) {
  return String(value || '').toLowerCase().includes('prakt') ? 'praktikum' : 'teori'
}

function slugifyCourseValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function formatCategoryLabel(category) {
  return category === 'praktikum' ? 'Praktikum' : 'Teori'
}

function toDateLabel(value) {
  if (!value) {
    return '-'
  }

  const isoCandidate = value.includes(' ') ? value.replace(' ', 'T') : value
  const parsed = new Date(isoCandidate)

  if (Number.isNaN(parsed.getTime())) {
    return String(value).slice(0, 10)
  }

  return parsed.toISOString().slice(0, 10)
}

function buildDriveDownloadUrl(driveId) {
  return `https://drive.google.com/uc?export=download&id=${driveId}`
}

function buildDriveViewUrl(driveId) {
  return `https://drive.google.com/file/d/${driveId}/view`
}

function inferFileType(fileName) {
  const parts = String(fileName || '').split('.')
  return parts.length > 1 ? parts.at(-1).toLowerCase() : ''
}

function buildSemesterSlots(records) {
  return Array.from({ length: 8 }, (_, index) => {
    const number = index + 1
    const existing = records.find((record) => Number(record.semester) === number)

    return {
      courseItems: [],
      courses: 0,
      id: existing?.id || `fixed-semester-${number}`,
      materials: 0,
      name: existing?.name || `Semester ${number}`,
      number,
      semesterRecordId: existing?.id || '',
    }
  })
}

export async function fetchAdminMaterialsOverview(token) {
  const [semestersResponse, coursesResponse, materialsResponse] = await Promise.all([
    fetchAdminCollection('semesters', token, { perPage: 200, sort: 'semester' }),
    fetchAdminCollection('courses', token, { perPage: 500, sort: 'name' }),
    fetchAdminCollection('materials', token, { perPage: 1000, sort: 'title' }),
  ])

  const materialGroups = buildSemesterSlots(semestersResponse.items)
  const semesterMap = new Map(materialGroups.map((semester) => [semester.semesterRecordId, semester]))
  const courseMap = new Map()

  coursesResponse.items.forEach((course) => {
    const semester = semesterMap.get(course.semester)

    if (!semester) {
      return
    }

    const courseSummary = {
      id: course.id,
      materials: 0,
      name: course.name || course.code || 'Untitled Course',
      praktikum: 0,
      teori: 0,
    }

    semester.courses += 1
    semester.courseItems.push(courseSummary)
    courseMap.set(course.id, { courseSummary, semester })
  })

  materialsResponse.items.forEach((material) => {
    const linked = courseMap.get(material.course)

    if (!linked) {
      return
    }

    const category = normalizeCategory(material.type)
    linked.courseSummary.materials += 1
    linked.courseSummary[category] += 1
    linked.semester.materials += 1
  })

  materialGroups.forEach((semester) => {
    semester.courseItems.sort((left, right) => left.name.localeCompare(right.name))
  })

  return {
    materialGroups,
    totalCourses: coursesResponse.totalItems,
    totalMaterials: materialsResponse.totalItems,
  }
}

export async function fetchAdminMaterialCategory({ token, semesterNumber, courseId, category }) {
  const normalizedCategory = normalizeCategory(category)
  const [semestersResponse, courseRecord, materialsResponse] = await Promise.all([
    fetchAdminCollection('semesters', token, { perPage: 200, sort: 'semester' }),
    fetchAdminRecord('courses', courseId, token),
    fetchAdminCollection('materials', token, {
      filter: `course="${courseId}"`,
      page: 1,
      perPage: 500,
      sort: 'sort_order,title',
    }),
  ])

  const semesterRecord =
    semestersResponse.items.find((record) => Number(record.semester) === Number(semesterNumber)) || null

  if (!courseRecord?.id || !semesterRecord?.id || courseRecord.semester !== semesterRecord.id) {
    throw new Error('Mata kuliah atau semester tidak cocok')
  }

  const materials = materialsResponse.items
    .filter((record) => normalizeCategory(record.type) === normalizedCategory)
    .sort((left, right) => {
      const leftWeek = Number(left.week_number) || 999
      const rightWeek = Number(right.week_number) || 999

      if (leftWeek !== rightWeek) {
        return leftWeek - rightWeek
      }

      const leftOrder = Number(left.sort_order) || 999
      const rightOrder = Number(right.sort_order) || 999

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder
      }

      return String(left.title || '').localeCompare(String(right.title || ''))
    })
    .map((record) => {
      const fileUrl = record.file ? getFileUrl(record, record.file) : record.driveId ? buildDriveDownloadUrl(record.driveId) : ''
      const viewUrl = record.file ? getFileUrl(record, record.file) : record.driveId ? buildDriveViewUrl(record.driveId) : ''

      return {
        description: record.description || '',
        fileName: record.file || '',
        fileType: record.file_type || inferFileType(record.file),
        fileUrl,
        id: record.id,
        published: Boolean(record.published),
        raw: record,
        sortOrder: Number(record.sort_order) || 0,
        title: record.title || 'Untitled Material',
        updatedAt: toDateLabel(record.updated || record.uploadDate),
        viewUrl,
        weekNumber: Number(record.week_number) || 0,
      }
    })

  return {
    category: normalizedCategory,
    categoryLabel: formatCategoryLabel(normalizedCategory),
    course: {
      id: courseRecord.id,
      name: courseRecord.name || courseRecord.code || 'Untitled Course',
    },
    materials,
    semester: {
      id: semesterRecord.id,
      name: semesterRecord.name || `Semester ${semesterNumber}`,
      number: Number(semesterNumber),
    },
  }
}

function buildMaterialFormData({ category, courseId, description, file, published, semesterRecordId, sortOrder, title, weekNumber }) {
  const formData = new FormData()

  formData.set('title', title.trim())
  formData.set('description', description.trim())
  formData.set('type', category === 'praktikum' ? 'Praktikum' : 'Teori')
  formData.set('course', courseId)
  formData.set('semester', semesterRecordId)
  formData.set('published', published ? 'true' : 'false')
  formData.set('sort_order', String(sortOrder || 0))
  formData.set('week_number', String(weekNumber || 0))

  if (file) {
    formData.set('file', file)
    formData.set('file_type', inferFileType(file.name))
  }

  return formData
}

export async function createAdminMaterial(token, input) {
  const formData = buildMaterialFormData(input)
  return createAdminRecord('materials', token, formData)
}

export async function updateAdminMaterial(token, recordId, input) {
  const formData = buildMaterialFormData(input)
  return updateAdminRecord('materials', recordId, token, formData)
}

export async function deleteAdminMaterial(token, recordId) {
  return deleteAdminRecord('materials', recordId, token)
}

export async function createAdminCourse(token, { code, name, overview, semesterRecordId }) {
  const normalizedName = name.trim()
  const normalizedCode = code.trim().toUpperCase()
  const slugSource = normalizedCode || normalizedName

  return createAdminRecord('courses', token, {
    code: normalizedCode,
    is_active: true,
    name: normalizedName,
    overview: overview.trim(),
    semester: semesterRecordId,
    slug: slugifyCourseValue(slugSource),
    url: '',
  })
}
