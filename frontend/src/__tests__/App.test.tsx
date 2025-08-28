import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from '../App'

describe('Leaderboard toggle', () => {
  it('should start hidden', () => {
    render(<App />)
    const panel = screen.getByRole('complementary', { hidden: true })
    expect(panel).toHaveClass('translate-x-full')
  })

  it('should open when toggle button clicked', () => {
    render(<App />)
    const btn = screen.getByRole('button', { name: /leaderboard/i })
    fireEvent.click(btn)
    const panel = screen.getByRole('complementary', { hidden: true })
    expect(panel).toHaveClass('translate-x-0')
  })

  it('should close when hide button clicked inside', () => {
    render(<App />)
    const btn = screen.getByRole('button', { name: /leaderboard/i })
    fireEvent.click(btn)
    const hideBtn = screen.getByRole('button', { name: /hide/i })
    fireEvent.click(hideBtn)
    const panel = screen.getByRole('complementary', { hidden: true })
    expect(panel).toHaveClass('translate-x-full')
  })
})