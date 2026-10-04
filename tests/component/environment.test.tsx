import type { QueryClient } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { createTestQueryClient } from '../support/query-client'

let finishedClient: QueryClient | undefined
let pendingSignal: AbortSignal | undefined

describe('DOM and QueryClient cleanup', { concurrent: false }, () => {
  test('renders with development React and owns a populated client', () => {
    expect(process.env.NODE_ENV).toBe('test')
    render(<div role="status">Previous test</div>)
    expect(screen.getByRole('status')).toHaveTextContent('Previous test')
    const client = createTestQueryClient()
    finishedClient = client
    client.setQueryData(['cleanup'], 'previous data')
    const pendingQuery = client.fetchQuery({
      queryKey: ['pending'],
      queryFn: ({ signal }) => {
        pendingSignal = signal
        return new Promise<string>(() => undefined)
      },
    })
    // Cleanup cancels this pending request after the test finishes.
    void pendingQuery.catch(() => undefined)
    expect(client.getQueryData(['cleanup'])).toBe('previous data')
    expect(pendingSignal?.aborted).toBe(false)
  })

  test('unmounts DOM, cancels queries and starts with an independent cache', () => {
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(document.body).toBeEmptyDOMElement()
    expect(finishedClient?.getQueryCache().getAll()).toEqual([])
    expect(pendingSignal?.aborted).toBe(true)
    const client = createTestQueryClient()
    expect(client).not.toBe(finishedClient)
    expect(client.getQueryData(['cleanup'])).toBeUndefined()
  })
})
