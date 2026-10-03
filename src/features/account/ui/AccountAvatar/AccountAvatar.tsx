'use client'

import Image from 'next/image'
import { useState } from 'react'
import { EMPTY_STRING } from '@/lib/ui/constants'
import { ACCOUNT_AVATAR_HTML } from './constants'
import styles from './AccountAvatar.module.scss'

const { REFERRER_POLICY } = ACCOUNT_AVATAR_HTML

type AccountAvatarProps = {
  avatarUrl: string
}

export const AccountAvatar = ({ avatarUrl }: AccountAvatarProps) => {
  const [failedSource, setFailedSource] = useState(EMPTY_STRING)
  const hasImage = Boolean(avatarUrl) && failedSource !== avatarUrl
  const handleAvatarLoadError = () => setFailedSource(avatarUrl)

  return (
    <div className={styles.accountAvatar}>
      {hasImage ? (
        <Image
          className={styles.accountAvatar__image}
          src={avatarUrl}
          alt={EMPTY_STRING}
          fill
          unoptimized
          referrerPolicy={REFERRER_POLICY}
          onError={handleAvatarLoadError}
        />
      ) : (
        <svg
          className={styles.accountAvatar__placeholder}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
        </svg>
      )}
    </div>
  )
}
