'use client'

import { useMessageComposer } from './use-message-composer'
import { MessageComposerFeedback } from '@/features/conversation/ui/MessageComposerFeedback'
import { MessageSendButton } from '@/features/conversation/ui/MessageSendButton'
import { MESSAGE_COMPOSER_COPY } from './constants'
import styles from './MessageComposer.module.scss'

const { LABEL, SEND, HINT, REPEAT } = MESSAGE_COMPOSER_COPY

export const MessageComposer = () => {
  const {
    target,
    editor,
    inputId,
    hintId,
    errorId,
    fieldPending,
    tooLong,
    failed,
    unknown,
    blocked,
    isFetching,
    handleChange,
    handleSubmit,
    handleKeyDown,
    handleCompositionStart,
    handleCompositionEnd,
    handleCheckHistory,
  } = useMessageComposer()
  if (!target) return null
  return (
    <div className={styles.messageComposer}>
      <form className={styles.messageComposer__form} onSubmit={handleSubmit}>
        <label className={styles.messageComposer__label} htmlFor={inputId}>
          {LABEL}
        </label>
        <textarea
          id={inputId}
          className={styles.messageComposer__input}
          rows={1}
          placeholder={LABEL}
          value={editor.text}
          readOnly={fieldPending}
          aria-busy={fieldPending}
          aria-invalid={tooLong || undefined}
          aria-describedby={failed || tooLong ? `${hintId} ${errorId}` : hintId}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
        />
        <MessageSendButton
          disabled={blocked}
          pending={fieldPending}
          label={unknown && editor.historyChecked ? REPEAT : SEND}
        />
      </form>
      <p className={styles.messageComposer__hint} id={hintId}>
        {HINT}
      </p>
      <MessageComposerFeedback
        pending={fieldPending}
        failed={failed}
        tooLong={tooLong}
        unknown={unknown}
        checkingHistory={isFetching}
        errorId={errorId}
        onCheckHistory={handleCheckHistory}
      />
    </div>
  )
}
