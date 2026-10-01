import { RECIPIENT_COPY } from '@/components/RecipientSearchForm/constants'
import { RECIPIENT_RESULT_KIND } from '@/lib/recipients/constants'
import { HTML_VALUES } from '@/lib/ui/constants'
import styles from './RecipientSearchResult.module.scss'

const { FOUND } = RECIPIENT_RESULT_KIND
const { BUTTON, ROLE_STATUS, ROLE_ALERT } = HTML_VALUES
const {
  FOUND: FOUND_COPY,
  WRITE,
  PHONE_NOT_FOUND,
  USERNAME_NOT_FOUND,
  SWITCH_TO_USERNAME,
} = RECIPIENT_COPY

export type RecipientSearchDisplayResult =
  | { kind: typeof FOUND; chatId: string; label: string }
  | { kind: (typeof RECIPIENT_RESULT_KIND)['NOT_FOUND'] }
type RecipientSearchResultProps = {
  result: RecipientSearchDisplayResult | null
  error: string
  isPhone: boolean
  onUsernameSelect: () => void
  onWrite: () => void
}

export const RecipientSearchResult = ({
  result,
  error,
  isPhone,
  onUsernameSelect,
  onWrite,
}: RecipientSearchResultProps) => {
  if (error)
    return (
      <p className={styles.recipientSearchResult__error} role={ROLE_ALERT}>
        {error}
      </p>
    )
  if (!result) return null
  if (result.kind === FOUND)
    return (
      <div className={styles.recipientSearchResult}>
        <p className={styles.recipientSearchResult__status} role={ROLE_STATUS}>
          {FOUND_COPY}
        </p>
        <div className={styles.recipientSearchResult__card}>
          <p className={styles.recipientSearchResult__label}>{result.label}</p>
          <button
            className={styles.recipientSearchResult__write}
            type={BUTTON}
            onClick={onWrite}
          >
            {WRITE}
          </button>
        </div>
      </div>
    )
  return (
    <div className={styles.recipientSearchResult}>
      <p className={styles.recipientSearchResult__error} role={ROLE_STATUS}>
        {isPhone ? PHONE_NOT_FOUND : USERNAME_NOT_FOUND}
      </p>
      {isPhone && (
        <button
          className={styles.recipientSearchResult__switch}
          type={BUTTON}
          onClick={onUsernameSelect}
        >
          {SWITCH_TO_USERNAME}
        </button>
      )}
    </div>
  )
}
