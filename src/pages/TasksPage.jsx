import { useState } from 'react'
import Breadcrumbs from '../components/Breadcrumbs'
import { getTasks } from '../data/archiveApi'
import useAsyncData from '../hooks/useAsyncData'
import useDesktopPageMeta from '../hooks/useDesktopPageMeta'

const tabLabels = {
  in_progress: 'In Progress',
  expired: 'Expired',
}

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

const columns = ['in_progress', 'expired']

function isOverdue(task) {
  if (task.status === 'done') {
    return false
  }

  const due = new Date(task.dueDate)
  due.setHours(23, 59, 59, 999)
  return due < new Date()
}

export default function TasksPage() {
  const { data: tasks, loading } = useAsyncData(() => getTasks(), 'tasks', [])
  const [query, setQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')

  const filteredTasks = tasks.filter((task) => {
    const normalizedQuery = query.trim().toLowerCase()
    const matchesQuery =
      !normalizedQuery ||
      task.title.toLowerCase().includes(normalizedQuery) ||
      task.course.toLowerCase().includes(normalizedQuery) ||
      task.type.toLowerCase().includes(normalizedQuery)
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter

    return matchesQuery && matchesPriority
  })

  const overdueCount = filteredTasks.filter((task) => isOverdue(task)).length
  const groupedTasks = {
    in_progress: filteredTasks
      .filter((task) => task.status !== 'done' && !isOverdue(task))
      .sort((left, right) => left.dueDate.localeCompare(right.dueDate)),
    expired: filteredTasks
      .filter((task) => task.status !== 'done' && isOverdue(task))
      .sort((left, right) => right.dueDate.localeCompare(left.dueDate)),
  }
  const openTaskCount = groupedTasks.in_progress.length + groupedTasks.expired.length

  useDesktopPageMeta(
    'Tugas & Deadline',
    loading ? 'Memuat tugas dari PocketBase...' : `${openTaskCount} tugas terbuka · ${overdueCount} expired`,
  )

  return (
    <div className="page-content">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Tugas' }]} />
      <div className="toolbar">
        <label className="toolbar-field">
          <span>Cari tugas</span>
          <input
            className="toolbar-input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari judul, matkul, atau tipe tugas"
          />
        </label>
        <label className="toolbar-field toolbar-field--compact">
          <span>Prioritas</span>
          <select
            className="toolbar-select"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
          >
            <option value="all">Semua</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
      </div>
      {loading && <p className="empty-state">Memuat tugas...</p>}
      <p className="list-summary">
        {openTaskCount} tugas terbuka · {overdueCount} expired · task selesai disembunyikan.
      </p>
      <div className="kanban-grid">
        {columns.map((column) => (
          <section key={column} className="kanban-column task-tab-panel">
            <h2>
              {tabLabels[column]} ({groupedTasks[column].length})
            </h2>
            <div className="task-list">
              {groupedTasks[column].map((task) => {
                const overdue = isOverdue(task)

                return (
                  <article key={task.id} className={`task-card ${overdue ? 'is-overdue' : ''}`}>
                    <h3>{task.title}</h3>
                    <p>{task.course}</p>
                    <p className="task-meta-row">
                      <span className={`priority-chip priority-chip--${task.priority}`}>
                        {priorityLabels[task.priority]}
                      </span>
                      <span>{task.type}</span>
                    </p>
                    <p className="task-meta">Due: {task.dueDate}</p>
                  </article>
                )
              })}
              {groupedTasks[column].length === 0 && <p className="column-empty">Tidak ada tugas pada kolom ini.</p>}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
