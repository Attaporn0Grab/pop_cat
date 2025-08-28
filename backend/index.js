import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import { z } from 'zod'
import { addPops, getLeaderboard, getTotal, pool } from './db.js'
import { canConsume } from './rateLimiter.js'

const app = express()
const PORT = Number(process.env.PORT || 8787)
const ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173'
const RATE_WINDOW = Number(process.env.RATE_WINDOW || 30)
const RATE_MAX = Number(process.env.RATE_MAX || 800)

app.use(helmet())
app.use(express.json())
app.use(cors({ origin: ORIGIN }))
app.use(morgan('tiny'))

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.get('/api/total', async (req, res) => {
  try {
    const total = await getTotal()
    res.json({ total })
  } catch (e) {
    res.status(500).json({ error: 'db_error' })
  }
})

app.get('/api/leaderboard', async (req, res) => {
  try {
    const rows = await getLeaderboard(200)
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: 'db_error' })
  }
})

const PopSchema = z.object({
  country: z.string().toUpperCase().trim().length(2),
  n: z.number().int().min(1).max(800)
})

app.post('/api/pop', async (req, res) => {
  // basic rate-limit per IP window
  const ip = (req.headers['cf-connecting-ip'] || req.ip || '').toString()
  const parsed = PopSchema.safeParse({
    country: String(req.body?.country || '').toUpperCase(),
    n: Number(req.body?.n)
  })
  if (!parsed.success) return res.status(400).json({ error: 'bad_request' })

  const { country, n } = parsed.data
  const rl = canConsume(ip, n, RATE_WINDOW, RATE_MAX)
  if (!rl.ok) return res.status(429).json({ error: 'rate_limited', ...rl })

  try {
    const { countryTotal, globalTotal } = await addPops(country, n)
    res.json({ countryTotal, total: globalTotal })
  } catch (e) {
    res.status(500).json({ error: 'db_error' })
  }
})

// graceful shutdown
process.on('SIGTERM', async () => { await pool.end(); process.exit(0) })
process.on('SIGINT', async () => { await pool.end(); process.exit(0) })

app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`)
})
