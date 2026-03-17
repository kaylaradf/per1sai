import { fetchAdminCollection } from './adminAuth'

function normalizeCategory(value) {
  return String(value || '').toLowerCase().includes('prakt') ? 'praktikum' : 'teori'
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
