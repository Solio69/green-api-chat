import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: false,
  agentRules: false,
  outputFileTracingRoot: process.cwd(),
}
export default config
