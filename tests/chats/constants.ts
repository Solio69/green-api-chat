export const CHAT_FIXTURES = {
  credentials: {
    idInstance: '99001401',
    apiTokenInstance: 'fictional-token-for-chat-list',
  },
  scopeA: 'a'.repeat(43),
  scopeB: 'b'.repeat(43),
  chat: { chatId: 'chat-1', name: 'Демо', username: '@demo', phone: null },
  provider: [
    {
      chatId: 'chat-1',
      type: 'user',
      name: ' Демо ',
      username: ' @demo ',
      phoneNumber: 0,
    },
  ],
} as const
