import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { ChatList } from '@/features/chats/ui'

const chatId = 'fictional-personal-chat'
const chat = { chatId, name: null, username: null, phone: null }

test('chat list: loading, empty and known rows are different states', () => {
  const onSelect = vi.fn()
  const view = render(
    <ChatList chats={undefined} isPending onSelect={onSelect} />,
  )
  expect(screen.getByRole('status')).toHaveTextContent('Загружаем чаты')
  expect(screen.queryByRole('list', { name: 'Личные чаты' })).toBeNull()

  view.rerender(<ChatList chats={[]} isPending={false} onSelect={onSelect} />)
  expect(screen.getByText('Пока нет чатов')).toBeVisible()
  expect(screen.queryByRole('status')).toBeNull()

  view.rerender(
    <ChatList chats={[chat]} isPending={false} onSelect={onSelect} />,
  )
  expect(screen.getByRole('list', { name: 'Личные чаты' })).toBeVisible()
  expect(screen.queryByText('Пока нет чатов')).toBeNull()
})

test('chat list: selected row keeps exact unread count and opens by keyboard', async () => {
  const user = userEvent.setup()
  const onSelect = vi.fn()
  render(
    <ChatList
      chats={[chat]}
      isPending={false}
      selectedChatId={chatId}
      labelsByChatId={{ [chatId]: 'Локальная подпись' }}
      unreadCountsByChatId={{ [chatId]: 120 }}
      onSelect={onSelect}
    />,
  )
  const button = screen.getByRole('button', { name: 'Локальная подпись' })
  expect(button).toHaveAttribute('aria-pressed', 'true')
  expect(
    screen.getByRole('img', { name: 'Новых сообщений: 120' }),
  ).toHaveTextContent('99+')
  await user.tab()
  expect(button).toHaveFocus()
  await user.keyboard('{Enter}')
  expect(onSelect).toHaveBeenCalledExactlyOnceWith({
    chatId,
    label: 'Локальная подпись',
  })
})
