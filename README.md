# Nutiming - AI 영양제 복용 타이밍 분석 서비스

> **복용 중인 영양제를 입력하면, AI가 최적의 복용 타이밍과 조합을 분석해드립니다.**

## 배포 주소

> Vercel로 배포되어 누구나 바로 사용할 수 있습니다.

**[https://nutiming.vercel.app](https://nutiming.vercel.app)**

---

## 주요 기능

### AI 복용 스케줄 분석
입력한 영양제 목록을 Google Gemini AI가 분석해 5개 시간대별 최적 복용 스케줄을 제시합니다.

| 시간대 | 설명 |
|--------|------|
| 🌅 아침 공복 | 기상 후 30분 이내 |
| 🍳 아침 식사와 함께 | 아침 식사 중 또는 직후 |
| ☀️ 점심 식사와 함께 | 점심 식사 중 또는 직후 |
| 🌆 저녁 식사와 함께 | 저녁 식사 중 또는 직후 |
| 🌙 취침 전 | 잠들기 30분~1시간 전 |

시너지 조합(함께 먹으면 좋은 것)과 분리 복용이 필요한 영양제도 함께 안내합니다.

### 일일 복용 체크리스트
저장된 분석 결과를 기반으로 오늘 복용해야 할 항목을 체크리스트로 확인합니다. 체크 상태는 실시간으로 저장됩니다.

### 월간 복용 달력
달력 뷰에서 날짜별 복용률을 확인하고, 이번 주 평균 복용률 통계를 볼 수 있습니다.

### 분석 이력 관리
과거에 저장한 분석 결과를 목록으로 확인하고 다시 불러올 수 있습니다.

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프론트엔드 | React 18, Vite 6 |
| 인증 / DB | Supabase (PostgreSQL) |
| AI 분석 | Google Gemini 2.5 Flash |
| 배포 | Vercel |

---

## 로컬 개발 환경 설정

### 사전 요구사항
- Node.js 18 이상
- Supabase 프로젝트
- Google Gemini API 키

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/your-username/nutiming.git
cd nutiming/frontend

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일을 열어 아래 값들을 입력하세요

# 개발 서버 실행
npm run dev
```

### 환경변수

`.env.example`을 복사해 `.env` 파일을 만들고 아래 값을 채워주세요.

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

`GEMINI_API_KEY`가 없을 경우 목업 데이터로 개발할 수 있습니다.

---

## Supabase 테이블 구조

```sql
-- 분석 결과 저장
create table analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  supplements text[] not null,
  result jsonb not null,
  created_at timestamptz default now()
);

-- 일일 복용 체크 기록
create table daily_checks (
  user_id uuid references auth.users not null,
  date date not null,
  checked_items jsonb not null default '{}',
  primary key (user_id, date)
);
```

---

## 프로젝트 구조

```
frontend/
├── src/
│   ├── App.jsx                   # 메인 앱 (인증, 상태, 모달 관리)
│   ├── App.css                   # 전체 스타일
│   ├── components/
│   │   ├── AuthForm.jsx          # 로그인 / 회원가입
│   │   ├── SupplementInput.jsx   # 영양제 입력 및 프리셋 선택
│   │   ├── ScheduleResult.jsx    # AI 분석 결과 표시
│   │   ├── HistoryModal.jsx      # 저장된 분석 이력
│   │   ├── ChecklistModal.jsx    # 오늘의 복용 체크리스트
│   │   └── CalendarModal.jsx     # 월간 복용 달력 및 통계
│   └── lib/
│       └── supabase.js           # Supabase 클라이언트
├── api/
│   └── analyze.js                # Gemini AI 분석 엔드포인트
├── vite.config.js                # Vite 설정 (개발 API 미들웨어 포함)
└── .env.example                  # 환경변수 템플릿
```

---

