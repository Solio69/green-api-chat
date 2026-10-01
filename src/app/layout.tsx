import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { HTML_VALUES } from '@/lib/ui/constants'
import './globals.scss'

const { LANGUAGE_RU } = HTML_VALUES

export const metadata: Metadata = {
  title: 'GREEN-API Chat',
  description: 'Текстовый чат в Telegram через GREEN-API.',
}

type RootLayoutProps = Readonly<{
  children: ReactNode
}>

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang={LANGUAGE_RU}>
      <body>{children}</body>
    </html>
  )
}
