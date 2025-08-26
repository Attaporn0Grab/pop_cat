// src/logic.js — ฟังก์ชันบริสุทธิ์ (ไม่ยุ่ง DOM)
function incrementCount(counts, code = "TH", step = 1) {
  const next = { ...counts };
  next[code] = (next[code] || 0) + step;
  return next;
}
function total(counts) {
  return Object.values(counts).reduce((a, b) => a + b, 0);
}

// export ให้ใช้ได้ทั้งในเบราว์เซอร์และใน Node (Jest)
if (typeof module !== "undefined" && module.exports) {
  module.exports = { incrementCount, total };
}
if (typeof window !== "undefined") {
  window.Popcat = { incrementCount, total };
}
