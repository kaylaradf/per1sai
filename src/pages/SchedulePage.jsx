import { useState } from 'react'
import Breadcrumbs from '../components/Breadcrumbs'
import { getScheduleForDay, getWeekdayLabel, getWeekdays } from '../data/archiveApi'
import useAsyncData from '../hooks/useAsyncData'
import useDesktopPageMeta from '../hooks/useDesktopPageMeta'

export default function SchedulePage() {
  const dayIndex = new Date().getDay()
  const [selectedDay, setSelectedDay] = useState(dayIndex)
  const weekdayOptions = getWeekdays()
  const selectedLabel = getWeekdayLabel(selectedDay)
  const { data: entries, loading } = useAsyncData(() => getScheduleForDay(selectedDay), `schedule:${selectedDay}`, [])

  useDesktopPageMeta('Jadwal Kuliah', loading ? 'Memuat jadwal...' : `${entries.length} kelas · ${selectedLabel}`)

  return (
    <div className="page-content">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Jadwal' }]} />
      <div className="day-tabs" role="tablist" aria-label="Pilih hari">
        {weekdayOptions.map((option) => (
          <button
            key={option.index}
            type="button"
            className={`day-tab ${option.index === selectedDay ? 'is-active' : ''}`}
            onClick={() => setSelectedDay(option.index)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="list-summary">
        Menampilkan {entries.length} kelas untuk {selectedLabel}. Hari ini: {getWeekdayLabel(dayIndex)}.
      </p>

      {loading ? (
        <p className="empty-state">Memuat jadwal untuk {selectedLabel}...</p>
      ) : entries.length === 0 ? (
        <p className="empty-state">Tidak ada jadwal pada hari {selectedLabel}.</p>
      ) : (
        <div className="schedule-list">
          {entries.map((entry) => (
            <article key={entry.id} className="schedule-card">
              <h3>{entry.course}</h3>
              <p>
                {entry.start} - {entry.end}
              </p>
              <p>{entry.room}</p>
              <p>{entry.lecturer}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
