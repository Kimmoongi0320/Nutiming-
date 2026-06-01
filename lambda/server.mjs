import { createServer } from 'http'
import { handler } from './index.mjs'

const PORT = 3001

const server = createServer(async (req, res) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders)
    res.end()
    return
  }

  if (req.method !== 'POST') {
    res.writeHead(405, corsHeaders)
    res.end('Method Not Allowed')
    return
  }

  let body = ''
  for await (const chunk of req) body += chunk

  const event = { httpMethod: 'POST', body }

  try {
    const result = await handler(event)
    res.writeHead(result.statusCode, { ...corsHeaders, 'Content-Type': 'application/json' })
    res.end(result.body)
  } catch (err) {
    console.error(err)
    res.writeHead(500, corsHeaders)
    res.end(JSON.stringify({ error: '서버 오류' }))
  }
})

server.listen(PORT, () => {
  console.log(`✅ 로컬 서버 실행 중: http://localhost:${PORT}`)
})
