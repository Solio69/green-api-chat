import type { RecipientQuery } from '@/lib/recipients/validate-search'

export const formatRecipientLabel = (query: RecipientQuery): string =>
  'username' in query ? query.username : String(query.phoneNumber)
