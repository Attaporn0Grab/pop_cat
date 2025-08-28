import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { Leader } from '../lib/api'

function flagEmoji(code: string) {
  // Convert ISO-3166 alpha-2 to flag emoji
  if (!code || code.length !== 2) return '🏳️'
  const base = 127397
  const chars = code.toUpperCase().split('').map(c => String.fromCodePoint(base + c.charCodeAt(0)))
  return chars.join('')
}

export default function Leaderboard({ data }: { data: Leader[] }) {
  const prevIndex = useRef<Map<string, number>>(new Map())
  const [moves, setMoves] = useState<Record<string, 'up' | 'down' | ''>>({})

  // detect rank moves
  useEffect(() => {
    const m: Record<string, 'up' | 'down' | ''> = {}
    data.forEach((row, idx) => {
      const prev = prevIndex.current.get(row.country)
      if (prev == null) m[row.country] = ''
      else if (idx < prev) m[row.country] = 'up'
      else if (idx > prev) m[row.country] = 'down'
      else m[row.country] = ''
    })
    setMoves(m)
    // update map after render
    const map = new Map<string, number>()
    data.forEach((row, idx) => map.set(row.country, idx))
    prevIndex.current = map
  }, [data])

  return (
    <div className="w-full">
      <ul className="divide-y divide-white/10">
        {data.map((row, i) => {
          const move = moves[row.country] || ''
          const moveClass = move === 'up' ? 'rank-up' : move === 'down' ? 'rank-down' : 'li-enter'
          return (
            <li key={row.country}
                className={`relative flex items-center justify-between py-2 text-sm ${moveClass}`}>
              <div className="flex items-center gap-3">
                <span className="w-6 text-right opacity-70 tabular-nums">{i + 1}</span>
                <span className="text-lg">{flagEmoji(row.country)}</span>
                <span className="font-medium">{row.country}</span>
              </div>
              <span className="tabular-nums">{row.total.toLocaleString()}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}