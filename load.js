import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 100,         // ผู้ใช้พร้อมกัน 100 คน
  duration: '1m',   // ทดสอบ 1 นาทีเต็ม
};

export default function () {
  const url = `${__ENV.API}/api/click`;
  const headers = { 'Content-Type': 'application/json' };

  // ผู้ใช้ 1 คนยิง 10 ครั้งต่อรอบ
  for (let i = 0; i < 10; i++) {
    const payload = JSON.stringify({ country: "TH", click: 1 });
    http.post(url, payload, { headers });
  }

  // พักนิดหน่อยก่อนลูปต่อ
  sleep(1);
}
