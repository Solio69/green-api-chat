import { HTML_VALUES } from '@/lib/ui/constants';
import styles from './SubmitButton.module.scss';

const { SUBMIT } = HTML_VALUES;

type SubmitButtonProps = {
  label: string;
};

export function SubmitButton({ label }: SubmitButtonProps) {
  return (
    <button className={styles.submitButton} type={SUBMIT}>
      {label}
    </button>
  );
}
