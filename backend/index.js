/* Thai:
ตัวรันเซิร์ฟเวอร์จริง:
- import createApp() แล้วค่อย app.listen(PORT)
- จัดการ graceful shutdown โดยปิด pool ของฐานข้อมูลให้เรียบร้อย
*/
import { createApp } from './app.js'
import { pool } from './db.js'

const app = createApp()
const PORT = Number(process.env.PORT || 8787)

process.on('SIGTERM', async () => { try { await pool.end() } finally { process.exit(0) } })
process.on('SIGINT', async () => { try { await pool.end() } finally { process.exit(0) } })

app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`)
})