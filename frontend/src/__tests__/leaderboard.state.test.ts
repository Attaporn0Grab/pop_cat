import { initialState, open, close, toggle } from "../core/ui/leaderboard"

test("initial state is hidden", () => {
  expect(initialState().open).toBe(false)
})

test("open -> close -> toggle transitions", () => {
  let s = initialState()
  s = open(s)
  expect(s.open).toBe(true)
  s = close(s)
  expect(s.open).toBe(false)
  s = toggle(s)
  expect(s.open).toBe(true)
  s = toggle(s)
  expect(s.open).toBe(false)
})
