'use client'

import { THEME_PREFERENCE } from '@/features/theme/model'
import { THEME_TOGGLE_COPY } from './constants'
import styles from './ThemeToggle.module.scss'

const { STORAGE_KEY, DARK_QUERY, LIGHT, DARK } = THEME_PREFERENCE
const { LABEL } = THEME_TOGGLE_COPY

export const ThemeToggle = () => {
  const handleThemeToggle = () => {
    const selectedTheme = document.documentElement.dataset.theme
    const isDark =
      selectedTheme === DARK ||
      (selectedTheme !== LIGHT && window.matchMedia(DARK_QUERY).matches)
    const nextTheme = isDark ? LIGHT : DARK

    document.documentElement.dataset.theme = nextTheme

    try {
      localStorage.setItem(STORAGE_KEY, nextTheme)
    } catch {
      // The current page still switches when browser storage is unavailable.
    }
  }

  return (
    <button
      className={styles.themeToggle}
      type="button"
      aria-label={LABEL}
      title={LABEL}
      onClick={handleThemeToggle}
    >
      <svg
        className={styles.themeToggle__moon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" />
      </svg>
      <svg
        className={styles.themeToggle__sun}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
      </svg>
    </button>
  )
}
