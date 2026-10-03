import type { RecipientQuery } from './validate-search'

export const formatRecipientLabel = (query: RecipientQuery): string =>
  'username' in query ? query.username : String(query.phoneNumber)
