import { LogoutButton } from '@/features/auth/ui'
import type { AccountProfile } from '@/lib/account/types'
import { ACCOUNT_HEADER_COPY } from './constants'
import { AccountAvatar } from '@/components/AccountAvatar'
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
