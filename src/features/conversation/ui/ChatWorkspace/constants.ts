export const WORKSPACE_FOCUS_SELECTORS = {
  SELECTED_CHAT: 'ul button[aria-pressed="true"]',
  OTHER_CHAT: 'ul button[aria-pressed="false"]',
  AVAILABLE_CONTROL: 'input:not([disabled]), button:not([disabled]), a[href]',
} as const
