import { afterEach } from 'vitest'
import { restoreTestTimers } from './timers'

afterEach(restoreTestTimers)
