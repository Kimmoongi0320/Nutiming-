import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TIME_SLOT_LABELS = {
  morning_empty: { label: '아침 공복', emoji: '🌅' },
  morning_with_food: { label: '아침 식사', emoji: '🍳' },
  afternoon: { label: '점심 식사', emoji: '☀️' },
  evening_with_food: { label: '저녁 식사', emoji: '🌆' },
  before_bed: { label: '취침 전', emoji: '🌙' },
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function dateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function calcProgress(checkedItems, schedule) {
  if (!schedule) return 0
  const allItems = Object.values(schedule).flat()
  if (allItems.length === 0) return 0
  const done = Object.keys(checkedItems || {}).filter((k) => checkedItems[k]).length
  return Math.round((done / allItems.length) * 100)
}

function getWeekDates() {
  const today = new Date()
  const day = today.getDay()
  const dates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - day + i)
    dates.push(d.toLocaleDateString('sv-SE'))
  }
  return dates
}

export default function CalendarModal({ session, onClose }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [checksByDate, setChecksByDate] = useState({}) // { 'YYYY-MM-DD': { checked_items, analysis } }
  const [selectedDate, setSelectedDate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [latestSchedule, setLatestSchedule] = useState(null)

  useEffect(() => {
    loadMonthData(year, month)
  }, [year, month])

  async function loadMonthData(y, m) {
    setLoading(true)
    const firstDay = dateStr(y, m, 1)
    const lastDay = dateStr(y, m, new Date(y, m + 1, 0).getDate())

    // 이번 주가 월 경계에 걸칠 수 있으므로 주간 날짜도 범위에 포함
    const weekDates = getWeekDates()
    const rangeStart = [firstDay, weekDates[0]].sort()[0]
    const rangeEnd = [lastDay, weekDates[6]].sort().reverse()[0]

    const [checksResult, analysisResult] = await Promise.all([
      supabase
        .from('daily_checks')
        .select('date, checked_items')
        .eq('user_id', session.user.id)
        .gte('date', rangeStart)
        .lte('date', rangeEnd),
      supabase
        .from('analyses')
        .select('result, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1),
    ])

    const schedule = analysisResult.data?.[0]?.result?.schedule || null
    setLatestSchedule(schedule)

    const map = {}
    for (const row of checksResult.data || []) {
      map[row.date] = { checked_items: row.checked_items, schedule }
    }
    setChecksByDate(map)
    setLoading(false)
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
  }

  // 달력 날짜 계산
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const todayStr = new Date().toLocaleDateString('sv-SE')
  const selectedData = selectedDate ? checksByDate[selectedDate] : null

  const weekDates = getWeekDates()
  const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
  const weekStats = weekDates.map((ds) => {
    const data = checksByDate[ds]
    const progress = data ? calcProgress(data.checked_items, data.schedule) : -1
    return { ds, progress }
  })
  const daysWithData = weekStats.filter((s) => s.progress >= 0)
  const weekAvg = daysWithData.length > 0
    ? Math.round(daysWithData.reduce((sum, s) => sum + s.progress, 0) / daysWithData.length)
    : null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">📅 복용 달력</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* 이번 주 복용률 */}
          {!loading && (
            <div className="week-stats">
              <div className="week-stats-header">
                <span className="week-stats-title">이번 주 복용률</span>
                {weekAvg !== null && (
                  <span className={`week-stats-avg ${weekAvg >= 80 ? 'week-avg-good' : weekAvg >= 50 ? 'week-avg-mid' : 'week-avg-low'}`}>
                    평균 {weekAvg}%
                  </span>
                )}
              </div>
              <div className="week-stats-days">
                {weekStats.map(({ ds, progress }, i) => {
                  const isToday = ds === todayStr
                  return (
                    <div key={ds} className={`week-day-col ${isToday ? 'week-day-today' : ''}`}>
                      <div className="week-day-label">{WEEKDAY_LABELS[i]}</div>
                      <div className="week-day-bar-wrap">
                        <div
                          className={`week-day-bar-fill ${progress === 100 ? 'bar-complete' : progress > 0 ? 'bar-partial' : ''}`}
                          style={{ height: progress > 0 ? `${progress}%` : '0%' }}
                        />
                      </div>
                      <div className="week-day-pct">
                        {progress < 0 ? '-' : `${progress}%`}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 월 네비게이션 */}
          <div className="calendar-nav">
            <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
            <span className="cal-month-title">{year}년 {month + 1}월</span>
            <button className="cal-nav-btn" onClick={nextMonth}>›</button>
          </div>

          {loading ? (
            <div className="modal-loading">
              <div className="spinner spinner-dark" />
            </div>
          ) : (
            <>
              {/* 요일 헤더 */}
              <div className="calendar-grid">
                {WEEKDAYS.map((d, i) => (
                  <div
                    key={d}
                    className={`cal-weekday ${i === 0 ? 'cal-weekday-sun' : i === 6 ? 'cal-weekday-sat' : ''}`}
                  >
                    {d}
                  </div>
                ))}

                {/* 날짜 셀 */}
                {cells.map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} />
                  const ds = dateStr(year, month, day)
                  const isToday = ds === todayStr
                  const data = checksByDate[ds]
                  const progress = data ? calcProgress(data.checked_items, data.schedule) : -1
                  const isSelected = selectedDate === ds
                  const weekday = (firstWeekday + day - 1) % 7

                  return (
                    <button
                      key={day}
                      className={[
                        'cal-day',
                        isToday ? 'cal-day-today' : '',
                        isSelected ? 'cal-day-selected' : '',
                        progress === 100 ? 'cal-day-complete' : '',
                        progress > 0 && progress < 100 ? 'cal-day-partial' : '',
                        weekday === 0 ? 'cal-day-sun' : weekday === 6 ? 'cal-day-sat' : '',
                      ].filter(Boolean).join(' ')}
                      onClick={() => setSelectedDate(isSelected ? null : ds)}
                    >
                      <span className="cal-day-num">{day}</span>
                      {progress >= 0 && (
                        <span className="cal-day-dot">
                          {progress === 100 ? '✓' : `${progress}%`}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* 범례 */}
              <div className="cal-legend">
                <span className="cal-legend-item"><span className="cal-legend-dot cal-legend-complete">✓</span> 완료</span>
                <span className="cal-legend-item"><span className="cal-legend-dot cal-legend-partial">%</span> 일부 완료</span>
                <span className="cal-legend-item"><span className="cal-legend-dot cal-legend-today">오늘</span></span>
              </div>

              {/* 선택된 날짜 상세 */}
              {selectedDate && (
                <div className="cal-detail">
                  <h3 className="cal-detail-title">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                  </h3>
                  {!selectedData ? (
                    <p className="cal-detail-empty">이 날은 복용 기록이 없습니다.</p>
                  ) : (
                    <div className="cal-detail-slots">
                      {Object.entries(TIME_SLOT_LABELS).map(([key, { label, emoji }]) => {
                        const items = selectedData.schedule?.[key] || []
                        if (items.length === 0) return null
                        return (
                          <div key={key} className="cal-detail-slot">
                            <span className="cal-detail-slot-header">
                              {emoji} {label}
                            </span>
                            <div className="cal-detail-items">
                              {items.map((item) => {
                                const ck = `${key}__${item}`
                                const isDone = !!selectedData.checked_items?.[ck]
                                return (
                                  <span
                                    key={item}
                                    className={`cal-detail-item ${isDone ? 'cal-detail-item-done' : 'cal-detail-item-skip'}`}
                                  >
                                    {isDone ? '✓' : '✗'} {item}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
