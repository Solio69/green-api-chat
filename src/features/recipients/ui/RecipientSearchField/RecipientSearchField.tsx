import type { ChangeEvent, Ref } from 'react'
import { HTML_VALUES } from '@/shared/kernel/ui/constants'
import styles from './RecipientSearchField.module.scss'

const {
  INPUT_TEXT,
  INPUT_MODE_TEL,
  AUTOCOMPLETE_OFF,
  AUTOCAPITALIZE_NONE,
  ARIA_LIVE_POLITE,
} = HTML_VALUES

type RecipientSearchFieldProps = {
  id: string
  errorId: string
  hintId: string
  label: string
  alternateLabel: string
  value: string
  error: string
  isPhone: boolean
  inputRef: Ref<HTMLInputElement>
  onValueChange: (value: string) => void
}

export const RecipientSearchField = ({
  id,
  errorId,
  hintId,
  label,
  alternateLabel,
  value,
  error,
  isPhone,
  inputRef,
  onValueChange,
}: RecipientSearchFieldProps) => {
  const handleValueChange = (event: ChangeEvent<HTMLInputElement>) =>
    onValueChange(event.currentTarget.value)

  return (
    <div className={styles.recipientSearchField}>
      <div className={styles.recipientSearchField__labels}>
        <label className={styles.recipientSearchField__label} htmlFor={id}>
          {label}
        </label>
        <span className={styles.recipientSearchField__label} aria-hidden="true">
          {alternateLabel}
        </span>
      </div>
      <input
        className={styles.recipientSearchField__input}
        id={id}
        ref={inputRef}
        type={INPUT_TEXT}
        inputMode={isPhone ? INPUT_MODE_TEL : INPUT_TEXT}
        autoComplete={AUTOCOMPLETE_OFF}
        autoCapitalize={AUTOCAPITALIZE_NONE}
        spellCheck={false}
        required
        value={value}
        onChange={handleValueChange}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${hintId} ${errorId}` : hintId}
      />
      <p
        className={styles.recipientSearchField__error}
        id={errorId}
        aria-live={ARIA_LIVE_POLITE}
      >
        {error}
      </p>
    </div>
  )
}
