import type { ReactNode } from 'react'

const FixtureLayout = ({ children }: { children: ReactNode }) => (
  <html lang="ru">
    <body>{children}</body>
  </html>
)
export default FixtureLayout
