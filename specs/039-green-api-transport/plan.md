# Implementation Plan: транспорт GREEN-API 039

**Spec**: [spec.md](spec.md). **Дата**: 2026-10-03. **Разрешение**: пользователь поручил полный цикл 030–055, commit/push `refactor`; смена контрактов не входит в задачу.

## Summary

Вынести сборку фиксированного URL, кодирование credentials, `cache:no-store`, `redirect:error` и вызов внедряемого fetch в серверный `src/lib/green-api/transport.ts`. Адаптеры передают метод, необязательные JSON body/suffix и уже созданный signal; транспорт возвращает сырой Response. Повторы, deadline, abort-политика и классификация остаются в существующих операциях.

## Варианты и риски

[Research и матрица](research.md) сравнивают малый транспорт, универсальный client и только URL builder. Выбран малый транспорт, так как универсальная политика может случайно повторить SendMessage или считать его отменённым после dispatch.

## Контекст и C1–C8 до проектирования

Next.js 16.3.7, TypeScript 5.9.3, стандартный fetch/AbortSignal, внедряемые fetcher/waitForRetry. C1 PASS: варианты и цена представлены. C2 PASS: только 039/R05, уведомления state model 040 отдельно. C3 PASS: spec/полный комплект/read-only анализ перед кодом; разрешение уже получено. C4 PASS: пользовательское исключение commit/push. C5 PASS: пакеты/БД не нужны. C6 PASS: fake credentials. C7 PASS: baseline методов и unit Red → Green нового transport API. C8 PASS: общий слой ограничен совпадающими деталями.

## Дизайн

[Модель](data-model.md), [контракт](contracts/transport.md), [quickstart](quickstart.md). `fetchGreenApi({credentials,methodName,method,suffix?,jsonBody?,signal,fetcher})` собирает URL и RequestInit. `jsonBody` задаёт JSON Content-Type и сериализованное тело только если передан; методы/суффиксы задают адаптеры. Signal обязателен и не комбинируется внутри. Контракт `Promise<Response>`: сетевые ошибки не перехватываются; операция отображает их в свой результат. `fetcher` сохраняет существующую dependency injection. Не добавлять логов URL/ответов, общих retry и типизированных продуктовых ошибок.

## Целевые файлы

- Новый `src/lib/green-api/transport.ts`.
- Перевод `get-state.ts`, `get-account-settings.ts`, `get-chats.ts`, `get-chat-history.ts`, `check-account.ts`, `send-message.ts`, `notification-request.ts`; методы settings/receive/delete через существующий notificationRequest.
- `tests/unit/green-api-transport.test.ts` для URL/options, JSON/GET/DELETE, raw response, network error, no retry/implicit abort; существующие `tests/integration/{get-state,get-account-settings,chats-api,history-api,check-account,send-message,notification-provider}.spec.ts` — regression contract.
- `specs/039-green-api-transport/*`, `docs/refactoring-roadmap.md` после проверки.

## Порядок

T001 исходная матрица и baseline → T002 read-only analyze → T003 новый unit API и поведенческий Red на минимальном stub → T004 транспорт Green → T005 перенос GET и history/check-account с целевыми regression → T006 SendMessage и notificationRequest с проверкой запрета повторов/политики abort → T007 Refactor, полный набор и повторный analyze → T008 review/commit/push/CI/docs. Не менять исходные лимиты или выбор кода ошибок.

## Проверки

`npx vitest run --project node tests/unit/green-api-transport.test.ts`; `npm run test:integration`, `npm run typecheck`, `npm run lint`, `npm run lint:styles`, `npm run format:check`, `npm test`, `npm run test:query`, `npm run test:e2e`, `git diff --check`; inspect count/order provider requests, URL-safe token, send no-retry/unknown, notification Retry-After/ACK, client/server graph и обе CI jobs на head SHA.

## Post-design C1–C8

PASS при указанной границе: transport возвращает сырой Response, не скрывает операционные политики и не расширяет интерфейс приложения. Никаких действий пользователя не требуется.
