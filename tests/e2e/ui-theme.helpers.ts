import type { Locator } from '@playwright/test'
import { THEME_BROWSER } from '../constants'

const {
  RGB_COMPONENTS,
  SRGB_MAX_CHANNEL,
  SRGB_LINEAR_THRESHOLD,
  SRGB_LINEAR_DIVISOR,
  SRGB_OFFSET,
  SRGB_SCALE,
  SRGB_EXPONENT,
  LUMINANCE_RED_WEIGHT,
  LUMINANCE_GREEN_WEIGHT,
  LUMINANCE_BLUE_WEIGHT,
  CONTRAST_OFFSET,
} = THEME_BROWSER

export const readStyles = (locator: Locator) =>
  locator.evaluate((element) => {
    const style = getComputedStyle(element)

    return {
      color: style.color,
      background: style.backgroundColor,
      border: style.borderTopColor,
      borderWidth: style.borderTopWidth,
      outline: style.outlineColor,
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
      shadow: style.boxShadow,
      fontSize: Number.parseFloat(style.fontSize),
      animation: style.animationName,
    }
  })

const luminance = (color: string) => {
  const channels = color.match(RGB_COMPONENTS)!.slice(0, 3).map(Number)
  const linear = channels.map((channel) => {
    const value = channel / SRGB_MAX_CHANNEL

    return value <= SRGB_LINEAR_THRESHOLD
      ? value / SRGB_LINEAR_DIVISOR
      : ((value + SRGB_OFFSET) / SRGB_SCALE) ** SRGB_EXPONENT
  })

  return (
    linear[0] * LUMINANCE_RED_WEIGHT +
    linear[1] * LUMINANCE_GREEN_WEIGHT +
    linear[2] * LUMINANCE_BLUE_WEIGHT
  )
}

export const textContrast = ({
  color,
  background,
}: {
  color: string
  background: string
}) => {
  const foreground = luminance(color)
  const surface = luminance(background)

  return (
    (Math.max(foreground, surface) + CONTRAST_OFFSET) /
    (Math.min(foreground, surface) + CONTRAST_OFFSET)
  )
}
