import { expect, test } from 'vitest'
import { normalizeNotification } from '@/lib/notifications/normalize-notification'
import { envelope, NOTIFICATION_TEST } from '../notifications/constants'
import {
  TEST_NOTIFICATION_PROTOCOL,
  TEST_MESSAGE_PROTOCOL,
  TEST_PROVIDER_PROTOCOL,
} from '../protocol.constants'

const UNSUPPORTED_ATTACHMENT_URL = 'https://invalid.example/private'

const {
  INCOMING_KIND: TEST_NOTIFICATION_PROTOCOL_INCOMING_KIND,
  IGNORED: TEST_NOTIFICATION_PROTOCOL_IGNORED,
  STATUS_KIND: TEST_NOTIFICATION_PROTOCOL_STATUS_KIND,
} = TEST_NOTIFICATION_PROTOCOL
const {
  INCOMING: TEST_MESSAGE_PROTOCOL_INCOMING,
  TEXT: TEST_MESSAGE_PROTOCOL_TEXT,
  UNSUPPORTED: TEST_MESSAGE_PROTOCOL_UNSUPPORTED,
  READ: TEST_MESSAGE_PROTOCOL_READ,
  NO_ACCOUNT: TEST_MESSAGE_PROTOCOL_NO_ACCOUNT,
} = TEST_MESSAGE_PROTOCOL
const {
  EXTENDED_TEXT_MESSAGE: TEST_PROVIDER_PROTOCOL_EXTENDED_TEXT_MESSAGE,
  GROUP: TEST_PROVIDER_PROTOCOL_GROUP,
  TELEGRAM: TEST_PROVIDER_PROTOCOL_TELEGRAM,
  TEXT_MESSAGE: TEST_PROVIDER_PROTOCOL_TEXT_MESSAGE,
  STATUS_WEBHOOK: TEST_PROVIDER_PROTOCOL_STATUS_WEBHOOK,
} = TEST_PROVIDER_PROTOCOL

const { CREDENTIALS, CHAT, MESSAGE, RECEIPT, TEXT, LABEL, TIMESTAMP } =
  NOTIFICATION_TEST
const normalize = (value: unknown) =>
  normalizeNotification({ value, credentials: CREDENTIALS })
test('incoming normalization preserves original text and exposes only safe canonical fields', () => {
  expect(normalize(envelope())).toEqual({
    receiptId: RECEIPT,
    event: {
      kind: TEST_NOTIFICATION_PROTOCOL_INCOMING_KIND,
      chatId: CHAT,
      displayLabel: LABEL,
      message: {
        chatId: CHAT,
        idMessage: MESSAGE,
        direction: TEST_MESSAGE_PROTOCOL_INCOMING,
        kind: TEST_MESSAGE_PROTOCOL_TEXT,
        text: TEXT,
        timestamp: TIMESTAMP,
        acceptedAt: null,
        status: null,
      },
    },
  })
})
test('extended text and known media normalize without downloading attachments', () => {
  expect(
    normalize(
      envelope({
        messageData: {
          typeMessage: TEST_PROVIDER_PROTOCOL_EXTENDED_TEXT_MESSAGE,
          extendedTextMessageData: { text: TEXT },
        },
      }),
    )?.event.kind,
  ).toBe(TEST_NOTIFICATION_PROTOCOL_INCOMING_KIND)
  const result = normalize(
    envelope({
      messageData: {
        typeMessage: 'imageMessage',
        fileMessageData: { downloadUrl: UNSUPPORTED_ATTACHMENT_URL },
      },
    }),
  )
  expect(JSON.stringify(result)).not.toContain('downloadUrl')
  expect(result?.event).toMatchObject({
    kind: TEST_NOTIFICATION_PROTOCOL_INCOMING_KIND,
    message: { kind: TEST_MESSAGE_PROTOCOL_UNSUPPORTED, text: null },
  })
})
test('groups and valid unrelated events are acknowledged as ignored', () => {
  expect(
    normalize(
      envelope({
        senderData: { chatId: '-1000', chatType: TEST_PROVIDER_PROTOCOL_GROUP },
      }),
    )?.event.kind,
  ).toBe(TEST_NOTIFICATION_PROTOCOL_IGNORED)
  expect(
    normalize(envelope({ typeWebhook: 'stateInstanceChanged' }))?.event.kind,
  ).toBe(TEST_NOTIFICATION_PROTOCOL_IGNORED)
})
for (const [index, value] of [
  envelope({
    instanceData: {
      idInstance: 'foreign',
      typeInstance: TEST_PROVIDER_PROTOCOL_TELEGRAM,
    },
  }),
  envelope({ senderData: {} }),
  envelope({ idMessage: 4 }),
  envelope({ timestamp: NaN }),
  envelope({
    messageData: { typeMessage: TEST_PROVIDER_PROTOCOL_TEXT_MESSAGE },
  }),
  envelope({
    messageData: {
      typeMessage: TEST_PROVIDER_PROTOCOL_TEXT_MESSAGE,
      textMessageData: { textMessage: CREDENTIALS.apiTokenInstance },
    },
  }),
].entries()) {
  test(`malformed event ${index} is not delivered or deleted`, () =>
    expect(normalize(value)).toBeNull())
}
test('known success status needs exact identity while noAccount without id is a general issue', () => {
  const success = normalize(
    envelope({
      typeWebhook: TEST_PROVIDER_PROTOCOL_STATUS_WEBHOOK,
      status: TEST_MESSAGE_PROTOCOL_READ,
      chatId: CHAT,
    }),
  )
  expect(success?.event).toEqual({
    kind: TEST_NOTIFICATION_PROTOCOL_STATUS_KIND,
    fact: {
      chatId: CHAT,
      idMessage: MESSAGE,
      status: TEST_MESSAGE_PROTOCOL_READ,
      timestamp: TIMESTAMP,
    },
  })
  expect(
    normalize(
      envelope({
        typeWebhook: TEST_PROVIDER_PROTOCOL_STATUS_WEBHOOK,
        status: TEST_MESSAGE_PROTOCOL_READ,
        idMessage: undefined,
        chatId: CHAT,
      }),
    ),
  ).toBeNull()
  expect(
    normalize(
      envelope({
        typeWebhook: TEST_PROVIDER_PROTOCOL_STATUS_WEBHOOK,
        status: TEST_MESSAGE_PROTOCOL_NO_ACCOUNT,
        idMessage: undefined,
        chatId: CHAT,
      }),
    )?.event,
  ).toMatchObject({
    kind: TEST_NOTIFICATION_PROTOCOL_STATUS_KIND,
    fact: {
      chatId: CHAT,
      idMessage: null,
      status: TEST_MESSAGE_PROTOCOL_NO_ACCOUNT,
    },
  })
})
