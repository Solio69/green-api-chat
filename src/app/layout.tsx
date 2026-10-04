import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { THEME_BOOTSTRAP_SCRIPT } from '@/features/theme/model'
import { HTML_VALUES } from '@/shared/kernel/ui/constants'
import './globals.scss'

const { LANGUAGE_RU } = HTML_VALUES

export const metadata: Metadata = {
  title: 'GREEN-API Chat',
  description: 'Текстовый чат в Telegram через GREEN-API.',
}

type RootLayoutProps = Readonly<{
  children: ReactNode
}>

const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang={LANGUAGE_RU} suppressHydrationWarning>
    <head>
      <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
    </head>
    <body>{children}</body>
  </html>
)

export default RootLayout
