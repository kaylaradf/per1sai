import { fetchAdminCollection } from './adminAuth'
import { getFileUrl } from './pocketbase'

const weekdayLabels = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export function formatAdminDateLabel(value, includeTime = false) {
  if (!value) {
    return '-'
  }

  const isoCandidate = String(value).includes(' ') ? String(value).replace(' ', 'T') : String(value)
  const parsed = new Date(isoCandidate)

  if (Number.isNaN(parsed.getTime())) {
    return String(value).slice(0, includeTime ? 16 : 10)
  }

  return includeTime ? parsed.toISOString().slice(0, 16).replace('T', ' ') : parsed.toISOString().slice(0, 10)
}

export function toDateInputValue(value) {
  if (!value) {
    return ''
  }

  const isoCandidate = String(value).includes(' ') ? String(value).replace(' ', 'T') : String(value)
  return isoCandidate.slice(0, 10)
}

export function toDateTimeInputValue(value) {
  if (!value) {
    return ''
  }

  const isoCandidate = String(value).includes(' ') ? String(value).replace(' ', 'T') : String(value)
  return isoCandidate.slice(0, 16)
}

export function toPocketBaseDateTime(value) {
  if (!value) {
    return ''
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString()
}

export function toPocketBaseEndOfDay(value) {
  if (!value) {
    return ''
  }

  const parsed = new Date(`${value}T23:59:00`)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString()
}

export function slugifyAnnouncementTitle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function getDerivedTaskStatus(task) {
  const dueValue = task?.due_date || task?.dueDate || ''

  if (!dueValue) {
    return 'in_progress'
  }

  const due = new Date(String(dueValue).includes(' ') ? String(dueValue).replace(' ', 'T') : String(dueValue))

  if (Number.isNaN(due.getTime())) {
    return 'in_progress'
  }

  due.setHours(23, 59, 59, 999)
  return due < new Date() ? 'expired' : 'in_progress'
}

export function getDayLabel(dayIndex) {
  return weekdayLabels[dayIndex] || '-'
}

export function getScheduleColumns(entries) {
  const dynamic = new Set(entries.map((entry) => Number(entry.dayOfWeek)))
  const defaults = [1, 2, 3, 4, 5]

  if (dynamic.has(0)) {
    defaults.unshift(0)
  }

  if (dynamic.has(6)) {
    defaults.push(6)
  }

  return defaults.map((dayIndex) => ({
    dayIndex,
    label: getDayLabel(dayIndex),
  }))
}

export function groupScheduleIntoGrid(entries) {
  const sortedEntries = [...entries].sort((left, right) => {
    if (left.startTime !== right.startTime) {
      return left.startTime.localeCompare(right.startTime)
    }

    if (left.endTime !== right.endTime) {
      return left.endTime.localeCompare(right.endTime)
    }

    return left.courseName.localeCompare(right.courseName)
  })

  const columns = getScheduleColumns(sortedEntries)
  const rowMap = new Map()

  sortedEntries.forEach((entry) => {
    const rowKey = `${entry.startTime}-${entry.endTime}`

    if (!rowMap.has(rowKey)) {
      rowMap.set(rowKey, {
        endTime: entry.endTime,
        key: rowKey,
        label: `${entry.startTime} - ${entry.endTime}`,
        startTime: entry.startTime,
      })
    }
  })

  const rows = Array.from(rowMap.values()).map((row) => ({
    ...row,
    cells: Object.fromEntries(columns.map((column) => [column.dayIndex, []])),
  }))

  const rowLookup = new Map(rows.map((row) => [row.key, row]))

  sortedEntries.forEach((entry) => {
    const row = rowLookup.get(`${entry.startTime}-${entry.endTime}`)

    if (row) {
      row.cells[entry.dayOfWeek].push(entry)
    }
  })

  return {
    columns,
    rows,
  }
}

export function filterCoursesBySemester(courses, semesterId) {
  if (!semesterId) {
    return courses
  }

  return courses.filter((course) => course.semesterId === semesterId)
}

export function findCourseById(courses, courseId) {
  return courses.find((course) => course.id === courseId) || null
}

export function findSemesterForCourse(courses, courseId) {
  return findCourseById(courses, courseId)?.semesterId || ''
}

export async function fetchAdminSelectors(token) {
  const [semestersResponse, coursesResponse] = await Promise.all([
    fetchAdminCollection('semesters', token, { perPage: 200, sort: 'semester' }),
    fetchAdminCollection('courses', token, { perPage: 500, sort: 'name', expand: 'semester' }),
  ])

  const semesters = semestersResponse.items
    .map((record) => ({
      id: record.id,
      isActive: Boolean(record.is_active),
      name: record.name || `Semester ${record.semester}`,
      number: Number(record.semester) || 0,
    }))
    .sort((left, right) => left.number - right.number)

  const semesterMap = new Map(semesters.map((semester) => [semester.id, semester]))

  const courses = coursesResponse.items
    .map((record) => ({
      code: record.code || '',
      id: record.id,
      isActive: Boolean(record.is_active),
      name: record.name || record.code || 'Untitled Course',
      semesterId: record.semester || '',
      semesterName: semesterMap.get(record.semester)?.name || record.expand?.semester?.name || '',
    }))
    .sort((left, right) => left.name.localeCompare(right.name))

  return {
    courses,
    semesters,
  }
}

export function getAdminFileUrl(record, fieldName) {
  const fileName = record?.[fieldName]

  if (!fileName) {
    return ''
  }

  return getFileUrl(record, fileName)
}

