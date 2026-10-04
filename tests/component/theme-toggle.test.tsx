import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { ThemeToggle } from '@/features/theme/ui'
import { THEME_BROWSER } from '../constants'

const { STORAGE_KEY, TOGGLE_LABEL } = THEME_BROWSER

const renderToggle = () => render(<ThemeToggle />)

beforeEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false })),
  )
})

afterEach(() => vi.unstubAllGlobals())

test('theme toggle: follows system until clicked and saves both manual choices', () => {
  renderToggle()

  const button = screen.getByRole('button', { name: TOGGLE_LABEL })
  expect(document.documentElement).not.toHaveAttribute('data-theme')

  fireEvent.click(button)
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  expect(localStorage.getItem(STORAGE_KEY)).toBe('dark')

  fireEvent.click(button)
  expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  expect(localStorage.getItem(STORAGE_KEY)).toBe('light')
})

test('theme toggle: inverts a dark system theme on the first click', () => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: true })),
  )
  renderToggle()

  fireEvent.click(screen.getByRole('button', { name: TOGGLE_LABEL }))

  expect(document.documentElement).toHaveAttribute('data-theme', 'light')
})

test('theme toggle: changes the current page when storage rejects a write', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Storage disabled', 'SecurityError')
  })
  renderToggle()

  expect(() =>
    fireEvent.click(screen.getByRole('button', { name: TOGGLE_LABEL })),
  ).not.toThrow()
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
})
