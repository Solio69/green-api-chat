import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.scss';

export const metadata: Metadata = {
  title: 'GREEN-API Chat',
  description: 'Текстовый чат в Telegram через GREEN-API.',
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
