import { describe, expect, it } from 'vitest'
import {
  mergeMessageFacts,
  mergeValidatedMessageFacts,
  mergeMessageStatus,
  mergeStatusFacts,
} from '@/lib/messages/merge-message-facts'
import type { MessageDTO } from '@/lib/messages/types'

const message = ({
  chatId = 'fictional-chat-a',
  idMessage = 'fictional-shared-id',
  text = 'known text',
  status = null,
  timestamp = 1,
  acceptedAt = null,
}: Partial<MessageDTO> = {}): MessageDTO => ({
  chatId,
  idMessage,
  direction: 'outgoing',
  kind: 'text',
  text,
  timestamp,
  acceptedAt,
  status,
})

const emptyEarly = () => ({ facts: [], sequence: 0 })

describe('pure message model', () => {
  it('keeps equal message IDs from different chats as separate messages', () => {
    const first = message({ chatId: 'fictional-chat-a', text: 'first chat' })
    const second = message({ chatId: 'fictional-chat-b', text: 'second chat' })
    const result = mergeMessageFacts({
      current: [first],
      messages: [second],
      source: 'live',
    })
    expect(result.messages).toHaveLength(2)
    expect(result.messages).toEqual([first, second])
  })

  it('keeps content provenance independent across chats with the same ID', () => {
    const accepted = message({
      chatId: 'fictional-chat-a',
      text: 'local text',
      timestamp: null,
      acceptedAt: 1_000,
      status: 'accepted',
    })
    const first = mergeMessageFacts({
      current: [],
      messages: [accepted],
      source: 'accepted',
    })
    const second = mergeMessageFacts({
      current: first.messages,
      messages: [message({ chatId: 'fictional-chat-b', text: 'other live' })],
      source: 'live',
      contentSources: first.contentSources,
    })
    const third = mergeMessageFacts({
      current: second.messages,
      messages: [
        message({ chatId: 'fictional-chat-a', text: 'provider text' }),
      ],
      source: 'history',
      contentSources: second.contentSources,
    })
    expect(third.messages).toHaveLength(2)
    expect(third.messages.map((item) => [item.chatId, item.text])).toEqual([
      ['fictional-chat-a', 'provider text'],
      ['fictional-chat-b', 'other live'],
    ])
  })

  it('replaces accepted content with provider content and resists late history after live', () => {
    const accepted = message({
      text: 'local',
      timestamp: null,
      acceptedAt: 1_000,
      status: 'accepted',
    })
    const first = mergeMessageFacts({
      current: [],
      messages: [accepted],
      source: 'accepted',
    })
    const second = mergeMessageFacts({
      current: first.messages,
      messages: [message({ text: 'provider', status: 'read' })],
      source: 'live',
      contentSources: first.contentSources,
    })
    const third = mergeMessageFacts({
      current: second.messages,
      messages: [message({ text: 'old history', status: 'delivered' })],
      source: 'history',
      contentSources: second.contentSources,
    })
    expect(third.messages).toEqual([
      message({ text: 'provider', acceptedAt: 1_000, status: 'read' }),
    ])
  })

  it('rejects a direct status merge for different message identities', () => {
    const previous = message({ chatId: 'fictional-chat-a' })
    const foreign = message({ chatId: 'fictional-chat-b', status: 'read' })
    expect(() => mergeMessageStatus({ previous, next: foreign })).toThrow(
      'Invalid message facts',
    )
  })
  it('keeps read monotonic and reports a conflicting provider failure', () => {
    const previous = message({ status: 'read' })
    const next = message({ status: 'failed' })
    expect(mergeMessageStatus({ previous, next })).toEqual({
      status: 'read',
      issue: {
        chatId: previous.chatId,
        idMessage: previous.idMessage,
        code: 'failed',
      },
    })
  })

  it('attaches an early status only to the exact chat before expiry', () => {
    const early = mergeStatusFacts({
      messages: [],
      statuses: [
        {
          chatId: 'fictional-chat-a',
          idMessage: 'fictional-shared-id',
          status: 'read',
        },
      ],
      early: emptyEarly(),
      now: 0,
    })
    const attached = mergeStatusFacts({
      messages: [message({ chatId: 'fictional-chat-b' }), message()],
      statuses: [],
      early: early.early,
      now: 299_999,
    })
    expect(attached.messages.map((item) => item.status)).toEqual([null, 'read'])
    const expired = mergeStatusFacts({
      messages: [message()],
      statuses: [],
      early: early.early,
      now: 300_000,
    })
    expect(expired.messages[0].status).toBeNull()
  })

  it('does not mutate source arrays or messages while merging', () => {
    const original = Object.freeze(message({ text: 'original' }))
    const incoming = Object.freeze(message({ text: 'updated', status: 'read' }))
    const current = Object.freeze([original])
    const facts = Object.freeze([incoming])
    const result = mergeMessageFacts({
      current: [...current],
      messages: [...facts],
      source: 'live',
    })
    expect(original.text).toBe('original')
    expect(incoming.text).toBe('updated')
    expect(result.messages[0]).not.toBe(original)
    expect(result.messages[0].status).toBe('read')
  })
  it('validates tagged facts before returning a source-free display model', () => {
    const original = Object.freeze(message({ text: 'original' }))
    const validFact = {
      message: message({ text: 'live update' }),
      source: 'live' as const,
    }
    const result = mergeValidatedMessageFacts({
      current: [original],
      facts: [validFact],
    })
    expect(result.messages[0]).toEqual(message({ text: 'original' }))
    expect(result.messages[0]).not.toHaveProperty('source')
    const invalid = {
      ...message({ idMessage: 'fictional-invalid' }),
      kind: 'unsupported' as const,
      text: 'invalid content',
    }
    expect(() =>
      mergeValidatedMessageFacts({
        current: [original],
        facts: [validFact, { message: invalid, source: 'history' }],
      }),
    ).toThrow('Invalid message facts')
    expect(original.text).toBe('original')
  })

  it('bounds early facts to the newest 1000 and leaves duplicates at the original expiry', () => {
    const statuses = Array.from({ length: 1_001 }, (_, index) => ({
      chatId: 'fictional-chat-a',
      idMessage: `fictional-id-${index}`,
      status: 'read' as const,
    }))
    const bounded = mergeStatusFacts({
      messages: [],
      statuses,
      early: emptyEarly(),
      now: 0,
    })
    expect(bounded.early.facts).toHaveLength(1_000)
    expect(bounded.early.facts[0].fact.idMessage).toBe('fictional-id-1')
    expect(bounded.early.facts.at(-1)?.fact.idMessage).toBe('fictional-id-1000')
    const first = mergeStatusFacts({
      messages: [],
      statuses: [statuses[0]],
      early: emptyEarly(),
      now: 0,
    })
    const duplicate = mergeStatusFacts({
      messages: [],
      statuses: [statuses[0]],
      early: first.early,
      now: 299_999,
    })
    const expired = mergeStatusFacts({
      messages: [message({ idMessage: statuses[0].idMessage })],
      statuses: [],
      early: duplicate.early,
      now: 300_000,
    })
    expect(expired.messages[0].status).toBeNull()
  })
})
