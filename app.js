// backend/app.js
import express from 'express'
import cors from 'cors'
import { getTotal, getLeaderboard, addPops } from './db.js'      
import { canConsume } from './rateLimiter.js'

export function createApp() {
  const app = express()
  app.use(express.json())

  // CORS แบบยืดหยุ่นสำหรับ dev/test
  const allowed = process.env.ALLOWED_ORIGIN || '*'
  app.use(cors({
    origin: allowed === '*' ? true : allowed,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['content-type']
  }))

  app.get('/api/health', (_req, res) => {
    res.status(200).json({ ok: true })
  })

  app.get('/api/total', async (_req, res) => {
    try {
      const total = await getTotal()
      res.status(200).json({ total })
    } catch {
      res.status(500).json({ error: 'db_error' })
    }
  })

  app.get('/api/leaderboard', async (req, res) => {
    // เทสต์คาดหวัง clamp 1..500 และ body เป็น { items }
    const raw = Number(req.query.limit ?? 50)
    const limit = Math.max(1, Math.min(500, Number.isFinite(raw) ? raw : 50))
    try {
      const items = await getLeaderboard(limit)
      res.status(200).json({ items })
    } catch {
      res.status(500).json({ error: 'db_error' })
    }
  })

  app.post('/api/click', async (req, res) => {
    try {
      const country = String(req.body?.country ?? '').toUpperCase()
      const nNum = Number(req.body?.n ?? 1)
      const n = Math.max(1, Math.min(1000, Number.isFinite(nNum) ? nNum : 1))

      if (!/^[A-Z]{2}$/.test(country) || nNum < 1) {
        return res.status(400).json({ error: 'invalid_body' })
      }

      // rate limit (เทสต์จะ mock ฟังก์ชันนี้)
      const rl = canConsume(req.ip, {
        windowSec: Number(process.env.RATE_WINDOW ?? 30),
        max: Number(process.env.RATE_MAX ?? 800)
      })
      if (!rl?.ok) {
        return res.status(429).json({ error: 'rate_limited', ...rl })
      }

      const { countryTotal, globalTotal } = await addPops(country, n)
      return res.status(200).json({ countryTotal, total: globalTotal })
    } catch {
      return res.status(400).json({ error: 'invalid_body' })
    }
  })

  return app
}

// สำหรับรันเดี่ยวๆ แบบ dev
if (process.env.NODE_ENV !== 'test' && process.env.PORT) {
  const app = createApp()
  app.listen(Number(process.env.PORT), () => {
    // eslint-disable-next-line no-console
    console.log('API listening on', process.env.PORT)
  })
}
