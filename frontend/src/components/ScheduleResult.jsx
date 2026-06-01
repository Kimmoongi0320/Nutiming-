const TIME_SLOTS = [
  { key: 'morning_empty', label: '아침 공복', emoji: '🌅', desc: '기상 후 30분 이내', color: '#E8F5E9' },
  { key: 'morning_with_food', label: '아침 식사와 함께', emoji: '🍳', desc: '아침 식사 시', color: '#E3F2FD' },
  { key: 'afternoon', label: '점심 식사와 함께', emoji: '☀️', desc: '점심 식사 시', color: '#FFF8E1' },
  { key: 'evening_with_food', label: '저녁 식사와 함께', emoji: '🌆', desc: '저녁 식사 시', color: '#FCE4EC' },
  { key: 'before_bed', label: '취침 전', emoji: '🌙', desc: '자기 30-60분 전', color: '#EDE7F6' },
]

export default function ScheduleResult({ result }) {
  const { schedule, synergies, warnings, tips } = result

  const hasAnySchedule = TIME_SLOTS.some((slot) => schedule[slot.key]?.length > 0)

  return (
    <div className="result-section">
      <h2 className="section-title">📋 분석 결과</h2>

      {/* Schedule */}
      <div className="result-card">
        <h3 className="card-title">⏰ 시간대별 복용 스케줄</h3>
        {hasAnySchedule ? (
          <div className="schedule-grid">
            {TIME_SLOTS.map((slot) => {
              const items = schedule[slot.key] || []
              return (
                <div
                  key={slot.key}
                  className={`schedule-slot ${items.length === 0 ? 'schedule-slot-empty' : ''}`}
                  style={{ backgroundColor: items.length > 0 ? slot.color : '#F5F5F5' }}
                >
                  <div className="slot-header">
                    <span className="slot-emoji">{slot.emoji}</span>
                    <div>
                      <div className="slot-label">{slot.label}</div>
                      <div className="slot-desc">{slot.desc}</div>
                    </div>
                  </div>
                  <div className="slot-items">
                    {items.length > 0 ? (
                      items.map((item) => (
                        <span key={item} className="slot-item">{item}</span>
                      ))
                    ) : (
                      <span className="slot-empty-text">없음</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="empty-text">스케줄 정보가 없습니다.</p>
        )}
      </div>

      {/* Synergies */}
      {synergies?.length > 0 && (
        <div className="result-card">
          <h3 className="card-title synergy-title">✅ 함께 먹으면 좋은 조합</h3>
          <div className="interaction-list">
            {synergies.map((s, i) => (
              <div key={i} className="interaction-item synergy-item">
                <div className="interaction-supplements">
                  {s.supplements.map((sup, j) => (
                    <span key={sup}>
                      <span className="interaction-sup-name">{sup}</span>
                      {j < s.supplements.length - 1 && <span className="plus-sign"> + </span>}
                    </span>
                  ))}
                </div>
                <p className="interaction-reason">{s.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings?.length > 0 && (
        <div className="result-card">
          <h3 className="card-title warning-title">⚠️ 분리 복용 필요한 조합</h3>
          <div className="interaction-list">
            {warnings.map((w, i) => (
              <div key={i} className="interaction-item warning-item">
                <div className="interaction-supplements">
                  {w.supplements.map((sup, j) => (
                    <span key={sup}>
                      <span className="interaction-sup-name">{sup}</span>
                      {j < w.supplements.length - 1 && <span className="plus-sign"> + </span>}
                    </span>
                  ))}
                </div>
                <p className="interaction-reason">{w.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      {tips?.length > 0 && (
        <div className="result-card">
          <h3 className="card-title">💡 복용 팁</h3>
          <ul className="tips-list">
            {tips.map((tip, i) => (
              <li key={i} className="tip-item">{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
