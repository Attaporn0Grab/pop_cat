/* Thai:
แอป Express หลัก (ไม่ผูกพอร์ตโดยตรง):
- export ฟังก์ชัน createApp() สำหรับใช้กับเซิร์ฟเวอร์จริงและกับเทส
- เส้นทาง /api/health, /api/total, /api/leaderboard, /api/click, /api/pop
- ใช้ zod ตรวจสอบ body และ rateLimiter สำหรับจำกัดความเร็ว
- แยก concerns: ฝั่ง IO/API อยู่ที่นี่, ส่วน DB แยกไว้ใน db.js
*/
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import { z } from 'zod'
import { addPops, getLeaderboard, getTotal } from './db.dynamo.js'
import { canConsume } from './rateLimiter.js'

export function createApp() {
  const app = express()
  const ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173'
  const RATE_WINDOW = Number(process.env.RATE_WINDOW || 30)
  const RATE_MAX = Number(process.env.RATE_MAX || 800)

  app.use(helmet())
  app.use(express.json())
  app.use(cors({ origin: ORIGIN, credentials: true }))
  app.use(morgan(process.env.NODE_ENV === 'test' ? 'tiny' : 'combined'))

  app.get('/api/health', (req, res) => {
    res.json({ ok: true })
  })

  app.get('/api/total', async (req, res) => {
    try {
      const total = await getTotal()
      res.json({ total })
    } catch {
      res.status(500).json({ error: 'db_error' })
    }
  })

  app.get('/api/leaderboard', async (req, res) => {
    try {
      const limit = Math.min(500, Math.max(1, Number(req.query.limit || 200)))
      const rows = await getLeaderboard(limit)
      res.json({ items: rows })
    } catch {
      res.status(500).json({ error: 'db_error' })
    }
  })

  const ClickBody = z.object({
    country: z.string().length(2).toUpperCase(),
    n: z.number().int().min(1).max(1000)
  })

  app.post('/api/click', async (req, res) => {
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.socket?.remoteAddress || '0.0.0.0'
    const parsed = ClickBody.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_body', details: parsed.error.issues })
    }
    const { country, n } = parsed.data
    const rl = canConsume(ip, n, RATE_WINDOW, RATE_MAX)
    if (!rl.ok) return res.status(429).json({ error: 'rate_limited', ...rl })
    try {
      const { countryTotal, globalTotal } = await addPops(country, n)
      res.json({ countryTotal, total: globalTotal })
    } catch {
      res.status(500).json({ error: 'db_error' })
    }
  })

  // backward-compatible alias for older frontend
  app.post('/api/pop', async (req, res) => {
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.socket?.remoteAddress || '0.0.0.0'
    const parsed = ClickBody.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_body', details: parsed.error.issues })
    }
    const { country, n } = parsed.data
    const rl = canConsume(ip, n, RATE_WINDOW, RATE_MAX)
    if (!rl.ok) return res.status(429).json({ error: 'rate_limited', ...rl })
    try {
      const { countryTotal, globalTotal } = await addPops(country, n)
      res.json({ countryTotal, total: globalTotal })
    } catch {
      res.status(500).json({ error: 'db_error' })
    }
  })

  return app
}