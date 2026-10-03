'use client'

import { useId } from 'react'
import { useRecipientSearch } from './use-recipient-search'
import { RecipientSearchField } from '@/features/recipients/ui/RecipientSearchField'
import { RecipientSearchHint } from '@/features/recipients/ui/RecipientSearchHint'
import { RecipientSearchModeSwitch } from '@/features/recipients/ui/RecipientSearchModeSwitch'
import { RecipientSearchResult } from '@/features/recipients/ui/RecipientSearchResult'
import { EMPTY_STRING, HTML_VALUES } from '@/lib/ui/constants'
import { RECIPIENT_COPY, RECIPIENT_FIELD_ID_SUFFIX } from './constants'
import { SubmitButton } from '@/components/SubmitButton'
import styles from './RecipientSearchForm.module.scss'

const {
  HEADING,
  PHONE_LABEL,
  USERNAME_LABEL,
  PHONE_HINT,
  USERNAME_HINT,
  SUBMIT,
  SUBMITTING,
  NO_SCRIPT,
} = RECIPIENT_COPY
const { FIELD, ERROR, HINT } = RECIPIENT_FIELD_ID_SUFFIX
const { ROLE_STATUS } = HTML_VALUES

export const RecipientSearchForm = () => {
  const formId = useId()
  const inputId = formId + FIELD
  const hintId = formId + HINT
  const errorId = formId + ERROR
  const {
    inputRef,
    isInteractive,
    isPhone,
    fieldLabel,
    value,
    fieldError,
    generalError,
    isSubmitting,
    result,
    handlePhoneModeSelect,
    handleUsernameModeSelect,
    handleValueChange,
    handleSubmit,
    handleWrite,
  } = useRecipientSearch()
  return (
    <section className={styles.recipientSearchForm}>
      <h1 className={styles.recipientSearchForm__heading}>{HEADING}</h1>
      <form noValidate onSubmit={handleSubmit}>
        <fieldset
          className={styles.recipientSearchForm__fields}
          disabled={!isInteractive || isSubmitting}
        >
          <RecipientSearchModeSwitch
            isPhone={isPhone}
            onPhoneSelect={handlePhoneModeSelect}
            onUsernameSelect={handleUsernameModeSelect}
          />
          <div className={styles.recipientSearchForm__row}>
            <RecipientSearchField
              id={inputId}
              errorId={errorId}
              hintId={hintId}
              label={fieldLabel}
              alternateLabel={isPhone ? USERNAME_LABEL : PHONE_LABEL}
              value={value}
              error={fieldError}
              isPhone={isPhone}
              inputRef={inputRef}
              onValueChange={handleValueChange}
            />
            <div className={styles.recipientSearchForm__submit}>
              <SubmitButton
                label={isSubmitting ? SUBMITTING : SUBMIT}
                isLoading={isSubmitting}
              />
            </div>
          </div>
          <div className={styles.recipientSearchForm__hints} id={hintId}>
            <RecipientSearchHint text={PHONE_HINT} isHidden={!isPhone} />
            <RecipientSearchHint text={USERNAME_HINT} isHidden={isPhone} />
          </div>
        </fieldset>
        <p className={styles.recipientSearchForm__pending} role={ROLE_STATUS}>
          {isSubmitting ? SUBMITTING : EMPTY_STRING}
        </p>
      </form>
      <noscript>
        <p className={styles.recipientSearchForm__error}>{NO_SCRIPT}</p>
      </noscript>
      <RecipientSearchResult
        result={result}
        error={generalError}
        isPhone={isPhone}
        onUsernameSelect={handleUsernameModeSelect}
        onWrite={handleWrite}
      />
    </section>
  )
}
