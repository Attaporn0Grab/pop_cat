/* Thai:
AWS Lambda handlers สำหรับ API Gateway HTTP API
- เส้นทาง: GET /api/health, GET /api/total, GET /api/leaderboard?limit=50
          POST /api/click  { country, n }
- ใช้โค้ดฐานข้อมูลร่วมกับ backend/db.dynamo.js
- รองรับ CORS แบบเบื้องต้น
*/
import { getTotal, getLeaderboard, addPops } from "../backend/db.dynamo.js"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
}

function resp(statusCode, body) {
  return { statusCode, headers: cors, body: JSON.stringify(body) }
}

export async function health() {
  return resp(200, { ok: true })
}

export async function total() {
  try {
    const total = await getTotal()
    return resp(200, { total })
  } catch {
    return resp(500, { error: "db_error" })
  }
}

export async function leaderboard(event) {
  const params = new URLSearchParams(event.rawQueryString || "")
  const lim = Math.max(1, Math.min(500, Number(params.get("limit") || 50)))
  try {
    const rows = await getLeaderboard(lim)
    return resp(200, rows)
  } catch {
    return resp(500, { error: "db_error" })
  }
}

export async function click(event) {
  try {
    const data = JSON.parse(event.body || "{}")
    const country = String(data.country || "").toUpperCase()
    const n = Math.max(1, Math.min(1000, Number(data.n || 1)))
    if (!/^[A-Z]{2}$/.test(country)) return resp(400, { error: "invalid_country" })
    const { countryTotal, globalTotal } = await addPops(country, n)
    return resp(200, { countryTotal, total: globalTotal })
  } catch {
    return resp(400, { error: "invalid_body" })
  }
}
