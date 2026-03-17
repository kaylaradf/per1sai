import { fetchAdminCollection } from './adminAuth'
import { getFileUrl } from './pocketbase'

const weekdayLabels = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
export const scheduleTimeSlots = [
  { endTime: '08:20', key: '07:30-08:20', label: '07:30 - 08:20', startTime: '07:30', type: 'class' },
  { endTime: '09:10', key: '08:20-09:10', label: '08:20 - 09:10', startTime: '08:20', type: 'class' },
  { endTime: '10:15', key: '09:25-10:15', label: '09:25 - 10:15', startTime: '09:25', type: 'class' },
  { endTime: '11:10', key: '10:20-11:10', label: '10:20 - 11:10', startTime: '10:20', type: 'class' },
  { endTime: '12:05', key: '11:15-12:05', label: '11:15 - 12:05', startTime: '11:15', type: 'class' },
  { endTime: '13:00', key: '12:05-13:00', label: '12:05 - 13:00', startTime: '12:05', type: 'break' },
  { endTime: '13:50', key: '13:00-13:50', label: '13:00 - 13:50', startTime: '13:00', type: 'class' },
  { endTime: '14:40', key: '13:50-14:40', label: '13:50 - 14:40', startTime: '13:50', type: 'class' },
  { endTime: '15:30', key: '14:40-15:30', label: '14:40 - 15:30', startTime: '14:40', type: 'class' },
]

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

export function getScheduleSlotOptions() {
  return scheduleTimeSlots.filter((slot) => slot.type === 'class')
}

export function findScheduleSlot(startTime, endTime) {
  return scheduleTimeSlots.find((slot) => slot.startTime === startTime && slot.endTime === endTime) || null
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
  const rows = scheduleTimeSlots.map((slot) => ({
    ...slot,
    cells: Object.fromEntries(columns.map((column) => [column.dayIndex, []])),
  }))
  const rowLookup = new Map(rows.map((row) => [row.key, row]))

  sortedEntries.forEach((entry) => {
    const rowKey = `${entry.startTime}-${entry.endTime}`

    if (!rowLookup.has(rowKey)) {
      const customRow = {
        endTime: entry.endTime,
        key: rowKey,
        label: `${entry.startTime} - ${entry.endTime}`,
        startTime: entry.startTime,
        type: 'custom',
        cells: Object.fromEntries(columns.map((column) => [column.dayIndex, []])),
      }

      rows.push(customRow)
      rowLookup.set(rowKey, customRow)
    }
  })

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
