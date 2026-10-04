import styles from './ConversationBackground.module.scss'

export const ConversationBackground = () => (
  <svg
    className={styles.conversationBackground}
    aria-hidden
    focusable="false"
    width="100%"
    height="100%"
  >
    <defs>
      <pattern
        id="conversation-motif"
        width="150"
        height="140"
        patternUnits="userSpaceOnUse"
      >
        <g fill="none" stroke="currentColor" strokeWidth="1.25">
          <path d="M20 18h34v25H31l-11 8V18Z" transform="rotate(-18 37 35)" />
          <path d="M118 83a16 16 0 0 1 0 32h-9l-9 7v-14a16 16 0 0 1 18-25Z" />
          <path d="M36 27h-6v10h8v-5h-4" transform="rotate(-18 37 35)" />
          <path d="M28 112h26v20H36l-8 6v-26Z" />
          <path d="M72 16h26v20H80l-8 6V16Z" transform="rotate(18 85 30)" />
          <path d="M108 16h24v18h-7l-7 6v-6h-10V16Z" />
          <path d="M66 71h28v21H75l-9 7V71Z" transform="rotate(12 80 85)" />
          <path d="M76 77h-5v10h7v-5h-3" transform="rotate(12 80 85)" />
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#conversation-motif)" />
  </svg>
)
