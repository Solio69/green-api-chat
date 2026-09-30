import { HTML_VALUES } from '@/lib/ui/constants';
import styles from './TokenVisibilityButton.module.scss';

const { BUTTON } = HTML_VALUES;

type TokenVisibilityButtonProps = {
  isVisible: boolean;
  label: string;
  controls: string;
  onToggle: () => void;
};

export function TokenVisibilityButton({
  isVisible,
  label,
  controls,
  onToggle,
}: TokenVisibilityButtonProps) {
  return (
    <button
      className={styles.tokenVisibilityButton}
      type={BUTTON}
      aria-label={label}
      title={label}
      aria-controls={controls}
      onClick={onToggle}
    >
      <svg
        className={styles.tokenVisibilityButton__icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
        {isVisible && <path d="m3 3 18 18" />}
      </svg>
    </button>
  );
}
