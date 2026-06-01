import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TIME_SLOTS = [
  { key: 'morning_empty', label: '아침 공복', emoji: '🌅', desc: '기상 후 30분 이내' },
  { key: 'morning_with_food', label: '아침 식사', emoji: '🍳', desc: '아침 식사 시' },
  { key: 'afternoon', label: '점심 식사', emoji: '☀️', desc: '점심 식사 시' },
  { key: 'evening_with_food', label: '저녁 식사', emoji: '🌆', desc: '저녁 식사 시' },
  { key: 'before_bed', label: '취침 전', emoji: '🌙', desc: '자기 30~60분 전' },
]

function todayStr() {
  return new Date().toLocaleDateString('sv-SE') // YYYY-MM-DD
}

export default function ChecklistModal({ session, onClose }) {
  const [latestAnalysis, setLatestAnalysis] = useState(null)
  const [checked, setChecked] = useState({}) // { slotKey_itemName: bool }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const today = todayStr()

    // 가장 최근 분석 결과 불러오기
    const { data: analyses } = await supabase
      .from('analyses')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (analyses?.length > 0) {
      setLatestAnalysis(analyses[0])
    }

    // 오늘의 체크 기록 불러오기
    const { data: checkData } = await supabase
      .from('daily_checks')
      .select('checked_items')
      .eq('user_id', session.user.id)
      .eq('date', today)
      .maybeSingle()

    if (checkData?.checked_items) {
      setChecked(checkData.checked_items)
    }

    setLoading(false)
  }

  async function toggleCheck(slotKey, itemName) {
    const key = `${slotKey}__${itemName}`
    const next = { ...checked, [key]: !checked[key] }
    setChecked(next)

    setSaving(true)
    const today = todayStr()
    await supabase.from('daily_checks').upsert(
      { user_id: session.user.id, date: today, checked_items: next },
      { onConflict: 'user_id,date' }
    )
    setSaving(false)
  }

  const schedule = latestAnalysis?.result?.schedule || {}
  const allItems = TIME_SLOTS.flatMap((slot) =>
    (schedule[slot.key] || []).map((item) => `${slot.key}__${item}`)
  )
  const checkedCount = allItems.filter((k) => checked[k]).length
  const totalCount = allItems.length
  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">✅ 오늘의 복용 체크리스트</h2>
            <p className="modal-subtitle">
              {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="modal-loading">
              <div className="spinner spinner-dark" />
              <span>불러오는 중...</span>
            </div>
          ) : !latestAnalysis ? (
            <div className="modal-empty">
              <div className="modal-empty-icon">📋</div>
              <p>저장된 분석 결과가 없습니다.</p>
              <p className="modal-empty-sub">먼저 영양제를 분석하고 저장해주세요.</p>
            </div>
          ) : (
            <>
              {/* 진행률 */}
              <div className="checklist-progress">
                <div className="checklist-progress-top">
                  <span className="checklist-progress-label">오늘의 복용 현황</span>
                  <span className="checklist-progress-count">
                    {checkedCount} / {totalCount}
                    {saving && <span className="checklist-saving">저장 중</span>}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {progress === 100 && (
                  <p className="checklist-complete-msg">오늘 복용을 모두 완료했어요! 🎉</p>
                )}
              </div>

              {/* 시간대별 체크리스트 */}
              <div className="checklist-slots">
                {TIME_SLOTS.map((slot) => {
                  const items = schedule[slot.key] || []
                  if (items.length === 0) return null
                  return (
                    <div key={slot.key} className="checklist-slot">
                      <div className="checklist-slot-header">
                        <span className="checklist-slot-emoji">{slot.emoji}</span>
                        <div>
                          <div className="checklist-slot-label">{slot.label}</div>
                          <div className="checklist-slot-desc">{slot.desc}</div>
                        </div>
                      </div>
                      <div className="checklist-items">
                        {items.map((item) => {
                          const key = `${slot.key}__${item}`
                          const isDone = !!checked[key]
                          return (
                            <button
                              key={item}
                              className={`checklist-item ${isDone ? 'checklist-item-done' : ''}`}
                              onClick={() => toggleCheck(slot.key, item)}
                            >
                              <span className="checklist-checkbox">
                                {isDone ? '✓' : ''}
                              </span>
                              <span className="checklist-item-name">{item}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              <p className="checklist-source-note">
                기준: {new Date(latestAnalysis.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} 저장된 스케줄
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
