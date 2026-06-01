import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthForm() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'error' | 'success', text }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage({ type: 'error', text: error.message })
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ type: 'success', text: '가입 확인 이메일을 발송했습니다. 메일함을 확인해주세요.' })
      }
    }

    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-logo">
        <div className="auth-logo-icon">⏱️</div>
        <div className="auth-logo-text">
          <span className="logo-nu">Nu</span><span className="logo-timing">timing</span>
        </div>
      </div>
      <p className="auth-tagline">영양제 복용 타이밍 최적화 서비스</p>

      <div className="auth-card">
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'auth-tab-active' : ''}`}
            onClick={() => { setMode('login'); setMessage(null) }}
          >
            로그인
          </button>
          <button
            className={`auth-tab ${mode === 'signup' ? 'auth-tab-active' : ''}`}
            onClick={() => { setMode('signup'); setMessage(null) }}
          >
            회원가입
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">이메일</label>
            <input
              type="email"
              className="auth-input"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">비밀번호</label>
            <input
              type="password"
              className="auth-input"
              placeholder={mode === 'signup' ? '6자 이상 입력' : '비밀번호 입력'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {message && (
            <div className={`auth-message auth-message-${message.type}`}>
              {message.text}
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <span className="loading-text">
                <span className="spinner" />
                처리 중...
              </span>
            ) : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>
      </div>

      <p className="auth-footer-note">
        ⚠️ Nutiming은 일반적인 정보 제공 목적이며, 의학적 진단 및 치료를 대체하지 않습니다.
      </p>
    </div>
  )
}
