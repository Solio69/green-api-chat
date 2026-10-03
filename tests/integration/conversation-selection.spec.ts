import { expect, test } from '@playwright/test'
import {
  createConversationSelection,
  reduceConversationSelection,
} from '@/features/conversation/selection/model'
import {
  CONVERSATION_CONTRACT,
  CONVERSATION_FIXTURES,
  TEST_REQUEST_FIXTURES,
} from '../constants'

const { targetA, targetB } = CONVERSATION_FIXTURES
const {
  ACTION_OPEN: OPEN,
  ACTION_SHOW_LIST: SHOW_LIST,
  ACTION_CLOSE: CLOSE,
  PANEL_CONVERSATION,
  PANEL_LIST,
} = CONVERSATION_CONTRACT
const { WHITESPACE } = TEST_REQUEST_FIXTURES

test('selection: A → A → B distinguishes access from recipient changes', () => {
  const updatedLabel = 'Подпись А'
  const initial = createConversationSelection()
  const a = reduceConversationSelection({
    state: initial,
    action: { type: OPEN, target: targetA },
  })
  expect(a).toEqual({
    target: targetA,
    accessId: 1,
    selectionEpoch: 1,
    mobilePanel: PANEL_CONVERSATION,
  })
  const same = reduceConversationSelection({
    state: a,
    action: { type: OPEN, target: { ...targetA, label: updatedLabel } },
  })
  expect(same).toMatchObject({
    accessId: 2,
    selectionEpoch: 1,
    target: { label: updatedLabel },
  })
  const b = reduceConversationSelection({
    state: same,
    action: { type: OPEN, target: targetB },
  })
  expect(b).toEqual({
    target: targetB,
    accessId: 3,
    selectionEpoch: 2,
    mobilePanel: PANEL_CONVERSATION,
  })
  expect(initial).toEqual(createConversationSelection())
  expect(a).toMatchObject({ target: targetA, accessId: 1 })
})

test('selection: mobile back preserves target and reopening increments only access', () => {
  const a = reduceConversationSelection({
    state: createConversationSelection(),
    action: { type: OPEN, target: targetA },
  })
  const list = reduceConversationSelection({
    state: a,
    action: { type: SHOW_LIST },
  })
  expect(list).toEqual({
    target: targetA,
    accessId: 1,
    selectionEpoch: 1,
    mobilePanel: PANEL_LIST,
  })
  const reopened = reduceConversationSelection({
    state: list,
    action: { type: OPEN, target: targetA },
  })
  expect(reopened).toMatchObject({
    accessId: 2,
    selectionEpoch: 1,
    mobilePanel: PANEL_CONVERSATION,
  })
})

test('selection: close is idempotent and only increments the selection epoch', () => {
  const a = reduceConversationSelection({
    state: createConversationSelection(),
    action: { type: OPEN, target: targetA },
  })
  const closed = reduceConversationSelection({
    state: a,
    action: { type: CLOSE },
  })
  expect(closed).toEqual({
    target: null,
    accessId: 1,
    selectionEpoch: 2,
    mobilePanel: PANEL_LIST,
  })
  expect(
    reduceConversationSelection({ state: closed, action: { type: CLOSE } }),
  ).toEqual(closed)
})

test('selection: empty confirmed ID is ignored and missing label uses actual ID', () => {
  const initial = createConversationSelection()
  expect(
    reduceConversationSelection({
      state: initial,
      action: {
        type: OPEN,
        target: { chatId: WHITESPACE, label: targetA.label },
      },
    }),
  ).toEqual(initial)
  expect(
    reduceConversationSelection({
      state: initial,
      action: {
        type: OPEN,
        target: { chatId: targetA.chatId, label: WHITESPACE },
      },
    }),
  ).toMatchObject({ target: { chatId: targetA.chatId, label: targetA.chatId } })
})
