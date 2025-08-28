export type Leader = { country: string; total: number }

export async function getLeaderboard(): Promise<Leader[]> {
  const res = await fetch('/api/leaderboard')
  if (!res.ok) return []
  return res.json()
}

export async function getGlobalTotal(): Promise<number> {
  const res = await fetch('/api/total')
  if (!res.ok) return 0
  const { total } = await res.json()
  return Number(total || 0)
}

export async function postPop(country: string, n: number): Promise<{ total: number; countryTotal: number } | null> {
  const res = await fetch('/api/pop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ country, n })
  })
  if (!res.ok) return null
  return res.json()
}
