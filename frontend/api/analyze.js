import { GoogleGenerativeAI } from '@google/generative-ai'

const SYSTEM_PROMPT = `당신은 영양제 및 건강 보충제 전문가입니다. 사용자가 복용하는 영양제 목록을 받아 최적의 복용 타이밍과 조합을 과학적 근거에 기반하여 분석합니다.

핵심 원칙:

[흡수율 관련]
- 지용성 비타민(A, D, E, K): 식사와 함께 복용해야 흡수율 극대화
- 수용성 비타민(C, B군): 공복 가능하나 위 자극 시 식사와 함께
- 철분: 공복 + 비타민C와 함께 복용 시 흡수율 2-3배 증가
- 오메가3: 지방이 있는 식사와 함께 (역류 방지 및 흡수 향상)
- 아연: 식사와 함께 권장 (공복 시 오심/구역 유발 가능)
- 코큐텐(CoQ10): 지용성이므로 식사와 함께
- 루테인/지아잔틴: 지용성, 식사와 함께

[복용 타이밍]
- 마그네슘: 저녁 또는 취침 전 권장 (근육 이완, 수면 개선)
- 유산균: 공복 또는 식전 30분 (위산 낮을 때 생존율 높음)
- 멜라토닌: 취침 30-60분 전
- 비타민B군: 아침/점심 권장 (에너지 대사 촉진으로 수면 방해 가능)
- 칼슘: 한 번에 500mg 이하로 분할 복용, 비타민D와 함께

[상호 작용 - 함께 먹으면 좋은 조합]
- 비타민D + 마그네슘: 마그네슘이 비타민D 활성화에 필요
- 비타민D + 비타민K2: 칼슘이 혈관 아닌 뼈로 가도록 유도
- 비타민C + 철분: 철분 흡수율 현저히 증가
- 오메가3 + 비타민E: 항산화 시너지
- 칼슘 + 비타민D: 칼슘 흡수 극대화

[상호 작용 - 분리 복용 필요]
- 철분 + 칼슘: 칼슘이 철분 흡수를 40-50% 방해 (최소 2시간 간격)
- 철분 + 마그네슘/아연: 서로 흡수 경쟁 (2시간 이상 간격)
- 아연 + 구리: 아연 고용량(>25mg) 시 구리 흡수 방해
- 비타민C + 비타민B12: 고용량 비타민C가 B12 분해 가능
- 갑상선 약 + 칼슘/마그네슘/철분: 4시간 이상 간격

중요 규칙:
- schedule의 각 배열에는 반드시 사용자가 입력한 영양제 이름을 그대로 사용하세요.
- 입력된 모든 영양제는 반드시 schedule의 다섯 슬롯 중 하나 이상에 포함되어야 합니다.
- 모르는 영양제는 가장 유사한 성분 계열로 분류하세요.
- 반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.`

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    schedule: {
      type: 'object',
      properties: {
        morning_empty:     { type: 'array', items: { type: 'string' } },
        morning_with_food: { type: 'array', items: { type: 'string' } },
        afternoon:         { type: 'array', items: { type: 'string' } },
        evening_with_food: { type: 'array', items: { type: 'string' } },
        before_bed:        { type: 'array', items: { type: 'string' } },
      },
      required: ['morning_empty', 'morning_with_food', 'afternoon', 'evening_with_food', 'before_bed'],
    },
    synergies: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          supplements: { type: 'array', items: { type: 'string' } },
          reason: { type: 'string' },
        },
        required: ['supplements', 'reason'],
      },
    },
    warnings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          supplements: { type: 'array', items: { type: 'string' } },
          reason: { type: 'string' },
        },
        required: ['supplements', 'reason'],
      },
    },
    tips: { type: 'array', items: { type: 'string' } },
  },
  required: ['schedule', 'synergies', 'warnings', 'tips'],
}

function mockResponse(supplements) {
  const half = Math.ceil(supplements.length / 2)
  return {
    _mock: true,
    schedule: {
      morning_empty:     supplements.slice(0, 1),
      morning_with_food: supplements.slice(1, half),
      afternoon:         [],
      evening_with_food: supplements.slice(half),
      before_bed:        [],
    },
    synergies: [
      {
        supplements: supplements.slice(0, 2),
        reason: '[테스트 응답] 이 영양제들은 함께 복용하면 시너지 효과가 있습니다.',
      },
    ],
    warnings: [],
    tips: [
      '[테스트 응답] API 연결이 없어 임시 데이터를 표시합니다.',
      '실제 배포 환경에서는 GEMINI_API_KEY 환경변수를 설정하세요.',
    ],
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { supplements } = req.body

  if (!Array.isArray(supplements) || supplements.length === 0) {
    res.status(400).json({ error: '영양제 목록이 비어있습니다.' })
    return
  }

  if (!process.env.GEMINI_API_KEY) {
    console.warn('[테스트 모드] GEMINI_API_KEY 미설정, 목업 응답 반환')
    res.status(200).json(mockResponse(supplements))
    return
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
      systemInstruction: SYSTEM_PROMPT,
    })

    const prompt = `다음 영양제들의 최적 복용 스케줄을 분석해주세요. 반드시 아래 이름 그대로 결과에 포함시켜야 합니다:\n${supplements.map((s, i) => `${i + 1}. ${s}`).join('\n')}`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const parsed = JSON.parse(text)

    res.status(200).json(parsed)
  } catch (err) {
    console.error(err)

    if (err instanceof SyntaxError) {
      res.status(500).json({ error: 'AI 응답을 파싱하는 중 오류가 발생했습니다. 다시 시도해주세요.' })
      return
    }

    const status = err.status ?? err.httpErrorCode ?? err.code
    const msg = err.message ?? ''

    if (status === 429 || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
      res.status(429).json({ error: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' })
      return
    }

    if (status === 401 || status === 403 || msg.includes('API key') || msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
      res.status(500).json({ error: 'API 인증에 실패했습니다. 관리자에게 문의하세요.' })
      return
    }

    if (status === 404 || msg.includes('not found') || msg.includes('MODEL_NOT_FOUND')) {
      res.status(500).json({ error: 'AI 모델을 찾을 수 없습니다. 관리자에게 문의하세요.' })
      return
    }

    if (status >= 500 || msg.includes('INTERNAL') || msg.includes('UNAVAILABLE')) {
      res.status(500).json({ error: 'AI 서버에 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' })
      return
    }

    res.status(500).json({ error: '분석 중 오류가 발생했습니다. 다시 시도해주세요.' })
  }
}
