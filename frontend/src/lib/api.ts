// frontend/src/lib/api.ts
import { API_BASE } from '../api'

export type Leader = { country: string; total: number }

export async function getLeaderboard(limit = 50): Promise<Leader[]> {
  const res = await fetch(`${API_BASE}/api/leaderboard?limit=${limit}`)
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? (data as Leader[]) : (data?.items ?? [])
}

export async function getGlobalTotal(): Promise<number> {
  const res = await fetch(`${API_BASE}/api/total`)
  if (!res.ok) return 0
  const { total } = await res.json()
  return Number(total || 0)
}

export async function postPop(country: string, n: number): Promise<{ total: number; countryTotal: number } | null> {
  const res = await fetch(`${API_BASE}/api/click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ country, n })
  })
  if (!res.ok) return null
  return res.json()
}
