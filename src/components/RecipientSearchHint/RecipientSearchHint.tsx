import styles from './RecipientSearchHint.module.scss'

type RecipientSearchHintProps = {
  text: string
  isHidden: boolean
}

export const RecipientSearchHint = ({
  text,
  isHidden,
}: RecipientSearchHintProps) => (
  <p className={styles.recipientSearchHint} aria-hidden={isHidden}>
    {text}
  </p>
)
