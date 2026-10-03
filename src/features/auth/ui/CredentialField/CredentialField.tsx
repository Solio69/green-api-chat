import type { ChangeEvent, Ref } from 'react'
import { TokenVisibilityButton } from '@/features/auth/ui/TokenVisibilityButton'
import { HTML_VALUES } from '@/lib/ui/constants'
import styles from './CredentialField.module.scss'

const {
  INPUT_TEXT,
  INPUT_PASSWORD,
  AUTOCOMPLETE_OFF,
  AUTOCAPITALIZE_NONE,
  ARIA_LIVE_POLITE,
} = HTML_VALUES

type RevealControl = {
  isVisible: boolean
  label: string
  onToggle: () => void
}

type CredentialFieldProps = {
  id: string
  label: string
  value: string
  onValueChange: (value: string) => void
  inputRef: Ref<HTMLInputElement>
  errorId: string
  error: string
  reveal?: RevealControl
}

export const CredentialField = ({
  id,
  label,
  value,
  onValueChange,
  inputRef,
  errorId,
  error,
  reveal,
}: CredentialFieldProps) => {
  const inputType = reveal && !reveal.isVisible ? INPUT_PASSWORD : INPUT_TEXT
  const inputClassName = reveal
    ? `${styles.credentialField__input} ${styles['credentialField__input--withToggle']}`
    : styles.credentialField__input

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) =>
    onValueChange(event.currentTarget.value)

  return (
    <div className={styles.credentialField}>
      <label className={styles.credentialField__label} htmlFor={id}>
        {label}
      </label>
      <div className={styles.credentialField__control}>
        {/* No name: credentials stay out of native HTML form serialization. */}
        <input
          className={inputClassName}
          id={id}
          ref={inputRef}
          type={inputType}
          required
          autoComplete={AUTOCOMPLETE_OFF}
          spellCheck={false}
          autoCapitalize={AUTOCAPITALIZE_NONE}
          value={value}
          onChange={handleInputChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
        {reveal && (
          <TokenVisibilityButton
            isVisible={reveal.isVisible}
            label={reveal.label}
            controls={id}
            onToggle={reveal.onToggle}
          />
        )}
      </div>
      <p
        className={styles.credentialField__error}
        id={errorId}
        aria-live={ARIA_LIVE_POLITE}
      >
        {error}
      </p>
    </div>
  )
}
