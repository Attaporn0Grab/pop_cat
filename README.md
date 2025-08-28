# Popcat Clone (React + Node/Express + PostgreSQL)

## Quick start
1) ที่โฟลเดอร์ราก:
```bash
docker compose up --build
```
API: http://localhost:8787, Postgres: localhost:5432

2) Frontend:
```bash
cd frontend
npm i
npm run dev
```
เปิด http://localhost:5173

## Notes
- Endpoint: `/api/pop`, `/api/total`, `/api/leaderboard`
- ปรับ ENV ใน `backend/.env.example` แล้วค่อยตั้งค่าใน compose หรือระบบจริง.
- โค้ดนี้เลี่ยงการใช้ asset ต้นฉบับของ popcat
