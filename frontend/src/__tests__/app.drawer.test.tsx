import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import { vi } from "vitest"
import App from "../App"

// mock fetches used inside App
global.fetch = vi.fn((input: RequestInfo) => {
  const url = typeof input === "string" ? input : input.url
  if (url.endsWith("/api/leaderboard")) {
    return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
  }
  if (url.endsWith("/api/total")) {
    return Promise.resolve(new Response(JSON.stringify({ total: 0 }), { status: 200 }))
  }
  if (url.endsWith("/api/pop")) {
    return Promise.resolve(new Response(JSON.stringify({ total: 0, countryTotal: 0 }), { status: 200 }))
  }
  return Promise.resolve(new Response("{}", { status: 200 }))
}) as any

test("drawer is hidden by default, can open and close on any viewport", () => {
  render(<App />)

  // panel should be off-screen initially
  const panel = screen.getByRole("heading", { name: /leaderboard/i }).closest("div")
  expect(panel?.className).toMatch(/translate-x-full/)

  const toggleBtn = screen.getByRole("button", { name: /leaderboard|hide/i })
  // open
  fireEvent.click(toggleBtn)
  expect(panel?.className).toMatch(/translate-x-0/)

  // close via Hide button
  const hideBtn = screen.getByRole("button", { name: /hide/i })
  fireEvent.click(hideBtn)
  expect(panel?.className).toMatch(/translate-x-full/)

  // open again, close by clicking backdrop
  fireEvent.click(toggleBtn)
  const backdrop = document.querySelector(".fixed.inset-0")
  if (backdrop) fireEvent.click(backdrop)
  expect(panel?.className).toMatch(/translate-x-full/)

  // open again, close by ESC
  fireEvent.click(toggleBtn)
  fireEvent.keyDown(window, { key: "Escape" })
  expect(panel?.className).toMatch(/translate-x-full/)
})
