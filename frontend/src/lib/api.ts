/* Thai:
ฟังก์ชันเรียก API ฝั่ง Backend:
- getLeaderboard, getGlobalTotal, postPop
- ปรับให้รองรับทั้งรูปแบบผลลัพธ์ที่เป็น array ตรงๆ หรือ {items: [...]}
- ครอบ res.ok เพื่อคืนค่าเริ่มต้นที่ปลอดภัยเมื่อเกิดข้อผิดพลาด
*/
export type Leader = { country: string; total: number }

export async function getLeaderboard(): Promise<Leader[]> {
  const res = await fetch('/api/leaderboard')
  if (!res.ok) return []
  const data = await res.json()
  // รองรับทั้งสองรูปแบบ: [{...}] หรือ { items: [{...}] }
  if (Array.isArray(data)) return data as Leader[]
  if (data && Array.isArray((data as any).items)) return (data as any).items as Leader[]
  return []
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
