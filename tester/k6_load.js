import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 100,          // 100 concurrent users
  duration: '1m',    // ยิง 1 นาที
};

export default function () {
  const url = `${__ENV.API}/api/click`;
  const headers = { 'Content-Type': 'application/json' };
  for (let i = 0; i < 10; i++) {
    http.post(url, JSON.stringify({ country: "TH", click: 1 }), { headers });
  }
  sleep(1);
}
