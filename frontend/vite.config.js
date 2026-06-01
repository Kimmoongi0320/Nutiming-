import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function devApiPlugin() {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use('/api/analyze', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        let body = ''
        req.on('data', (chunk) => { body += chunk })
        req.on('end', async () => {
          try {
            const { supplements } = JSON.parse(body)

            if (!supplements || supplements.length === 0) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: '영양제 목록이 비어있습니다.' }))
              return
            }

            // API 키가 없으면 목업 응답
            if (!process.env.ANTHROPIC_API_KEY) {
              const half = Math.ceil(supplements.length / 2)
              const mock = {
                _mock: true,
                schedule: {
                  morning_empty:     supplements.slice(0, 1),
                  morning_with_food: supplements.slice(1, half),
                  afternoon:         [],
                  evening_with_food: supplements.slice(half),
                  before_bed:        [],
                },
                synergies: supplements.length >= 2
                  ? [{ supplements: supplements.slice(0, 2), reason: '[테스트 응답] 함께 복용하면 흡수율이 높아집니다.' }]
                  : [],
                warnings: [],
                tips: [
                  '[테스트 응답] API 연결 없이 임시 데이터를 표시합니다.',
                  '실제 분석을 원하면 .env에 ANTHROPIC_API_KEY를 추가하세요.',
                ],
              }
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(mock))
              return
            }

            // API 키가 있으면 실제 핸들러 호출
            const { default: handler } = await import('./api/analyze.js')
            req.body = { supplements }
            handler(req, res)
          } catch (err) {
            console.error('[dev-api]', err)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: '분석 중 오류가 발생했습니다.' }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), devApiPlugin()],
})
