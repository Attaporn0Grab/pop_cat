// __tests__/dom.test.js
const { total, incrementCount } = require("../popcat/src/logic.js");

test("render total to DOM", () => {
  // สร้าง DOM จำลอง
  document.body.innerHTML = `<span id="total">0</span>`;

  // อัพเดทยอดรวม แล้วใส่กลับไปใน DOM
  const counts = incrementCount({}, "TH", 5);
  document.getElementById("total").textContent = String(total(counts));

  // ตรวจว่า DOM แสดงผลถูก
  expect(document.getElementById("total").textContent).toBe("5");
});
