import { useState } from 'react'

const COMMON_SUPPLEMENTS = [
  '비타민C', '비타민D', '비타민B군', '마그네슘', '오메가3',
  '철분', '아연', '유산균', '칼슘', '콜라겐', '코큐텐', '루테인',
  '엽산', '비타민E', '비타민K2', '글루타치온',
]

export default function SupplementInput({ supplements, setSupplements }) {
  const [input, setInput] = useState('')

  const addSupplement = (name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (supplements.includes(trimmed)) {
      setInput('')
      return
    }
    setSupplements([...supplements, trimmed])
    setInput('')
  }

  const removeSupplement = (name) => {
    setSupplements(supplements.filter((s) => s !== name))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') addSupplement(input)
  }

  return (
    <div className="supplement-input-section">
      <h2 className="section-title">복용 중인 영양제</h2>

      <div className="input-row">
        <input
          type="text"
          className="supplement-text-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="영양제 이름 입력 후 Enter"
        />
        <button
          className="add-btn"
          onClick={() => addSupplement(input)}
          disabled={!input.trim()}
        >
          추가
        </button>
      </div>

      <div className="quick-add-section">
        <span className="quick-add-label">빠른 추가</span>
        <div className="quick-add-chips">
          {COMMON_SUPPLEMENTS.map((s) => (
            <button
              key={s}
              className={`chip ${supplements.includes(s) ? 'chip-active' : ''}`}
              onClick={() => addSupplement(s)}
            >
              {supplements.includes(s) ? '✓ ' : ''}{s}
            </button>
          ))}
        </div>
      </div>

      {supplements.length > 0 && (
        <div className="selected-supplements">
          <span className="selected-label">선택된 영양제 ({supplements.length}개)</span>
          <div className="tags">
            {supplements.map((s) => (
              <span key={s} className="tag">
                {s}
                <button
                  className="tag-remove"
                  onClick={() => removeSupplement(s)}
                  aria-label={`${s} 제거`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
