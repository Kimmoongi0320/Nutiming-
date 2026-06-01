import Anthropic from '@anthropic-ai/sdk'

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
- 모르는 영양제는 가장 유사한 성분 계열로 분류하세요.`

const TOOL_INPUT_SCHEMA = {
  type: 'object',
  properties: {
    schedule: {
      type: 'object',
      properties: {
        morning_empty:     { type: 'array', items: { type: 'string' }, description: '아침 공복에 복용 (기상 후 30분 이내)' },
        morning_with_food: { type: 'array', items: { type: 'string' }, description: '아침 식사와 함께 복용' },
        afternoon:         { type: 'array', items: { type: 'string' }, description: '점심 식사와 함께 복용' },
        evening_with_food: { type: 'array', items: { type: 'string' }, description: '저녁 식사와 함께 복용' },
        before_bed:        { type: 'array', items: { type: 'string' }, description: '취침 30-60분 전 복용' },
      },
      required: ['morning_empty', 'morning_with_food', 'afternoon', 'evening_with_food', 'before_bed'],
      additionalProperties: false,
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
        additionalProperties: false,
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
        additionalProperties: false,
      },
    },
    tips: { type: 'array', items: { type: 'string' } },
  },
  required: ['schedule', 'synergies', 'warnings', 'tips'],
  additionalProperties: false,
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
      '실제 배포 환경에서는 ANTHROPIC_API_KEY 환경변수를 설정하세요.',
    ],
  }
}

function isConnectionError(err) {
  if (err instanceof Anthropic.APIConnectionError) return true
  if (err instanceof Anthropic.AuthenticationError) return true
  return false
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

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[테스트 모드] ANTHROPIC_API_KEY 미설정, 목업 응답 반환')
    res.status(200).json(mockResponse(supplements))
    return
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      tools: [
        {
          name: 'supplement_schedule',
          description: '영양제 복용 스케줄 분석 결과를 반환합니다.',
          input_schema: TOOL_INPUT_SCHEMA,
        },
      ],
      tool_choice: { type: 'tool', name: 'supplement_schedule' },
      messages: [
        {
          role: 'user',
          content: `다음 영양제들의 최적 복용 스케줄을 분석해주세요. 반드시 아래 이름 그대로 결과에 포함시켜야 합니다:\n${supplements.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
        },
      ],
    })

    const toolUse = response.content.find((b) => b.type === 'tool_use')
    if (!toolUse) throw new Error('Claude 응답에 tool_use 블록이 없습니다.')

    res.status(200).json(toolUse.input)
  } catch (err) {
    if (isConnectionError(err)) {
      console.warn('[테스트 모드] API 연결 불가, 목업 응답 반환:', err.message)
      res.status(200).json(mockResponse(supplements))
      return
    }
    console.error(err)
    res.status(500).json({ error: '분석 중 오류가 발생했습니다.' })
  }
}
