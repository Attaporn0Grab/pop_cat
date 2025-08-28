import React, { useEffect, useMemo, useRef, useState } from 'react'
import Cat from './components/Cat'
import Leaderboard from './components/Leaderboard'
import { COUNTRIES } from './lib/countries'
import { getGlobalTotal, getLeaderboard, postPop } from './lib/api'

export default function App() {
  const [open, setOpen] = useState(false)
  const [country, setCountry] = useState('TH')
  const [clicks, setClicks] = useState<Record<string, number>>({})
  const [countryTotal, setCountryTotal] = useState<number | null>(null)
  const currentLocal = (clicks[country] || 0)
  const [burst, setBurst] = useState(0)
  const [total, setTotal] = useState(0)
  const [leaders, setLeaders] = useState<{ country: string; total: number }[]>([])
  const [boardOpen, setBoardOpen] = useState(false)
  const [popFx, setPopFx] = useState<{id:number;x:number;y:number;txt:string}[]>([])
  const [pulseGlobal, setPulseGlobal] = useState(false)
  const [pulseLocal, setPulseLocal] = useState(false)
  const [pulseCountry, setPulseCountry] = useState(false)
  const idRef = useRef(1)

  // tiny pop sound using WebAudio
  const audioCtx = useMemo(() => {
    const A = (window as any).AudioContext || (window as any).webkitAudioContext
    return A ? new A() : null
  }, [])

  function blip() {
    if (!audioCtx) return
    const o = audioCtx.createOscillator()
    const g = audioCtx.createGain()
    o.type = 'square'
    o.frequency.value = 600
    g.gain.value = 0.02
    o.connect(g).connect(audioCtx.destination)
    o.start()
    o.stop(audioCtx.currentTime + 0.04)
  }

  
/* auto-open removed */
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    setBoardOpen(mq.matches)
    const on = (e: MediaQueryListEvent) => setBoardOpen(e.matches)
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])

  const handlePop = (point?: {x:number;y:number}) => {
    setOpen(true)
    setClicks(prev => ({ ...prev, [country]: (prev[country] || 0) + 1 }))
    setBurst(b => b + 1)
    blip()
    setPulseLocal(true)
    setTimeout(() => setPulseLocal(false), 360)
    setTimeout(() => setOpen(false), 90)

    // floating +1 near pointer
    if (point) {
      const id = idRef.current++
      setPopFx(fx => [...fx, { id, x: point.x, y: point.y, txt: '+1' }])
      setTimeout(() => setPopFx(fx => fx.filter(f => f.id !== id)), 650)
    }
  }

  // keyboard: spacebar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        handlePop()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ESC to close leaderboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBoardOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // flush burst ไป backend ทุก 400 มิลลิวินาที
  useEffect(() => {
    const id = setInterval(async () => {
      if (burst <= 0) return
      const n = Math.min(burst, 120)
      setBurst(burst - n)
      setTotal(t => t + n) // optimistic
      setPulseGlobal(true); setTimeout(() => setPulseGlobal(false), 360)
      const res = await postPop(country, n)
      if (res) {
        if (typeof res.total === 'number') setTotal(res.total)
        if (typeof (res as any).countryTotal === 'number') {
          setCountryTotal((res as any).countryTotal)
          setPulseCountry(true); setTimeout(() => setPulseCountry(false), 360)
        }
      }
    }, 400)
    return () => clearInterval(id)
  }, [burst, country])

  // โหลดสถิติเริ่มต้น + refresh leaderboard
  useEffect(() => {
    getGlobalTotal().then(setTotal).catch(() => {})
    getLeaderboard().then(setLeaders).catch(() => {})
    const t = setInterval(() => getLeaderboard().then(setLeaders).catch(() => {}), 5000)
    return () => clearInterval(t)
  }, [])

  // click-anywhere: ยกเว้น element ที่กำกับ data-nopop
  const onBackgroundPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement
    if (el.closest('[data-nopop="true"]')) return
    handlePop({ x: e.clientX, y: e.clientY })
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* พื้นหลังทั้งหมดคลิกเพื่อ pop ได้ */}
      <main
        className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center"
        onPointerDown={onBackgroundPointer}
      >
        <div className="w-full max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <h1 className="text-3xl md:text-4xl font-bold">POPCAT4CLOUD</h1>
            <div className="flex items-center gap-3" data-nopop="true">
              <label className="text-sm opacity-80">Country</label>
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="bg-black text-white border border-white/20 rounded-md py-2 px-3 outline-none focus:ring-2 focus:ring-white/30 appearance-none"
              >
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={`mt-2 text-base opacity-80 ${pulseGlobal ? 'pulse-once' : ''}`}>Global total: {total.toLocaleString()}</div>
          {countryTotal !== null && (
            <div className={`mt-1 text-sm opacity-70 ${pulseCountry ? 'pulse-once' : ''}`}>
              {country} total: {countryTotal.toLocaleString()}
            </div>
          )}

          <div className="mt-6 select-none">
            <Cat open={open} popClass={open ? 'pop-bounce' : ''} />
            <div className={`mt-3 text-base opacity-80 ${pulseLocal ? 'pulse-once' : ''}`}>
              Your clicks: {currentLocal.toLocaleString()} ({country})
            </div>
          </div>
        </div>

        {/* floating +1 fx */}
        <div className="pointer-events-none fixed inset-0">
          {popFx.map(f => (
            <div key={f.id}
                 className="float-up absolute text-white/90 text-xl md:text-2xl font-extrabold select-none fx-plus"
                 style={{ left: f.x + 'px', top: f.y + 'px' }}>
              {f.txt}
            </div>
          ))}
        </div>

        {/* Backdrop for drawer */}
        {boardOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-20" onClick={() => setBoardOpen(false)} />
        )}

        {/* Leaderboard */}
        <button
          aria-label="Toggle leaderboard"
          className="fixed bottom-5 right-5 z-40 rounded-full px-4 py-3 bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 active:scale-95"
          onClick={e => { e.stopPropagation(); setBoardOpen(v => !v) }}
          data-nopop="true"
          aria-hidden={!boardOpen}
        >
          {boardOpen ? 'Hide' : 'Leaderboard'}
        </button>

        {/* On large screens: persistent side panel; on small: drawer */}
        <div
          className={`fixed top-0 right-0 h-full drawer-wide w-[85%] sm:w-[420px] lg:w-[34vw] z-30 bg-black/80 backdrop-blur border-l border-white/10 p-4 transition-transform duration-300 transform will-change-transform animate-slideInRight ${boardOpen ? 'translate-x-0 drawer-open' : 'translate-x-full drawer-close pointer-events-none'}`}
          onPointerDown={e => e.stopPropagation()}
          data-nopop="true"
          aria-hidden={!boardOpen}
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Leaderboard</h2>
            <button className="text-sm opacity-80 hover:opacity-100 " onClick={() => setBoardOpen(false)}>Close</button>
          </div>
          <Leaderboard data={leaders} />
        </div>
      </main>
    </div>
  )
}