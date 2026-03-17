const DAY_MS = 24 * 60 * 60 * 1000

const FILE_URLS = {
  pdf: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  docx: 'https://calibre-ebook.com/downloads/demos/demo.docx',
  pptx: 'https://filesamples.com/samples/document/ppt/sample3.ppt',
}

const COURSE_MAP = {
  1: ['Calculus', 'Data Structures', 'Discrete Math', 'Physics', 'Composition'],
  2: ['Linear Algebra', 'Algorithms', 'Database Systems', 'Digital Logic', 'English II'],
  3: ['Operating Systems', 'Computer Networks', 'Statistics', 'OOP', 'Web Programming'],
  4: ['Software Engineering', 'Machine Learning', 'Numerical Methods', 'UX Design'],
  5: ['Distributed Systems', 'Cloud Computing', 'Information Retrieval', 'DevOps'],
  6: ['Mobile Development', 'Cyber Security', 'Data Mining', 'Data Visualization'],
  7: ['Capstone Prep', 'Research Methodology', 'Entrepreneurship'],
  8: ['Final Project', 'Internship', 'Seminar'],
}

const weekdays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const materialTopicMap = {
  teori: [
    'Course Overview',
    'Core Concepts',
    'Worked Examples',
    'Reading Guide',
    'Midterm Review',
    'Case Study',
    'Reference Sheet',
    'Advanced Notes',
    'Practice Questions',
    'Mini Project Brief',
    'Recap Slides',
    'Final Review',
  ],
  praktikum: [
    'Lab Brief',
    'Setup Guide',
    'Hands-on Worksheet',
    'Debug Checklist',
    'Trial Dataset',
    'Step-by-step Demo',
    'Submission Template',
    'Validation Notes',
    'Lab Recap',
    'Extension Task',
  ],
}

const materialExtensionMap = {
  teori: ['pdf', 'pptx', 'docx', 'pdf', 'pptx', 'docx', 'pdf', 'pdf'],
  praktikum: ['pdf', 'docx', 'pptx', 'pdf', 'docx', 'pdf', 'pptx', 'docx'],
}

const taskTemplates = [
  { action: 'Ringkas modul', type: 'Reading Review' },
  { action: 'Submit latihan', type: 'Assignment' },
  { action: 'Kerjakan kuis mingguan', type: 'Quiz' },
  { action: 'Perbarui catatan praktikum', type: 'Lab Notes' },
  { action: 'Susun presentasi topik', type: 'Presentation' },
  { action: 'Analisis studi kasus', type: 'Case Study' },
  { action: 'Kirim draft laporan', type: 'Report' },
  { action: 'Refactor project mini', type: 'Project' },
]

const priorityLevels = ['low', 'medium', 'high']
const taskStatuses = ['todo', 'in_progress', 'done']

const roomPool = ['R.201', 'R.305', 'R.402', 'Lab A', 'Lab B', 'Lab C', 'Studio 2', 'R.115']
const lecturerPool = [
  'Dr. Ayu Pranata',
  'Budi Santoso, M.Kom',
  'Sinta Maheswari, M.T.',
  'Rafi Nugraha, S.Kom',
  'Nadia Putri, M.Sc',
  'Yoga Rahman, M.Kom',
]
const scheduleSlots = [
  { start: '07:30', end: '09:10' },
  { start: '09:20', end: '11:00' },
  { start: '13:00', end: '14:40' },
  { start: '15:00', end: '16:40' },
]

const announcementTemplates = [
  {
    category: 'System',
    title: 'Sinkronisasi arsip malam ini',
    body: 'Index file akan diperbarui pukul 22:00 dan akses mungkin melambat selama 15 menit.',
  },
  {
    category: 'Academic',
    title: 'Template laporan revisi tersedia',
    body: 'Gunakan template versi 2.4 untuk semua praktikum mulai minggu ini.',
  },
  {
    category: 'Deadline',
    title: 'Reminder pengumpulan tugas',
    body: 'Pastikan seluruh submission minggu ini masuk sebelum pukul 23:59.',
  },
  {
    category: 'Schedule',
    title: 'Perubahan ruang sementara',
    body: 'Beberapa sesi praktikum dipindah ke Lab B karena maintenance perangkat.',
  },
  {
    category: 'Material',
    title: 'Materi tambahan tersedia',
    body: 'Tambahan review UTS dan rangkuman topik akhir semester sudah diunggah.',
  },
  {
    category: 'Community',
    title: 'Forum diskusi dibuka',
    body: 'Gunakan forum batch ini untuk tanya jawab tugas besar dan project final.',
  },
]

const blogBlueprints = [
  {
    slug: 'cara-belajar-sistem-operasi',
    title: 'Cara Belajar Sistem Operasi Biar Nempel',
    excerpt: 'Strategi belajar konsep proses, memori, dan concurrency tanpa tenggelam di teori.',
    paragraphs: [
      'Belajar sistem operasi itu soal memahami mekanisme, bukan menghafal definisi satu per satu.',
      'Mulai dari model mental kecil: process lifecycle, scheduling, memory paging, lalu cek bagaimana semuanya saling memengaruhi.',
      'Kalau satu topik terasa kabur, tulis ulang alurnya dengan bahasa sendiri sebelum pindah ke bab berikutnya.',
    ],
    bullets: ['Bikin satu diagram untuk tiap topik inti.', 'Bandingkan dua algoritma dengan contoh kasus nyata.', 'Simpan rangkuman satu halaman per minggu.'],
  },
  {
    slug: 'workflow-catatan-kuliah-digital',
    title: 'Workflow Catatan Kuliah Digital yang Konsisten',
    excerpt: 'Cara bikin catatan yang cepat dicari ulang saat UTS, praktikum, dan revisi project.',
    paragraphs: [
      'Catatan digital yang baik memprioritaskan retrieval speed, bukan panjang dokumen.',
      'Pisahkan teori, praktikum, dan latihan soal agar pencarian saat butuh tidak berantakan.',
      'Gunakan penamaan file yang konsisten sejak awal supaya tidak perlu bersih-bersih di akhir semester.',
    ],
    bullets: ['Pakai prefix minggu atau topik.', 'Pisahkan link referensi dari rangkuman utama.', 'Tulis action item setelah kelas selesai.'],
  },
  {
    slug: 'cara-review-materi-sebelum-ujian',
    title: 'Cara Review Materi Sebelum Ujian Tanpa Panik',
    excerpt: 'Format review cepat untuk mata kuliah padat materi dan jadwal yang mepet.',
    paragraphs: [
      'Review efektif dimulai dari daftar topik yang benar-benar mungkin keluar di ujian.',
      'Pecah materi menjadi tiga lapis: konsep inti, contoh soal, dan jebakan yang sering muncul.',
      'Kalau waktunya tipis, utamakan gap terbesar lebih dulu daripada mengulang semua bab secara rata.',
    ],
    bullets: ['Buat daftar topik prioritas.', 'Latih recall tanpa melihat catatan.', 'Sisakan satu sesi khusus untuk error review.'],
  },
  {
    slug: 'rapikan-arsip-materi-kuliah',
    title: 'Rapikan Arsip Materi Kuliah Sebelum Menumpuk',
    excerpt: 'Pola struktur folder yang bikin file materi dan tugas tidak tercecer sepanjang semester.',
    paragraphs: [
      'Arsip yang rapi mengurangi friction saat deadline datang bersamaan.',
      'Jangan menunggu akhir semester untuk membersihkan nama file dan folder.',
      'Kalau struktur dasar sudah benar, pencarian materi jadi jauh lebih cepat saat revisi.',
    ],
    bullets: ['Pisahkan per semester dan per mata kuliah.', 'Bedakan teori, praktikum, dan submission.', 'Review struktur folder seminggu sekali.'],
  },
  {
    slug: 'strategi-belajar-praktikum',
    title: 'Strategi Belajar Praktikum Supaya Tidak Cuma Ikut Langkah',
    excerpt: 'Cara pakai bahan praktikum agar benar-benar paham alur, bukan sekadar menyalin.',
    paragraphs: [
      'Praktikum yang efektif berangkat dari hipotesis kecil tentang apa yang akan terjadi.',
      'Sebelum mengikuti instruksi, pahami dulu tujuan eksperimen dan output yang diharapkan.',
      'Sesudah selesai, catat perbedaan antara prediksi dan hasil nyata untuk memperkuat pemahaman.',
    ],
    bullets: ['Tulis expected output.', 'Catat error yang muncul.', 'Simpan perbaikan yang berhasil.'],
  },
  {
    slug: 'atur-deadline-biar-nggak-nabrak',
    title: 'Atur Deadline Biar Tugas Tidak Nabrak Semua',
    excerpt: 'Teknik sederhana untuk menata tugas yang datang dari banyak mata kuliah sekaligus.',
    paragraphs: [
      'Deadline terasa menumpuk bukan hanya karena jumlahnya, tapi karena tidak ada prioritas yang jelas.',
      'Kelompokkan tugas berdasarkan urgensi, durasi pengerjaan, dan risiko keterlambatan.',
      'Dengan begitu kamu tahu mana yang harus disentuh dulu, mana yang cukup dipantau.',
    ],
    bullets: ['Tandai tugas dengan estimasi waktu.', 'Pisahkan tugas singkat dan tugas mendalam.', 'Review daftar tugas dua kali sehari.'],
  },
  {
    slug: 'cara-baca-slide-dosen',
    title: 'Cara Baca Slide Dosen dengan Lebih Efisien',
    excerpt: 'Slide yang padat bisa dibaca lebih cepat kalau tahu bagian mana yang harus ditarik keluar.',
    paragraphs: [
      'Slide sering berfungsi sebagai peta, bukan sebagai materi lengkap.',
      'Jangan berhenti di bullet point; cari definisi, relasi, dan contoh yang mendasarinya.',
      'Slide terbaik untuk belajar adalah slide yang sudah kamu anotasi ulang.',
    ],
    bullets: ['Cari istilah kunci.', 'Tandai slide yang butuh referensi tambahan.', 'Tulis satu kalimat inti per slide penting.'],
  },
  {
    slug: 'jaga-konsistensi-project-kecil',
    title: 'Jaga Konsistensi Project Kecil Selama Semester',
    excerpt: 'Supaya mini project kuliah tidak berhenti di minggu kedua lalu hilang begitu saja.',
    paragraphs: [
      'Project kecil sering gagal karena tidak punya ritme pengerjaan yang realistis.',
      'Pisahkan backlog inti, nice-to-have, dan bug kecil sejak awal agar scope tidak melebar.',
      'Progress yang kecil tapi rutin jauh lebih berguna daripada sprint panik mendekati deadline.',
    ],
    bullets: ['Buat target mingguan.', 'Tulis issue kecil saat menemukannya.', 'Review progress setiap akhir pekan.'],
  },
]

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function dateAfter(offset) {
  return new Date(Date.now() + offset * DAY_MS).toISOString().slice(0, 10)
}

function pickFrom(list, index) {
  return list[index % list.length]
}

function buildSize(extension, index) {
  const base = extension === 'pdf' ? 1.4 : extension === 'pptx' ? 3.1 : 2.3
  return `${(base + index * 0.35).toFixed(1)} MB`
}

function buildMaterialTitle(category, topic, index) {
  const prefix = category === 'teori' ? 'Module' : 'Lab'
  return `${prefix} ${index} · ${topic}`
}

function makeMaterial(semesterId, courseId, category, index) {
  const topic = pickFrom(materialTopicMap[category], index - 1)
  const extension = pickFrom(materialExtensionMap[category], index - 1)

  return {
    id: `${semesterId}-${courseId}-${category}-${extension}-${index}`,
    title: buildMaterialTitle(category, topic, index),
    fileName: `${courseId}-${category}-${index}.${extension}`,
    updatedAt: dateAfter(-(index + Number(semesterId))),
    size: buildSize(extension, index),
    week: `Minggu ${index}`,
    url: FILE_URLS[extension],
  }
}

function buildMaterials(semesterId, courseId, category, total) {
  return Array.from({ length: total }, (_, index) => makeMaterial(semesterId, courseId, category, index + 1))
}

function buildCourse(semesterId, courseName, index) {
  const courseId = `${slugify(courseName)}-${index + 1}`
  const semesterOffset = Number(semesterId)
  const teoriCount = 8 + ((semesterOffset + index) % 5)
  const praktikumCount = 6 + ((semesterOffset + index) % 4)

  return {
    id: courseId,
    name: courseName,
    categories: {
      teori: buildMaterials(semesterId, courseId, 'teori', teoriCount),
      praktikum: buildMaterials(semesterId, courseId, 'praktikum', praktikumCount),
    },
  }
}

const semesters = Object.entries(COURSE_MAP).map(([id, courseNames]) => ({
  id,
  name: `Semester ${id}`,
  courses: courseNames.map((courseName, index) => buildCourse(id, courseName, index)),
}))

const courseCatalog = semesters.flatMap((semester) =>
  semester.courses.map((course) => ({
    semesterId: semester.id,
    courseId: course.id,
    course: course.name,
  })),
)

const tasks = Array.from({ length: 48 }, (_, index) => {
  const courseEntry = pickFrom(courseCatalog, index)
  const template = pickFrom(taskTemplates, index)
  const dueOffset = (index % 15) - 4

  return {
    id: `task-${index + 1}`,
    title: `${template.action} ${courseEntry.course}`,
    course: courseEntry.course,
    dueDate: dateAfter(dueOffset),
    status: pickFrom(taskStatuses, index + (index % 2)),
    priority: pickFrom(priorityLevels, index + 1),
    type: template.type,
  }
})

const schedule = Array.from({ length: 6 }, (_, dayIndex) =>
  Array.from({ length: 3 }, (_, slotIndex) => {
    const courseEntry = courseCatalog[(dayIndex * 5 + slotIndex * 3) % courseCatalog.length]
    const slot = scheduleSlots[(dayIndex + slotIndex) % scheduleSlots.length]

    return {
      id: `sc-${dayIndex + 1}-${slotIndex + 1}`,
      day: dayIndex + 1,
      course: courseEntry.course,
      room: pickFrom(roomPool, dayIndex + slotIndex),
      lecturer: pickFrom(lecturerPool, dayIndex * 2 + slotIndex),
      start: slot.start,
      end: slot.end,
      type: slotIndex === 1 ? 'Praktikum' : 'Kuliah',
    }
  }),
).flat()

function buildAnnouncementTime(index) {
  if (index < 4) {
    return `${10 + index * 15} menit lalu`
  }

  if (index < 8) {
    return `${index - 2} jam lalu`
  }

  return `${index - 6} hari lalu`
}

const announcementSeed = Array.from({ length: 12 }, (_, index) => {
  const template = pickFrom(announcementTemplates, index)

  return {
    id: `an-${index + 1}`,
    category: template.category,
    title: `${template.title} #${index + 1}`,
    body: template.body,
    time: buildAnnouncementTime(index),
  }
})

const announcementStream = Array.from({ length: 10 }, (_, index) => {
  const template = pickFrom(announcementTemplates, index + 2)

  return {
    category: template.category,
    title: `${template.title} Update ${index + 1}`,
    body: template.body,
  }
})

function buildBlogContentBlocks(paragraphs, bullets) {
  return {
    bullets,
    paragraphs,
  }
}

const blogPosts = blogBlueprints.map((post, index) => ({
  id: `blog-${index + 1}`,
  slug: post.slug,
  title: post.title,
  createdAt: dateAfter(-(index * 4 + 3)),
  excerpt: post.excerpt,
  contentBlocks: buildBlogContentBlocks(post.paragraphs, post.bullets),
}))

export function getSemesters() {
  return semesters
}

export function getSemesterById(semesterId) {
  return semesters.find((semester) => semester.id === semesterId)
}

export function getCourseById(semesterId, courseId) {
  const semester = getSemesterById(semesterId)
  return semester?.courses.find((course) => course.id === courseId)
}

export function getMaterials(semesterId, courseId, category) {
  const course = getCourseById(semesterId, courseId)
  return course?.categories?.[category] ?? []
}

export function getTasks() {
  return tasks
}

export function getSchedule() {
  return schedule
}

export function getScheduleForDay(dayIndex) {
  return schedule.filter((entry) => entry.day === dayIndex)
}

export function getTodaySchedule() {
  return getScheduleForDay(new Date().getDay())
}

export function getWeekdayLabel(dayIndex) {
  return weekdays[dayIndex] ?? '-'
}

export function getWeekdays() {
  return weekdays.map((label, index) => ({ index, label }))
}

export function getAnnouncementsSeed() {
  return announcementSeed
}

export function getAnnouncementStream() {
  return announcementStream
}

export function getBlogPosts() {
  return blogPosts
}

export function getBlogBySlug(slug) {
  return blogPosts.find((post) => post.slug === slug)
}
