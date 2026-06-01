const TIME_SLOT_LABELS = {
  morning_empty: { label: '아침 공복', emoji: '🌅' },
  morning_with_food: { label: '아침 식사', emoji: '🍳' },
  afternoon: { label: '점심 식사', emoji: '☀️' },
  evening_with_food: { label: '저녁 식사', emoji: '🌆' },
  before_bed: { label: '취침 전', emoji: '🌙' },
}

function formatDate(isoString) {
  const d = new Date(isoString)
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function HistoryModal({ history, loading, onClose, onLoad, onDelete }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">📂 저장된 분석 결과</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="modal-loading">
              <div className="spinner spinner-dark" />
              <span>불러오는 중...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="modal-empty">
              <div className="modal-empty-icon">📋</div>
              <p>저장된 분석 결과가 없습니다.</p>
              <p className="modal-empty-sub">분석 후 저장하기 버튼을 눌러보세요.</p>
            </div>
          ) : (
            <ul className="history-list">
              {history.map((item) => (
                <li key={item.id} className="history-item">
                  <div className="history-item-meta">
                    <span className="history-date">{formatDate(item.created_at)}</span>
                    <span className="history-count">{item.supplements.length}개 영양제</span>
                  </div>
                  <div className="history-supplements">
                    {item.supplements.map((s) => (
                      <span key={s} className="history-chip">{s}</span>
                    ))}
                  </div>
                  <div className="history-schedule-preview">
                    {Object.entries(TIME_SLOT_LABELS).map(([key, { label, emoji }]) => {
                      const items = item.result?.schedule?.[key] || []
                      if (items.length === 0) return null
                      return (
                        <span key={key} className="history-slot-preview">
                          {emoji} {items.join(', ')}
                        </span>
                      )
                    })}
                  </div>
                  <div className="history-actions">
                    <button className="history-load-btn" onClick={() => onLoad(item)}>
                      불러오기
                    </button>
                    <button className="history-delete-btn" onClick={() => onDelete(item.id)}>
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
