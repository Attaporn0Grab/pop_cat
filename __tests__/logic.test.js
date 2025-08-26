// __tests__/logic.test.js
const { incrementCount, total } = require("../popcat/src/logic.js"); // ดึงฟังก์ชันที่จะเทสต์

test("increment TH by 1", () => {
  const next = incrementCount({}, "TH", 1); // เริ่มจากค่าว่าง แล้วเพิ่ม TH 1 ครั้ง
  expect(next.TH).toBe(1);                  // ค่าของ TH ต้องเป็น 1
  expect(total(next)).toBe(1);              // ผลรวมทั้งหมดต้องเป็น 1
});

test("accumulates multiple countries", () => {
  let c = incrementCount({}, "TH", 2);      // TH +2
  c = incrementCount(c, "JP", 3);           // JP +3
  expect(c.TH).toBe(2);                     // เช็คค่า TH
  expect(c.JP).toBe(3);                     // เช็คค่า JP
  expect(total(c)).toBe(5);                 // รวม = 2 + 3 = 5
});
