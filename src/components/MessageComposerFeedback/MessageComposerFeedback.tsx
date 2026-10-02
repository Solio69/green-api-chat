import { HTML_VALUES } from '@/lib/ui/constants'
import { MESSAGE_COMPOSER_FEEDBACK_COPY } from './constants'
import styles from './MessageComposerFeedback.module.scss'

const { BUTTON, ROLE_ALERT, ROLE_STATUS } = HTML_VALUES
const { SENDING, ERROR, UNKNOWN, DUPLICATE_WARNING, CHECK_HISTORY, TOO_LONG } =
  MESSAGE_COMPOSER_FEEDBACK_COPY

type MessageComposerFeedbackProps = {
  pending: boolean
  failed: boolean
  tooLong: boolean
  unknown: boolean
  checkingHistory: boolean
  errorId: string
  onCheckHistory: () => Promise<void>
}

export const MessageComposerFeedback = ({
  pending,
  failed,
  tooLong,
  unknown,
  checkingHistory,
  errorId,
  onCheckHistory,
}: MessageComposerFeedbackProps) => {
  let errorCopy: string = ERROR
  if (tooLong) errorCopy = TOO_LONG
  else if (unknown) errorCopy = UNKNOWN
  return (
    <>
      {pending && (
        <p
          className={styles['messageComposerFeedback--pending']}
          role={ROLE_STATUS}
        >
          {SENDING}
        </p>
      )}
      {(failed || tooLong) && (
        <div
          className={styles.messageComposerFeedback}
          id={errorId}
          role={ROLE_ALERT}
        >
          <p>{errorCopy}</p>
          {unknown && (
            <>
              <p>{DUPLICATE_WARNING}</p>
              <button
                type={BUTTON}
                disabled={checkingHistory}
                onClick={onCheckHistory}
              >
                {CHECK_HISTORY}
              </button>
            </>
          )}
        </div>
      )}
    </>
  )
}
