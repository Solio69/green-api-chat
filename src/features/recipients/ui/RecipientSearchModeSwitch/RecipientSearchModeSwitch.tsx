import { RECIPIENT_COPY } from '@/features/recipients/ui/RecipientSearchForm/constants'
import { HTML_VALUES } from '@/lib/ui/constants'
import styles from './RecipientSearchModeSwitch.module.scss'

const { BUTTON, ROLE_GROUP } = HTML_VALUES
const { MODE_LABEL, PHONE_MODE, USERNAME_MODE } = RECIPIENT_COPY
type RecipientSearchModeSwitchProps = {
  isPhone: boolean
  onPhoneSelect: () => void
  onUsernameSelect: () => void
}

export const RecipientSearchModeSwitch = ({
  isPhone,
  onPhoneSelect,
  onUsernameSelect,
}: RecipientSearchModeSwitchProps) => (
  <div
    className={styles.recipientSearchModeSwitch}
    role={ROLE_GROUP}
    aria-label={MODE_LABEL}
  >
    <button
      className={styles.recipientSearchModeSwitch__button}
      type={BUTTON}
      aria-pressed={isPhone}
      onClick={onPhoneSelect}
    >
      {PHONE_MODE}
    </button>
    <button
      className={styles.recipientSearchModeSwitch__button}
      type={BUTTON}
      aria-pressed={!isPhone}
      onClick={onUsernameSelect}
    >
      {USERNAME_MODE}
    </button>
  </div>
)
