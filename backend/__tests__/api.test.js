import request from 'supertest'
import { jest } from '@jest/globals'

const mockDb = {
  getTotal: jest.fn(),
  getLeaderboard: jest.fn(),
  addPops: jest.fn()
}
const mockRL = {
  canConsume: jest.fn()
}

jest.unstable_mockModule('../db.js', () => ({
  getTotal: mockDb.getTotal,
  getLeaderboard: mockDb.getLeaderboard,
  addPops: mockDb.addPops
}))
jest.unstable_mockModule('../rateLimiter.js', () => ({
  canConsume: mockRL.canConsume
}))

const { createApp } = await import('../app.js')

function makeApp() {
  process.env.ALLOWED_ORIGIN = 'http://localhost:5173'
  process.env.RATE_WINDOW = '30'
  process.env.RATE_MAX = '800'
  return createApp()
}

describe('API', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2025-01-01T00:00:00Z'))
    jest.clearAllMocks()
  })

  test('GET /api/health', async () => {
    const app = makeApp()
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })

  test('GET /api/total', async () => {
    mockDb.getTotal.mockResolvedValueOnce(12345)
    const app = makeApp()
    const res = await request(app).get('/api/total')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ total: 12345 })
  })

  test('GET /api/leaderboard', async () => {
    const items = [{ country_code: 'TH', total: 10 }, { country_code: 'US', total: 5 }]
    mockDb.getLeaderboard.mockResolvedValueOnce(items)
    const app = makeApp()
    const res = await request(app).get('/api/leaderboard?limit=2')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ items })
    expect(mockDb.getLeaderboard).toHaveBeenCalledWith(2)
  })

  test('POST /api/click invalid', async () => {
    const app = makeApp()
    const res = await request(app).post('/api/click').send({ country: 'TH', n: 0 })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('invalid_body')
  })

  test('POST /api/click rate limited', async () => {
    mockRL.canConsume.mockReturnValueOnce({ ok: false, remaining: 0, resetIn: 10 })
    const app = makeApp()
    const res = await request(app).post('/api/click').send({ country: 'TH', n: 100 })
    expect(res.status).toBe(429)
    expect(res.body.error).toBe('rate_limited')
  })

  test('POST /api/click ok', async () => {
    mockRL.canConsume.mockReturnValueOnce({ ok: true, remaining: 700, resetIn: 20 })
    mockDb.addPops.mockResolvedValueOnce({ countryTotal: 111, globalTotal: 222 })
    const app = makeApp()
    const res = await request(app).post('/api/click').send({ country: 'TH', n: 100 })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ countryTotal: 111, total: 222 })
    expect(mockDb.addPops).toHaveBeenCalledWith('TH', 100)
  })

  test('GET /api/leaderboard clamp', async () => {
    mockDb.getLeaderboard.mockResolvedValueOnce([])
    const app = makeApp()
    const res = await request(app).get('/api/leaderboard?limit=10000')
    expect(res.status).toBe(200)
    expect(mockDb.getLeaderboard).toHaveBeenCalledWith(500)
  })
})