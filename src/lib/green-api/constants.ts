export const GREEN_API_CONFIG = {
  HOST: 'https://4100.api.green-api.com',
  INSTANCE_PATH_PREFIX: 'waInstance',
  METHOD: 'getStateInstance',
  ACCOUNT_SETTINGS_METHOD: 'getAccountSettings',
  CHATS_METHOD: 'getChats',
  CHAT_HISTORY_METHOD: 'getChatHistory',
  SEND_MESSAGE_METHOD: 'sendMessage',
  NOTIFICATION_SETTINGS_METHOD: 'getSettings',
  RECEIVE_NOTIFICATION_METHOD: 'receiveNotification',
  DELETE_NOTIFICATION_METHOD: 'deleteNotification',
  CHECK_ACCOUNT_METHOD: 'checkAccount',
  TIMEOUT_MS: 10_000,
  RATE_LIMIT_RETRY_DELAY_MS: 1_100,
} as const

export const GREEN_API_STATES = {
  AUTHORIZED: 'authorized',
  NOT_AUTHORIZED: 'notAuthorized',
  PENDING_PASSWORD: 'pendingPassword',
  BLOCKED: 'blocked',
  SUSPENDED: 'suspended',
  STARTING: 'starting',
} as const

export const GREEN_API_BAD_REQUEST = {
  STARTING: 'instance in starting process try later',
  AMBIGUOUS: 'instance is starting or not authorized',
  EXPIRED:
    'Instance account is expired. Renew your instance from personal area',
} as const
