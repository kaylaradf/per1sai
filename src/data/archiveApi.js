import {
  getAnnouncementsSeed as getAnnouncementsSeedFallback,
  getAnnouncementStream as getAnnouncementStreamFallback,
  getCourseById as getCourseByIdFallback,
  getMaterials as getMaterialsFallback,
  getSchedule as getScheduleFallback,
  getSemesterById as getSemesterByIdFallback,
  getSemesters as getSemestersFallback,
  getTasks as getTasksFallback,
} from './mockDb'
import { getFileUrl, listRecords } from '../lib/pocketbase'

const weekdays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const defaultSiteSettings = {
  siteTitle: 'University Archive',
  aboutName: 'emaa',
  aboutRole: 'Creator & Maintainer.',
  aboutSummary:
    'Frontend archive interface berbasis React dengan gaya retro desktop untuk navigasi materi, tugas, jadwal, dan pengumuman.',
  githubUrl: 'https://github.com/emaa/adata',
  blogUrl: 'https://your-blog.example',
}

let archiveTreePromise
let tasksPromise
let schedulePromise
let announcementsPromise
let siteSettingsPromise

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function normalizeCategory(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return normalized.includes('prakt') ? 'praktikum' : 'teori'
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

function inferExtension(record) {
  if (record.file) {
    const parts = record.file.split('.')
    if (parts.length > 1) {
      return parts.at(-1).toLowerCase()
    }
  }

  if (record.file_type) {
    return String(record.file_type).toLowerCase()
  }

  return 'file'
}

function buildFallbackFileName(record) {
  return `${slugify(record.title || 'material')}.${inferExtension(record)}`
}

function buildDriveDownloadUrl(driveId) {
  return `https://drive.google.com/uc?export=download&id=${driveId}`
}

function buildDriveViewUrl(driveId) {
  return `https://drive.google.com/file/d/${driveId}/view`
}

function createMockArchiveTree() {
  const semesters = getSemestersFallback().map((semester) => ({
    ...semester,
    recordId: semester.id,
    routeId: semester.id,
    courses: semester.courses.map((course) => ({
      ...course,
      recordId: course.id,
      routeId: course.id,
      semesterId: semester.id,
    })),
  }))

  return {
    semesters,
    semesterMap: new Map(semesters.map((semester) => [semester.id, semester])),
  }
}

async function loadArchiveTree() {
  if (!archiveTreePromise) {
    archiveTreePromise = (async () => {
      const [semesterResponse, courseResponse, materialResponse] = await Promise.all([
        listRecords('semesters', { perPage: 200 }),
        listRecords('courses', { perPage: 200 }),
        listRecords('materials', { perPage: 500 }),
      ])

      if (!semesterResponse.items.length || !courseResponse.items.length) {
        return createMockArchiveTree()
      }

      const semesters = semesterResponse.items
        .map((record) => {
          const number = Number(record.semester) || Number(String(record.name || '').match(/\d+/)?.[0]) || 0
          const routeId = number ? String(number) : record.code || record.id

          return {
            id: routeId,
            code: record.code || routeId,
            courses: [],
            name: record.name || `Semester ${routeId}`,
            number,
            recordId: record.id,
            routeId,
          }
        })
        .sort((left, right) => {
          if (left.number && right.number) {
            return left.number - right.number
          }

          return left.name.localeCompare(right.name)
        })

      const semesterMapByRecordId = new Map(semesters.map((semester) => [semester.recordId, semester]))
      const semesterMap = new Map(semesters.flatMap((semester) => [[semester.id, semester], [semester.recordId, semester]]))

      const courses = courseResponse.items.map((record) => {
        const semester = semesterMapByRecordId.get(record.semester)
        const routeId = record.slug || slugify(record.name || record.code || record.id) || record.id

        const course = {
          categories: {
            praktikum: [],
            teori: [],
          },
          id: routeId,
          name: record.name || record.code || 'Untitled Course',
          overview: record.overview || '',
          recordId: record.id,
          routeId,
          semesterId: semester?.id || '',
        }

        if (semester) {
          semester.courses.push(course)
        }

        return course
      })

      const courseMapByRecordId = new Map(courses.map((course) => [course.recordId, course]))

      materialResponse.items.forEach((record, index) => {
        const course = courseMapByRecordId.get(record.course)

        if (!course) {
          return
        }

        const category = normalizeCategory(record.type)
        const fileName = record.file || buildFallbackFileName(record)
        const downloadUrl = record.file
          ? getFileUrl(record, record.file)
          : record.driveId
            ? buildDriveDownloadUrl(record.driveId)
            : '#'
        const viewUrl = record.file
          ? getFileUrl(record, record.file)
          : record.driveId
            ? buildDriveViewUrl(record.driveId)
            : '#'

        course.categories[category].push({
          category,
          courseId: course.id,
          id: record.id,
          fileName,
          size: '-',
          sortOrder: Number(record.sort_order) || index + 1,
          title: record.title || fileName,
          updatedAt: toDateLabel(record.uploadDate || record.updated),
          url: downloadUrl,
          viewUrl,
          week: Number(record.week_number) > 0 ? `Minggu ${record.week_number}` : 'Arsip',
        })
      })

      semesters.forEach((semester) => {
        semester.courses.sort((left, right) => left.name.localeCompare(right.name))
        semester.courses.forEach((course) => {
          course.categories.teori.sort((left, right) => left.sortOrder - right.sortOrder)
          course.categories.praktikum.sort((left, right) => left.sortOrder - right.sortOrder)
        })
      })

      return {
        semesters,
        semesterMap,
      }
    })().catch((error) => {
      archiveTreePromise = null
      throw error
    })
  }

  return archiveTreePromise
}

async function loadTasks() {
  if (!tasksPromise) {
    tasksPromise = listRecords('tasks', { perPage: 200, expand: 'course,semester' })
      .then((response) => {
        if (!response.items.length) {
          return getTasksFallback()
        }

        return response.items.map((record) => ({
          course: record.expand?.course?.name || 'Unknown Course',
          dueDate: record.due_date ? toDateLabel(record.due_date) : '',
          id: record.id,
          priority: record.priority || 'medium',
          status: record.status || 'pending',
          title: record.title || 'Untitled Task',
          type: record.type || 'Assignment',
        }))
      })
      .catch(() => getTasksFallback())
  }

  return tasksPromise
}

function parseTimeRange(value) {
  const match = String(value || '').match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/)

  if (!match) {
    return {
      end: '',
      start: '',
    }
  }

  return {
    end: match[2],
    start: match[1],
  }
}

async function loadSchedule() {
  if (!schedulePromise) {
    schedulePromise = listRecords('schedule', { perPage: 200, expand: 'course,semester' })
      .then((response) => {
        if (!response.items.length) {
          return getScheduleFallback()
        }

        return response.items.map((record) => {
          const range = parseTimeRange(record.time)

          return {
            course: record.expand?.course?.name || record.subject || 'Untitled',
            day: Number(record.day_of_week),
            end: record.end_time || range.end || '-',
            id: record.id,
            lecturer: record.lecturer || '-',
            room: record.room || '-',
            start: record.start_time || range.start || '-',
            type: record.class_type || 'Kuliah',
          }
        })
      })
      .catch(() => getScheduleFallback())
  }

  return schedulePromise
}

async function loadAnnouncements() {
  if (!announcementsPromise) {
    announcementsPromise = listRecords('announcements', { perPage: 200, sort: '-published_at' })
      .then((response) => {
        if (!response.items.length) {
          return {
            items: getAnnouncementsSeedFallback(),
            source: 'mock',
            stream: getAnnouncementStreamFallback(),
          }
        }

        return {
          items: response.items.map((record) => ({
            body: record.body || '',
            category: record.category || 'General',
            id: record.id,
            time: toDateLabel(record.published_at || record.created),
            title: record.title || 'Untitled Announcement',
          })),
          source: 'pocketbase',
          stream: [],
        }
      })
      .catch(() => ({
        items: getAnnouncementsSeedFallback(),
        source: 'mock',
        stream: getAnnouncementStreamFallback(),
      }))
  }

  return announcementsPromise
}

async function loadSiteSettings() {
  if (!siteSettingsPromise) {
    siteSettingsPromise = listRecords('site_settings', { perPage: 1 })
      .then((response) => {
        const record = response.items[0]

        if (!record) {
          return defaultSiteSettings
        }

        return {
          aboutName: record.about_name || defaultSiteSettings.aboutName,
          aboutRole: record.about_role || defaultSiteSettings.aboutRole,
          aboutSummary: record.about_summary || defaultSiteSettings.aboutSummary,
          blogUrl: record.blog_url || defaultSiteSettings.blogUrl,
          githubUrl: record.github_url || defaultSiteSettings.githubUrl,
          siteTitle: record.site_title || defaultSiteSettings.siteTitle,
        }
      })
      .catch(() => defaultSiteSettings)
  }

  return siteSettingsPromise
}

export async function getSemesters() {
  const archive = await loadArchiveTree()
  return archive.semesters
}

export async function getSemesterById(semesterId) {
  const archive = await loadArchiveTree()
  return archive.semesterMap.get(semesterId) || getSemesterByIdFallback(semesterId)
}

export async function getCourseById(semesterId, courseId) {
  const semester = await getSemesterById(semesterId)
  return (
    semester?.courses.find((course) => course.id === courseId || course.recordId === courseId) ||
    getCourseByIdFallback(semesterId, courseId)
  )
}

export async function getMaterials(semesterId, courseId, category) {
  const course = await getCourseById(semesterId, courseId)
  const normalizedCategory = normalizeCategory(category)
  return course?.categories?.[normalizedCategory] || getMaterialsFallback(semesterId, courseId, normalizedCategory)
}

export async function getTasks() {
  return loadTasks()
}

export async function getSchedule() {
  return loadSchedule()
}

export async function getScheduleForDay(dayIndex) {
  const schedule = await loadSchedule()
  return schedule.filter((entry) => entry.day === dayIndex)
}

export function getWeekdayLabel(dayIndex) {
  return weekdays[dayIndex] || '-'
}

export function getWeekdays() {
  return weekdays.map((label, index) => ({ index, label }))
}

export async function getAnnouncementsFeed() {
  return loadAnnouncements()
}

export async function getSiteSettings() {
  return loadSiteSettings()
}
