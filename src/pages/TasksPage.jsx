import { useState } from 'react'
import Breadcrumbs from '../components/Breadcrumbs'
import { getTasks } from '../data/mockDb'
import useDesktopPageMeta from '../hooks/useDesktopPageMeta'

const statusLabels = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

const columns = ['todo', 'in_progress', 'done']

function isOverdue(task) {
  if (task.status === 'done') {
    return false
  }

  const due = new Date(task.dueDate)
  due.setHours(23, 59, 59, 999)
  return due < new Date()
}

export default function TasksPage() {
  const tasks = getTasks()
  const [query, setQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  useDesktopPageMeta('Tugas & Deadline', `${tasks.length} tugas aktif`)

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
      <p className="list-summary">
        {filteredTasks.length} tugas cocok filter · {overdueCount} overdue.
      </p>
      <div className="kanban-grid">
        {columns.map((status) => {
          const columnTasks = filteredTasks
            .filter((task) => task.status === status)
            .sort((left, right) => left.dueDate.localeCompare(right.dueDate))

          return (
            <section key={status} className="kanban-column">
              <h2>{statusLabels[status]}</h2>
              {columnTasks.map((task) => {
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
                    <p className="task-meta">
                      Due: {task.dueDate} {overdue ? '· Overdue' : ''}
                    </p>
                  </article>
                )
              })}
              {columnTasks.length === 0 && <p className="column-empty">Tidak ada tugas pada kolom ini.</p>}
            </section>
          )
        })}
      </div>
    </div>
  )
}
