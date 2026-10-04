export const THEME_PREFERENCE = {
  STORAGE_KEY: 'green-api-chat-theme',
  DARK_QUERY: '(prefers-color-scheme: dark)',
  LIGHT: 'light',
  DARK: 'dark',
} as const

const { STORAGE_KEY, LIGHT, DARK } = THEME_PREFERENCE

export const THEME_BOOTSTRAP_SCRIPT = `
  try {
    const savedTheme = localStorage.getItem(${JSON.stringify(STORAGE_KEY)})
    if (savedTheme === ${JSON.stringify(LIGHT)} || savedTheme === ${JSON.stringify(DARK)}) {
      document.documentElement.dataset.theme = savedTheme
    }
  } catch {}
`
