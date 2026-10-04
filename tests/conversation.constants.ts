import { RECIPIENT_API_CONTRACT } from './recipients.constants'

export const CONVERSATION_FIXTURES = {
  targetA: { chatId: 'chat-a', label: 'Демо А' },
  targetB: { chatId: 'chat-b', label: 'Демо Б' },
  scopeA: 'a'.repeat(43),
  scopeB: 'b'.repeat(43),
  newChatId: 'new-chat',
  phone: '12025550123',
  recipientChatId: '10000001',
  longChatId: 'long-target',
  longLabel: `@${RECIPIENT_API_CONTRACT.MAX_LENGTH_USERNAME}`,
  draftA: 'Черновик А',
  draftB: 'Черновик Б',
  messagesKey: ['messages', 'fixture'],
  knownMessage: 'known-message',
  lateResultDelay: 100,
  mobileViewport: { width: 390, height: 800 },
  desktopViewport: { width: 1280, height: 800 },
  viewportHeight: 800,
  longLabelViewportHeight: 1000,
  enlargedTextStyle: 'html { font-size: 200% }',
  longLabelWidths: [320, 680, 681, 1280],
  searchWidths: [320, 390, 1280],
  searchLayoutWidths: [320, 390, 1280, 1440, 1920, 2560],
  searchLayoutViewportHeight: 900,
  wideViewport: { width: 1920, height: 900 },
  summaryWidths: [320, 1280],
  enlargedWorkspaceWidths: [320, 768, 1280],
  textScales: [100, 200],
  mobileBreakpoint: 680,
  widths: [320, 360, 390, 680, 681, 768, 1280],
} as const

// Selection expectations remain independent of the production state constants.

export const CONVERSATION_CONTRACT = {
  PANEL_LIST: 'list',
  PANEL_CONVERSATION: 'conversation',
  ACTION_OPEN: 'open',
  ACTION_SHOW_LIST: 'showList',
  ACTION_CLOSE: 'close',
  BACK: 'Чаты',
  CLOSE: 'Закрыть чат',
  EMPTY_HEADING: 'Выберите чат',
  PANE_LABEL: 'Переписка',
  SIDEBAR_LABEL: 'Аккаунт, поиск и чаты',
  PREMATURE_EMPTY_HISTORY: 'Переписка ещё не начата',
  SELECTION_API_PATTERN: /\/api\/(?:messages|chats\/history|notifications)/,
  SEND_API_PATTERN: /\/api\/messages(?:\?|$)/,
} as const

export const WORKSPACE_FOCUS_FIXTURES = {
  OUTSIDE_CONTROL_ID: 'outside-workspace-control',
  OUTSIDE_CONTROL_LABEL: 'Внешнее действие',
} as const
