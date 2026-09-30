'use client';

import {
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type SubmitEvent,
} from 'react';
import { CredentialField } from '@/components/CredentialField';
import { SubmitButton } from '@/components/SubmitButton';
import { EMPTY_STRING, HTML_VALUES } from '@/lib/ui/constants';
import { LOGIN_COPY, LOGIN_LINKS } from './constants';
import styles from './LoginForm.module.scss';

const {
  REQUIRED_HINT,
  ID_LABEL,
  TOKEN_LABEL,
  ID_REQUIRED,
  TOKEN_REQUIRED,
  SHOW_TOKEN,
  HIDE_TOKEN,
  SUBMIT,
  HELP_QUESTION,
  CABINET_LABEL,
  NEW_TAB,
  NO_SCRIPT,
} = LOGIN_COPY;
const { CABINET } = LOGIN_LINKS;
const { LINK_TARGET_NEW_TAB, LINK_REL_EXTERNAL } = HTML_VALUES;

// SSR and the hydration snapshot keep native submission disabled until React is ready.
const subscribe = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function LoginForm() {
  const formId = useId();
  const idInputId = `${formId}-instance`;
  const tokenInputId = `${formId}-token`;
  const idErrorId = `${formId}-instance-error`;
  const tokenErrorId = `${formId}-token-error`;
  const idInputRef = useRef<HTMLInputElement>(null);
  const tokenInputRef = useRef<HTMLInputElement>(null);
  const isInteractive = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  const [values, setValues] = useState({
    idInstance: EMPTY_STRING,
    apiTokenInstance: EMPTY_STRING,
  });
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isTokenVisible, setIsTokenVisible] = useState(false);
  const { idInstance, apiTokenInstance } = values;
  const isIdMissing = idInstance.trim().length === 0;
  const isTokenMissing = apiTokenInstance.trim().length === 0;
  const idError = hasSubmitted && isIdMissing ? ID_REQUIRED : EMPTY_STRING;
  const tokenError =
    hasSubmitted && isTokenMissing ? TOKEN_REQUIRED : EMPTY_STRING;
  const tokenToggleLabel = isTokenVisible ? HIDE_TOKEN : SHOW_TOKEN;

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasSubmitted(true);
    if (isIdMissing) idInputRef.current?.focus();
    else if (isTokenMissing) tokenInputRef.current?.focus();
  }

  return (
    <form className={styles.form} noValidate onSubmit={handleSubmit}>
      <fieldset className={styles.form__fields} disabled={!isInteractive}>
        <p className={styles.form__hint}>{REQUIRED_HINT}</p>
        <CredentialField
          id={idInputId}
          label={ID_LABEL}
          value={idInstance}
          onValueChange={(value) =>
            setValues((current) => ({ ...current, idInstance: value }))
          }
          inputRef={idInputRef}
          errorId={idErrorId}
          error={idError}
        />
        <CredentialField
          id={tokenInputId}
          label={TOKEN_LABEL}
          value={apiTokenInstance}
          onValueChange={(value) =>
            setValues((current) => ({ ...current, apiTokenInstance: value }))
          }
          inputRef={tokenInputRef}
          errorId={tokenErrorId}
          error={tokenError}
          reveal={{
            isVisible: isTokenVisible,
            label: tokenToggleLabel,
            onToggle: () => setIsTokenVisible((visible) => !visible),
          }}
        />
        <SubmitButton label={SUBMIT} />
      </fieldset>
      <noscript>
        <p className={styles.form__error}>{NO_SCRIPT}</p>
      </noscript>
      <p className={styles.form__help}>
        <span className={styles.form__question}>{HELP_QUESTION}</span>
        <a
          className={styles.form__link}
          href={CABINET}
          target={LINK_TARGET_NEW_TAB}
          rel={LINK_REL_EXTERNAL}
        >
          {CABINET_LABEL}
        </a>
        <span className={styles.form__note}>{NEW_TAB}</span>
      </p>
    </form>
  );
}
