# Карта пилотного переноса 029

Исходный реестр: [028](../028-refactor-test-baseline/test-inventory.json). Оба recipient-label сценария успешно выполнены сначала Playwright, затем Vitest с теми же данными и assertions. После подтверждения прежний файл удалён. DOM-пилот прошёл, полный browser contract сохранён и прошёл отдельную production-регрессию (1/1).

| Исходный сценарий                                                                              | Назначение                                                     | Решение                                                                      |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| B028-I-0240: recipient label: displays the normalized submitted username                       | tests/unit/recipient-label.test.ts                             | Сохранить @demo_user и parsed { username: '@demo_user' }                     |
| B028-I-0241: recipient label: displays the submitted phone without a Telegram suffix           | tests/unit/recipient-label.test.ts                             | Сохранить 12025550123 и parsed { phoneNumber: 12025550123 }                  |
| B028-E-0100: search UI: result label and functional write button preserve the request contract | tests/component/recipient-search-result.test.tsx + прежний E2E | Изолировать отображение/действие в DOM; browser contract полностью сохранить |

Постоянные ID сверены с baseline до реализации. Никакие исходные сценарии за пределами этого пилота не удаляются. Инфраструктурные проверки окружения — новые проверки инструмента, они не увеличивают заявленное покрытие поведения приложения.
