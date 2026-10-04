import type { AccountProfile } from '@/features/account/model'
import { AccountAvatar } from '@/features/account/ui/AccountAvatar'
import { LogoutButton } from '@/features/auth/ui'
import { ACCOUNT_HEADER_COPY } from './constants'
import styles from './AccountHeader.module.scss'

const { REGION_LABEL, DEFAULT_LABEL, CONNECTED } = ACCOUNT_HEADER_COPY

type AccountHeaderProps = {
  account: AccountProfile
  logoutLabel: string
}

export const AccountHeader = ({ account, logoutLabel }: AccountHeaderProps) => (
  <section className={styles.accountHeader} aria-label={REGION_LABEL}>
    <AccountAvatar avatarUrl={account.avatarUrl} />
    <div className={styles.accountHeader__details}>
      <p className={styles.accountHeader__label}>
        {account.label || DEFAULT_LABEL}
      </p>
      <p className={styles.accountHeader__connection}>
        <span className={styles.accountHeader__indicator} aria-hidden="true" />
        <span>{CONNECTED}</span>
      </p>
    </div>
    <LogoutButton label={logoutLabel} />
  </section>
)
