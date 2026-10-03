import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import {
  CONVERSATION_FIXTURES,
  RECIPIENT_CONTRACT,
  RECIPIENT_SCENARIOS,
} from '../constants'
import { RecipientSearchResult } from '@/components/RecipientSearchResult'

const { recipientChatId } = CONVERSATION_FIXTURES
const { FOUND, WRITE } = RECIPIENT_CONTRACT
const { foundPhone } = RECIPIENT_SCENARIOS

test('recipient result: displays the submitted label and opens the found chat', async () => {
  const user = userEvent.setup()
  const onWrite = vi.fn()
  const onUsernameSelect = vi.fn()
  render(
    <RecipientSearchResult
      result={{ kind: 'found', chatId: recipientChatId, label: foundPhone }}
      error=""
      isPhone
      onUsernameSelect={onUsernameSelect}
      onWrite={onWrite}
    />,
  )

  expect(screen.getByRole('status')).toHaveTextContent(FOUND)
  expect(screen.getByText(foundPhone, { exact: true })).toBeVisible()
  await user.click(screen.getByRole('button', { name: WRITE }))
  expect(onWrite).toHaveBeenCalledTimes(1)
  expect(onUsernameSelect).not.toHaveBeenCalled()
})
