import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import AuthForm from './components/AuthForm'
import SupplementInput from './components/SupplementInput'
import ScheduleResult from './components/ScheduleResult'
import HistoryModal from './components/HistoryModal'
import ChecklistModal from './components/ChecklistModal'
import CalendarModal from './components/CalendarModal'

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = 로딩 중
  const [supplements, setSupplements] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | saved
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [showChecklist, setShowChecklist] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const saveResult = async () => {
    if (!result || !session) return
    setSaveStatus('saving')
    const { error } = await supabase.from('analyses').insert({
      user_id: session.user.id,
      supplements,
      result,
    })
    if (error) {
      setSaveStatus('idle')
      alert('저장 중 오류가 발생했습니다.')
    } else {
      setSaveStatus('saved')
    }
  }

  const openHistory = async () => {
    setShowHistory(true)
    setHistoryLoading(true)
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    setHistoryLoading(false)
    if (!error) setHistory(data)
  }

  const loadHistory = (item) => {
    setSupplements(item.supplements)
    setResult(item.result)
    setSaveStatus('saved')
    setShowHistory(false)
  }

  const deleteHistory = async (id) => {
    await supabase.from('analyses').delete().eq('id', id)
    setHistory((prev) => prev.filter((item) => item.id !== id))
  }

  const analyzeSupplements = async () => {
    if (supplements.length === 0) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplements }),
      })
      if (!res.ok) throw new Error(`오류 ${res.status}`)
      const data = await res.json()
      setResult(data)
      setSaveStatus('idle')
    } catch {
      setError('분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  // 세션 로딩 중
  if (session === undefined) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-logo">
          <span className="logo-nu">Nu</span><span className="logo-timing">timing</span>
        </div>
        <div className="spinner spinner-dark" />
      </div>
    )
  }

  // 미로그인 → 로그인 화면
  if (!session) return <AuthForm />

  // 로그인 완료 → 메인 앱
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-orb header-orb-1" />
        <div className="header-orb header-orb-2" />
        <div className="header-content">
          <div className="header-top-row">
            <div className="logo-wrapper">
              <div className="logo-icon">⏱️</div>
              <div className="logo-text">
                <span className="logo-nu">Nu</span><span className="logo-timing">timing</span>
              </div>
            </div>
            <div className="header-user">
              <span className="header-user-email">{session.user.email}</span>
              <button className="history-btn" onClick={() => setShowChecklist(true)}>✅ 오늘 복용</button>
              <button className="history-btn" onClick={() => setShowCalendar(true)}>📅 달력</button>
              <button className="history-btn" onClick={openHistory}>📂 내 기록</button>
              <button className="signout-btn" onClick={handleSignOut}>로그아웃</button>
            </div>
          </div>
          <p className="header-tagline">
            복용 중인 영양제를 입력하면<br />최적의 타이밍과 조합을 알려드립니다
          </p>
          <div className="header-steps">
            <div className="step"><span className="step-num">1</span> 영양제 선택</div>
            <span className="step-arrow">›</span>
            <div className="step"><span className="step-num">2</span> AI 분석</div>
            <span className="step-arrow">›</span>
            <div className="step"><span className="step-num">3</span> 스케줄 확인</div>
          </div>
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
        {result && (
          <ScheduleResult
            result={result}
            supplements={supplements}
            onSave={saveResult}
            saveStatus={saveStatus}
          />
        )}
      </main>

      {showHistory && (
        <HistoryModal
          history={history}
          loading={historyLoading}
          onClose={() => setShowHistory(false)}
          onLoad={loadHistory}
          onDelete={deleteHistory}
        />
      )}

      {showChecklist && (
        <ChecklistModal
          session={session}
          onClose={() => setShowChecklist(false)}
        />
      )}

      {showCalendar && (
        <CalendarModal
          session={session}
          onClose={() => setShowCalendar(false)}
        />
      )}

      <footer className="app-footer">
        <p>⚠️ Nutiming은 일반적인 정보 제공 목적이며, 의학적 진단 및 치료를 대체하지 않습니다.</p>
      </footer>
    </div>
  )
}
