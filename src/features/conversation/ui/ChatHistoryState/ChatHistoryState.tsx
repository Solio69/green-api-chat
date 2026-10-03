import { HISTORY_PANEL_STATE } from '@/features/conversation/ui/ChatHistoryPanel/constants'
import { HTML_VALUES } from '@/lib/ui/constants'
import { HISTORY_STATE_COPY } from './constants'
import styles from './ChatHistoryState.module.scss'

const { BUTTON, ROLE_ALERT, ROLE_STATUS } = HTML_VALUES
const { REFRESHING, EMPTY, ERROR } = HISTORY_PANEL_STATE
const {
  LOADING: LOADING_COPY,
  REFRESHING: REFRESHING_COPY,
  EMPTY_TITLE,
  EMPTY_HINT,
  ERROR_TITLE,
  ERROR_HINT,
  RETRY,
  RETRY_PENDING,
} = HISTORY_STATE_COPY
export const ChatHistoryState = ({
  kind,
  compact = false,
  isBusy = false,
  onRetry,
}: {
  kind: (typeof HISTORY_PANEL_STATE)[keyof typeof HISTORY_PANEL_STATE]
  compact?: boolean
  isBusy?: boolean
  onRetry: () => Promise<void>
}) => {
  const isError = kind === ERROR
  let title: string = LOADING_COPY
  let hint: string | null = null
  if (kind === EMPTY) {
    title = EMPTY_TITLE
    hint = EMPTY_HINT
  } else if (isError) {
    title = ERROR_TITLE
    hint = ERROR_HINT
  } else if (kind === REFRESHING) title = REFRESHING_COPY

  return (
    <div
      className={styles.chatHistoryState}
      data-compact={compact}
      role={isError ? ROLE_ALERT : ROLE_STATUS}
    >
      <p className={styles.chatHistoryState__title}>{title}</p>
      {hint && <p className={styles.chatHistoryState__hint}>{hint}</p>}
      {isError && (
        <button
          className={styles.chatHistoryState__retry}
          type={BUTTON}
          disabled={isBusy}
          onClick={() => {
            // Query owns refetch errors; React does not await click handlers.
            void onRetry()
          }}
        >
          {isBusy ? RETRY_PENDING : RETRY}
        </button>
      )}
    </div>
  )
}
