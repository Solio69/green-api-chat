import { expect, test } from './owner-fixture'
import { ACCOUNT_SCENARIOS } from '../account.constants'
import { CREDENTIALS, LOGIN_API_CONTRACT } from '../auth.constants'
import { ROUTES } from '../shared.constants'

const { LOGIN_API } = ROUTES
const { OK_STATUS } = LOGIN_API_CONTRACT
const { TOKEN } = CREDENTIALS
const { id } = ACCOUNT_SCENARIOS.username

for (const order of ['first', 'after another scenario']) {
  test(`fake provider resets account request counters ${order}`, async ({
    request,
  }) => {
    const response = await request.post(LOGIN_API, {
      data: { idInstance: id, apiTokenInstance: TOKEN },
    })
    expect(response.status()).toBe(OK_STATUS)
  })
}
