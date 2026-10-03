'use client'

import { useId } from 'react'
import { useLoginForm } from './use-login-form'
import { CredentialField } from '@/features/auth/ui/CredentialField'
import { EMPTY_STRING, HTML_VALUES } from '@/lib/ui/constants'
import { LOGIN_COPY, LOGIN_FIELD_ID_SUFFIX, LOGIN_LINKS } from './constants'
import { SubmitButton } from '@/components/SubmitButton'
import styles from './LoginForm.module.scss'

const {
  REQUIRED_HINT,
  ID_LABEL,
  TOKEN_LABEL,
  SHOW_TOKEN,
  HIDE_TOKEN,
  SUBMIT,
  SUBMITTING,
  NO_SCRIPT,
  CABINET_LABEL,
} = LOGIN_COPY
const { ROLE_ALERT, ROLE_STATUS, LINK_TARGET_NEW_TAB, LINK_REL_EXTERNAL } =
  HTML_VALUES
const { CABINET } = LOGIN_LINKS
const { INSTANCE, TOKEN, INSTANCE_ERROR, TOKEN_ERROR } = LOGIN_FIELD_ID_SUFFIX

export const LoginForm = () => {
  const formId = useId()
  const idInputId = formId + INSTANCE
  const tokenInputId = formId + TOKEN
  const idErrorId = formId + INSTANCE_ERROR
  const tokenErrorId = formId + TOKEN_ERROR
  const {
    values,
    idInputRef,
    tokenInputRef,
    isInteractive,
    isSubmitting,
    isTokenVisible,
    idError,
    tokenError,
    generalError,
    handleIdInstanceChange,
    handleApiTokenInstanceChange,
    handleTokenVisibilityToggle,
    handleSubmit,
  } = useLoginForm()
  const tokenToggleLabel = isTokenVisible ? HIDE_TOKEN : SHOW_TOKEN

  return (
    <form className={styles.form} noValidate onSubmit={handleSubmit}>
      <fieldset
        className={styles.form__fields}
        disabled={!isInteractive || isSubmitting}
      >
        <p className={styles.form__hint}>{REQUIRED_HINT}</p>
        <CredentialField
          id={idInputId}
          label={ID_LABEL}
          value={values.idInstance}
          onValueChange={handleIdInstanceChange}
          inputRef={idInputRef}
          errorId={idErrorId}
          error={idError}
        />
        <CredentialField
          id={tokenInputId}
          label={TOKEN_LABEL}
          value={values.apiTokenInstance}
          onValueChange={handleApiTokenInstanceChange}
          inputRef={tokenInputRef}
          errorId={tokenErrorId}
          error={tokenError}
          reveal={{
            isVisible: isTokenVisible,
            label: tokenToggleLabel,
            onToggle: handleTokenVisibilityToggle,
          }}
        />
        {generalError && (
          <p className={styles.form__error} role={ROLE_ALERT}>
            {generalError}
          </p>
        )}
        <SubmitButton
          label={isSubmitting ? SUBMITTING : SUBMIT}
          isLoading={isSubmitting}
        />
      </fieldset>
      <p className={styles.form__status} role={ROLE_STATUS}>
        {isSubmitting ? SUBMITTING : EMPTY_STRING}
      </p>
      <noscript>
        <p className={styles.form__error}>{NO_SCRIPT}</p>
      </noscript>
      <a
        className={styles.form__link}
        href={CABINET}
        target={LINK_TARGET_NEW_TAB}
        rel={LINK_REL_EXTERNAL}
      >
        {CABINET_LABEL}
      </a>
    </form>
  )
}
