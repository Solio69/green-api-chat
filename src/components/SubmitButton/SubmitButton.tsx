import { HTML_VALUES } from '@/lib/ui/constants'
import styles from './SubmitButton.module.scss'

const { SUBMIT } = HTML_VALUES

type SubmitButtonProps = {
  label: string
  isLoading?: boolean
}

export const SubmitButton = ({
  label,
  isLoading = false,
}: SubmitButtonProps) => (
  <button className={styles.submitButton} type={SUBMIT} aria-busy={isLoading}>
    {isLoading && <span className={styles.submitButton__loader} aria-hidden />}
    {label}
  </button>
)
