# Deploy POPCAT API บน AWS ด้วย Lambda + API Gateway + DynamoDB

## โครงสร้าง
- `backend/` Express ใช้ DynamoDB (รันโลคัลได้)
- `lambda/handlers.js` Lambda handlers
- `template.yaml` AWS SAM สำหรับสร้าง API + Table
- `.env.example` ต้องตั้งค่า `AWS_REGION`, `DDB_TABLE` ถ้ารันโลคัล

## รันโลคัลแบบเร็ว
```bash
cd backend
cp .env.example .env
npm i
npm start
# API จะอยู่ที่ http://localhost:3000
```

## ติดตั้งเครื่องมือ
- ติดตั้ง AWS CLI และ `aws configure`
- ติดตั้ง AWS SAM CLI

## สร้างและดีพลอย
```bash
sam build
sam deploy --guided
# ตั้งชื่อสแต็ก เช่น popcat-ddb
# เลือก region ap-southeast-1
# ยอมให้ SAM สร้าง role/permission
```
หลังดีพลอยเสร็จ จะได้ `ApiUrl` คล้ายๆ
```
https://abc123.execute-api.ap-southeast-1.amazonaws.com
```
เอา URL นี้ไปตั้งค่าใน frontend เป็น `VITE_API_BASE`

## เส้นทาง API
- `GET  /api/health`           → `{ ok: true }`
- `GET  /api/total`            → `{ total }`
- `GET  /api/leaderboard?limit=50` → `[ {country,total}, ... ]`
- `POST /api/click` `{ country, n }` → `{ countryTotal, total }`

## โครงสร้าง DynamoDB
Table: `popcat-stats-<stack>`
- Partition key: `pk` (String)
- แถวตัวอย่าง:
  - `{"pk":"GLOBAL#TOTAL","total":12345}`
  - `{"pk":"COUNTRY#TH","total":678}`

> หมายเหตุ: Leaderboard ใช้ `Scan` เหมาะกับเดโมและข้อมูลไม่ใหญ่ ถ้าโตมากให้ทำ GSI แล้ว Query ตามคะแนนแทน
