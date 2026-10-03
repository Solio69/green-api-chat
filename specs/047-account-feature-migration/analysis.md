# Анализ 047 до реализации

Дата: 2026-10-04. Проверены spec/checklist/research/plan/data-model/contract/quickstart/tasks, карта 035, фактические model/provider/auth/UI/page и текущие integration/E2E tests. Первый read-only проход: 20 путей, SHA-256 `67256e0d46a84829cb1f56332cf0c409b4d27476d9f96a56e571553e1a30364a`, unchanged=true. Найден MEDIUM-01: spec требовал Vitest нормализации, а plan/tasks предусматривали только существующий Playwright integration и новые RTL. Отдельно исправлены plan/tasks/quickstart: добавлен `tests/unit/account-profile.test.ts` и компонентный запуск. Повторный read-only проход: 20 путей, SHA-256 `881cd936adbc321a449185c427fef2ec93f567c2649a89b98c58591ffdd16381`, unchanged=true.

## Findings и границы

Открытых CRITICAL/HIGH/MEDIUM/LOW: 0. Нормализованная модель содержит одну подпись `username || phone`, а не одновременно имя и номер; spec уточнена по текущему коду. `getAccountSettings` остаётся в server-owned provider adapter, `account/server` станет его публичным входом для app/auth. Transport, retry, классификация состояния и `resolveHome` не переписываются. Карта 035 назначает три model и восемь UI файлов на account; их перенос покрыт планом. Backend DTO/credentials не передаются в UI. Новые файлы ещё не существуют по плану, это не finding.

## Покрытие требований

| Требование | Задачи |
| --- | --- |
| FR-001 | T001, T004–T006 |
| FR-002 | T001, T003–T006 |
| FR-003 | T001, T004–T006 |
| FR-004 | T001, T003–T006 |
| FR-005 | T002, T004–T006 |
| SC-001 | T004–T007 |
| SC-002 | T003–T007 |
| SC-003 | T003–T007 |

5 FR, 3 SC, 7 задач; покрытие 8/8, задач без требования 0, существенных неоднозначностей и дублирования 0. T001 — baseline, T002 — обязательный анализ, T007 — завершение процесса; они обеспечивают приёмку без отдельного продуктового требования.

## C1–C8

- C1 PASS: решение, варианты, риски описаны, нового продукта нет.
- C2 PASS: один account feature, auth/application и транспорт остаются владельцами своих решений.
- C3/C4 PASS: пользователь ранее поручил полный цикл 030–055 и commit/push `refactor` этому чату; повторное разрешение не требуется.
- C5/C6 PASS: без новых пакетов, БД, реальных credentials и внешних операций.
- C7 PASS: чистый перенос опирается на baseline; Vitest unit, RTL, integration, Query и E2E в плане. Бизнес-логика и серверный контракт сохраняются, искусственный Red не нужен. Если возникнет новый контракт, до кода необходим поведенческий Red.
- C8 PASS: нет нового store, transport или дублирующей абстракции.

Baseline, реализация, тесты, post-analysis и CI пока NotRun; их фактические результаты будут отдельно в verification.md. Анализ закончен read-only, этот файл записан отдельным действием после прохода.

## Read-only анализ после реализации

Проверены 35 путей комплекта 047, карты 035, account/model/server/ui, app/auth/provider и тестов; SHA-256 до/после `cd42db5af78023704a5bc4174bc598b0602c74405fe587a3b59e77e7534e54c1`, unchanged=true. На этапе финального оформления исправлены только документальные команды quickstart под реальные Playwright config/project и формулировка уровня серверных проверок в spec. Старых runtime/test импортов `lib/account` и `components/Account*` нет; account model/ui не импортируют server runtime даже через type-only alias. Граф 28 client roots, 245 source TS/TSX, server runtime reachable=false. C1–C8 PASS, покрытие 8/8, открытых findings 0. Итоги выполненных тестов приведены в verification.md.
