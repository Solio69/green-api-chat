# Implementation Plan: единый серверный контекст 037

**Spec**: [spec.md](spec.md). **Дата**: 2026-10-03.
**Согласование и реализация**: пользователь поручил полный последовательный цикл 030–055 с commit/push в `refactor`; поведение и объём 037 уже ограничены spec.

## Summary

Перенести cookie/session runtime в `src/server/session` и получить один серверный reader с результатом `unconfigured | missing | authorized`. Next adapters дают page только чтение, route — чтение и отдельный `clearSession` для своего cookie store. Перевести защищённые route/page и notification adapter на reader; отправка больше не импортирует notifications. HTTP handlers и их ответы не изменять.

## Considered Options

См. [research.md](research.md): общий reader + два узких adapter выбран вместо одного смешанного API или использования notification context как общего. Дополнительные функции оправданы различием прав Server Component и Route Handler.

## Technical Context

Next.js 16.3.7, React 19.3, TypeScript 5.9.3, iron-session 9.0.1, Node 24; Vitest 5 и Playwright 1.63. Нет БД и нового пакета. Сессия — зашифрованная cookie с абсолютным сроком 24 ч. Существующие ответы и UI остаются контрактом.

## Constitution Check до проектирования

C1 PASS: варианты и цена названы, новых продуктовых решений нет. C2 PASS: только чтение и wiring; HTTP guards 038 и транспорт 039 отдельно. C3 PASS: уже согласованная спецификация и отдельное разрешение в переписке; полный комплект/анализ до кода. C4 PASS: исключение для этого чата на commit/push `refactor`. C5 PASS: зависимостей/миграций нет. C6 PASS: секрет не сериализуется, реальных данных нет. C7 PASS: новый серверный контракт через Red → Green → Refactor, регрессия прежних ответов. C8 PASS: два adapter вместо абстракции на перспективу.

## Design

[Модель](data-model.md) и [контракт](contracts/server-session.md). `readRequestSession({store,password,production,now?})` использует текущие `openSession`, `readCredentials`, `getQueryScope`; возвращает только tagged result и не пишет cookie. `readPageSession()` получает `cookies()`/env и вызывает reader; `readRouteSession()` получает те же зависимости и возвращает result с `clearSession`, замыкающимся на store этого запроса. Возвращаемый context не содержит password. Notification adapter отдельно передаёт env password существующему ACK handler. Для unit-тестов reader принимает явный store/password/now; wrapper подтверждают HTTP/E2E.

Операции записи сессии (`openSession` + `saveCredentials` в login) остаются по поведению. Старый `src/lib/auth/session.ts` перемещается в `src/server/session/iron-session.ts`; тип SessionPayload доступен из server/session, но `getQueryScope` принимает минимальную shape через type-only контракт, чтобы не создать runtime цикл. Публичный server entry экспортирует session primitives и readers. Не создаётся клиентский экспорт.

## Project Structure

- `src/lib/auth/session.ts` → `src/server/session/iron-session.ts`: перенос без смены cookie/options.
- `src/server/session/{types.ts,read-request-session.ts,read-page-session.ts,read-route-session.ts,index.ts}`: тип результата, единый reader, Next adapters, публичный вход.
- `src/features/auth/server/get-query-scope.ts`: убрать type dependency от старого session path, сохранить алгоритм.
- `src/app/page.tsx`, `src/app/api/{chats/route.ts,chats/history/route.ts,recipients/search/route.ts,messages/route.ts,auth/login/route.ts}`: подключить reader или перенесённую primitive; статусы/redirect не менять.
- `src/lib/notifications/handle-notification-route.ts`: использовать общий route context и только здесь передавать password ACK handler; `src/lib/notifications/request-context.ts` удалить после перевода consumers.
- `src/app/api/notifications/{receive,ack,settings}/route.ts`: проверить composition и при необходимости только импорты; URL не менять.
- `tests/unit/server-session-context.test.ts`: новый контракт (Red до реализации). `tests/integration/session.spec.ts` — путь перенесённой реализации; existing auth/chats/history/recipient/send/notification tests и E2E — регрессия.
- `specs/037-server-session-context/*`, `docs/refactoring-roadmap.md`: отчёт/статус после проверки.

## Tasks and Dependencies

T001 baseline и полный комплект → T002 read-only analyze → T003 новый unit test и поведенческий Red (`npx vitest run --project node tests/unit/server-session-context.test.ts`) → T004 reader/model и Green → T005 wrappers, перенос session, route/page/notification wiring, Green → T006 refactor и полный набор проверок → T007 review, verification, commit/push и CI. Если Red вызван только отсутствием файла/импорта, тест переписать через существующий публичный seam или подтвердить поведенческое падение после минимального экспортного stub до реализации.

## Verification

Baseline: существующие session/auth/chats/history/recipient/send/notification integration и production E2E. Green: новый unit test проверяет три состояния, срок, scope, изоляцию двух store, отсутствие cookie write/read-page deletion. Regression: `npm run typecheck`, `npm run lint`, `npm run lint:styles`, `npm run format:check`, `npm test`, `npm run test:integration`, `npm run test:query`, `npm run test:e2e`; production build входит в E2E. Проверить import graph: messages не зависит от notifications ради сессии, page не получает delete capability, старого session path нет. `git diff --check` и точный staged diff. После push обе GitHub Actions jobs по head_sha.

## Post-design Constitution Check

C1–C8 PASS: требования полностью сопоставлены T001–T007, новые решения ограничены server context. Инъекция store и now нужна для теста реальной cookie/изоляции; дополнительных механизмов нет. Пользовательских действий не требуется.

## Complexity Tracking

Два adapter минимальны из-за разных прав записи Next; tagged result нужен, чтобы не смешивать неверную конфигурацию и отсутствующую сессию. Нового глобального состояния и кеша нет.
