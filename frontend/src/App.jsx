import { useState } from 'react'
import SupplementInput from './components/SupplementInput'
import ScheduleResult from './components/ScheduleResult'

export default function App() {
  const [supplements, setSupplements] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const MOCK_RESULT = {
    schedule: {
      morning_empty: ['유산균'],
      morning_with_food: ['비타민C', '비타민B군', '철분'],
      afternoon: ['비타민C'],
      evening_with_food: ['비타민D', '오메가3', '아연', '코큐텐'],
      before_bed: ['마그네슘', '칼슘'],
    },
    synergies: [
      { supplements: ['비타민D', '마그네슘'], reason: '마그네슘이 비타민D 활성화에 필수적으로 관여하여 함께 복용 시 효과가 극대화됩니다.' },
      { supplements: ['비타민C', '철분'], reason: '비타민C가 철분의 흡수율을 2~3배 높여줍니다. 아침 식사와 함께 세트로 복용하세요.' },
      { supplements: ['칼슘', '비타민D'], reason: '비타민D가 장에서 칼슘 흡수를 도와 뼈 건강에 시너지 효과를 냅니다.' },
    ],
    warnings: [
      { supplements: ['철분', '칼슘'], reason: '칼슘이 철분 흡수를 최대 50% 방해합니다. 철분은 아침, 칼슘은 저녁·취침 전으로 분리하세요.' },
      { supplements: ['철분', '마그네슘'], reason: '미네랄끼리 흡수 경로를 놓고 경쟁합니다. 최소 2시간 간격을 두고 복용하세요.' },
    ],
    tips: [
      '철분은 공복에 비타민C와 함께 복용할 때 흡수율이 가장 높습니다.',
      '마그네슘은 근육 이완 효과가 있어 취침 전 복용 시 수면 질 개선에 도움이 됩니다.',
      '오메가3는 지방이 있는 식사와 함께 복용해야 생선 냄새 역류를 줄이고 흡수율을 높일 수 있습니다.',
      '유산균은 위산이 적은 공복 상태에서 생존율이 가장 높습니다.',
    ],
  }

  const analyzeSupplements = async () => {
    if (supplements.length === 0) return
    setLoading(true)
    setError(null)
    setResult(null)
    // TODO: 백엔드 연결 시 아래 목업 코드를 제거하고 fetch 블록을 사용하세요
    await new Promise((r) => setTimeout(r, 800))
    setResult(MOCK_RESULT)
    setLoading(false)
    /* 실제 API 호출 코드 (백엔드 준비 후 활성화)
    try {
      const res = await fetch(import.meta.env.VITE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplements }),
      })
      if (!res.ok) throw new Error(`오류 ${res.status}`)
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError('분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
    */
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-wrapper">
            <div className="logo-icon">⏱️</div>
            <div className="logo-text">
              <span className="logo-nu">Nu</span><span className="logo-timing">timing</span>
            </div>
          </div>
          <p className="header-tagline">복용 중인 영양제를 입력하면 최적의 타이밍과 조합을 알려드립니다</p>
        </div>
      </header>

      <main className="app-main">
        <SupplementInput supplements={supplements} setSupplements={setSupplements} />

        <button
          className="analyze-btn"
          onClick={analyzeSupplements}
          disabled={loading || supplements.length === 0}
        >
          {loading ? (
            <span className="loading-text">
              <span className="spinner" />
              AI 분석 중...
            </span>
          ) : (
            '✨ 복용 스케줄 분석하기'
          )}
        </button>

        {error && <div className="error-box">{error}</div>}
        {result && <ScheduleResult result={result} supplements={supplements} />}
      </main>

      <footer className="app-footer">
        <p>⚠️ Nutiming은 일반적인 정보 제공 목적이며, 의학적 진단 및 치료를 대체하지 않습니다.</p>
      </footer>
    </div>
  )
}
