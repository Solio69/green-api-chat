import { expect, test } from './owner-fixture'
import {
  CONVERSATION_FIXTURES,
  CREDENTIALS,
  LOGIN_CONTRACT,
  RECIPIENT_CONTRACT,
  ROUTES,
  TEST_UI,
  THEME_BROWSER,
} from '../constants'

const { ID, TOKEN } = CREDENTIALS
const { ID_LABEL, TOKEN_LABEL, SUBMIT } = LOGIN_CONTRACT
const { LOGIN, HOME, RECIPIENT_SEARCH_API } = ROUTES
const {
  SEARCH_HEADING,
  PHONE_MODE,
  USERNAME_MODE,
  USERNAME_LABEL,
  USERNAME_HINT,
  PHONE_HINT,
} = RECIPIENT_CONTRACT
const {
  textScales,
  searchLayoutWidths,
  searchLayoutViewportHeight,
  wideViewport,
} = CONVERSATION_FIXTURES
const {
  ROLE_BUTTON,
  ROLE_HEADING,
  SECTION_SELECTOR,
  MAIN_SELECTOR,
  EVENT_REQUEST,
} = TEST_UI
const { COLOR_SCHEME_LIGHT, COLOR_SCHEME_DARK } = THEME_BROWSER

test('search layout keeps mode height and scales the workspace with the viewport', async ({
  page,
}, testInfo) => {
  await page.goto(LOGIN)
  await page.getByLabel(ID_LABEL).fill(ID)
  await page.getByLabel(TOKEN_LABEL).fill(TOKEN)
  await page.getByRole(ROLE_BUTTON, { name: SUBMIT, exact: true }).click()
  await expect(page).toHaveURL(HOME)
  const search = page.locator(SECTION_SELECTOR).filter({
    has: page.getByRole(ROLE_HEADING, { name: SEARCH_HEADING, exact: true }),
  })
  let requests = 0
  page.on(EVENT_REQUEST, (request) => {
    if (new URL(request.url()).pathname === RECIPIENT_SEARCH_API) requests += 1
  })
  for (const scale of textScales) {
    const style = await page.addStyleTag({
      content: `html { font-size: ${scale}% }`,
    })
    for (const colorScheme of [COLOR_SCHEME_LIGHT, COLOR_SCHEME_DARK]) {
      await page.emulateMedia({ colorScheme })
      for (const width of searchLayoutWidths) {
        await page.setViewportSize({
          width,
          height: searchLayoutViewportHeight,
        })
        await page
          .getByRole(ROLE_BUTTON, { name: PHONE_MODE, exact: true })
          .click()
        const phoneBox = await search.boundingBox()
        await page
          .getByRole(ROLE_BUTTON, { name: USERNAME_MODE, exact: true })
          .click()
        await expect(
          page.getByText(USERNAME_HINT, { exact: true }),
        ).toBeVisible()
        await expect(
          page.getByText(PHONE_HINT, {
            exact: true,
          }),
        ).toBeHidden()
        await expect(
          page.getByLabel(USERNAME_LABEL, { exact: true }),
        ).toHaveAccessibleDescription(USERNAME_HINT)
        const usernameBox = await search.boundingBox()
        expect(
          Math.abs((phoneBox?.height ?? 0) - (usernameBox?.height ?? 0)),
        ).toBeLessThanOrEqual(1)
        await page
          .getByRole(ROLE_BUTTON, { name: PHONE_MODE, exact: true })
          .click()
        const restoredBox = await search.boundingBox()
        expect(restoredBox?.height).toBe(phoneBox?.height)
        const geometry = await page.evaluate((selector) => {
          const main = document.querySelector(selector)?.getBoundingClientRect()
          const body = getComputedStyle(document.body)
          return {
            width: main?.width ?? 0,
            left: main?.left ?? 0,
            gutter: parseFloat(body.paddingLeft),
            overflows: document.documentElement.scrollWidth > innerWidth,
            viewport: innerWidth,
          }
        }, MAIN_SELECTOR)
        expect(geometry.overflows).toBe(false)
        expect(Math.abs(geometry.left - geometry.gutter)).toBeLessThanOrEqual(1)
        expect(
          Math.abs(geometry.width - (geometry.viewport - 2 * geometry.gutter)),
        ).toBeLessThanOrEqual(1)
      }
    }
    await style.evaluate((element) => element.parentNode?.removeChild(element))
  }
  expect(requests).toBe(0)
  await page.setViewportSize(wideViewport)
  await page.emulateMedia({ colorScheme: COLOR_SCHEME_LIGHT })
  await page
    .getByRole(ROLE_BUTTON, { name: USERNAME_MODE, exact: true })
    .click()
  await page.screenshot({
    path: testInfo.outputPath('workspace-wide.png'),
    fullPage: true,
  })
})
