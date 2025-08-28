// in-memory per-IP sliding window. พอสำหรับ demo เท่านั้น
const buckets = new Map()

export function canConsume(ip, n, windowSec, maxPerWindow) {
  const now = Date.now()
  const w = windowSec * 1000
  const b = buckets.get(ip) || { count: 0, start: now }
  if (now - b.start >= w) {
    b.count = 0
    b.start = now
  }
  if (b.count + n > maxPerWindow) {
    buckets.set(ip, b)
    return { ok: false, remaining: Math.max(0, maxPerWindow - b.count), resetIn: Math.ceil((w - (now - b.start)) / 1000) }
  }
  b.count += n
  buckets.set(ip, b)
  return { ok: true, remaining: maxPerWindow - b.count, resetIn: Math.ceil((w - (now - b.start)) / 1000) }
}
