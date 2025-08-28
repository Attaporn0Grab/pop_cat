// Thai: ใช้ VITE_API_BASE ถ้ามี ไม่งั้นใช้ /api เดิม
export const API_BASE = import.meta.env.VITE_API_BASE || ''
export const api = {
  async getTotal() {
    const r = await fetch(API_BASE + '/api/total')
    return r.json()
  },
  async getLeaderboard(limit=50) {
    const r = await fetch(API_BASE + `/api/leaderboard?limit=${limit}`)
    return r.json()
  },
  async click(country: string, n=1) {
    const r = await fetch(API_BASE + '/api/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country, n })
    })
    return r.json()
  }
}
