# POPCAT4CLOUD

โปรเจกต์ POPCAT ให้รันบน **AWS Serverless** โดยใช้ Lambda + API Gateway + DynamoDB
และมี frontend ที่เขียนด้วย React + Vite

## Features

- **Frontend**
  - React + Vite
  - กดแมว (`cat-open.png`/`cat-close.png`) เพื่อเพิ่มคะแนน
  - รองรับการกดค้าง (auto click)
  - คลิกที่ไหนก็ได้บนหน้าจอเพื่อยิง API
  - มี Leaderboard อันดับประเทศ พร้อม Drawer ด้านข้าง

- **Backend**
  - AWS Lambda (Node.js 20.x)
  - API Gateway (HTTP API)
  - DynamoDB เก็บสถิติรวมและคะแนนประเทศ
  - CORS เปิดให้เรียกจากทุกที่ได้

- **Infra as Code**
  - ใช้ AWS SAM (`template.yaml`) สำหรับ build/deploy
  - `sam build && sam deploy --guided`

## API Endpoints

Base URL: `<ApiUrl>` (ดูจาก Outputs ของ `sam deploy`)

- `GET /api/health` → ตรวจสอบว่า API ตอบกลับ
- `GET /api/total` → ได้ยอดรวมทั้งหมด
- `POST /api/click`  
  Body JSON:
  ```json
  { "country": "TH", "n": 3 }
  ```
  ตอบกลับ:
  ```json
  { "total": 1234, "countryTotal": 567 }
  ```
- `GET /api/leaderboard?limit=10` → อันดับประเทศ

## การติดตั้ง (Dev)

```bash
# frontend
cd frontend
npm install
npm run dev   # http://localhost:5173

# backend
sam build
sam deploy --guided --profile <aws-profile>
```

## โครงสร้างโฟลเดอร์

```
popcat-clone/
 ├─ backend/         # db adapters, lambda handlers
 ├─ frontend/        # React + Vite
 ├─ lambda/          # Lambda handler entrypoints
 ├─ template.yaml    # SAM template
 └─ .gitignore
```

## ข้อควรระวัง

- ห้าม commit `.env` และ `.aws-sam/`
- ถ้าใช้ AWS Academy Credentials ต้อง reconfigure ทุกครั้งที่หมดอายุ
- DynamoDB table ใช้ `PAY_PER_REQUEST` → เหมาะกับเดโม ไม่ต้องตั้ง capacity

## License

MIT

