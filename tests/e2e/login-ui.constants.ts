import { THEME_CONTRACT, VIEWPORTS } from '../constants'

export const LOGIN_UI_VIEWPORTS = [
  ...VIEWPORTS,
  { width: 360, height: 640 },
  { width: 390, height: 844 },
  { width: 390, height: 320 },
] as const

export const LOGIN_UI_EXPECTATIONS = {
  ...THEME_CONTRACT.LIGHT,
  CARD_MAX_WIDTH: 440,
  FIELD_MIN_FONT_SIZE: 16,
  FIELD_ERROR_FONT_SIZE: 12,
  GEOMETRY_TOLERANCE: 1,
} as const

export const LOGIN_UI_BROWSER = {
  TEXT_SELECTOR: 'h1, label, p, a, span',
  ENLARGED_TEXT_STYLE: ':root { font-size: 200%; }',
  LOADER_SELECTOR: '[aria-hidden="true"]',
  ATTR_ARIA_BUSY: 'aria-busy',
  MEDIA_REDUCE: 'reduce',
  MEDIA_NORMAL: 'no-preference',
  FORCED_COLORS_ACTIVE: 'active',
  FORCED_COLORS_NONE: 'none',
  OUTLINE_SOLID: 'solid',
} as const
