# Implementation Plan: модуль профиля 047

**Spec**: [spec.md](spec.md). Дата: 2026-10-04. Полный цикл и commit/push `refactor` уже поручены.

## Summary

Перенести модель профиля и два компонента в отдельные `features/account/model` и `features/account/ui`, добавить `features/account/server` как вход к существующему provider adapter. Сохранить нормализацию, решение `resolveHome`, серверную загрузку и прежний DOM/SCSS/темы. UI получает только нормализованный `AccountProfile`.

## Основание и варианты

[Research](research.md) сравнивает сохранение структуры, узкий перенос и переписывание адаптера. Выбран узкий перенос. Provider adapter остаётся частью общего GREEN-API слоя: перенос самого сетевого цикла не нужен для разделения account UI и увеличил бы риск авторизации. Серверный вход не является новым сетевым уровнем, он обозначает разрешённый импорт для app/auth.

## Контекст и C1–C8

Next.js/React/TypeScript, SCSS Modules, существующие Vitest/RTL/Playwright, фиктивные credentials. C1 PASS: нет нового продуктового решения; выбор с рисками описан. C2 PASS: только account model/UI/server entry, `resolveHome` и транспорт сохраняются. C3/C4 PASS: user дал разрешение на полный цикл и commit/push. C5/C6 PASS: нет установки/БД/секретов. C7 PASS: чистый перенос после baseline, новые component tests дополняют regression; изменённой бизнес-логики нет. C8 PASS: без дополнительного store/adapter/абстракции.

## Модель и контракт

[Data model](data-model.md), [contract](contracts/account-profile.md), [quickstart](quickstart.md). У model один профиль `{label, avatarUrl}`. `normalizeAccountProfile` сохраняет текущие проверки HTTPS/credentials и fallback. `server/index.ts` экспортирует `getAccountSettings`/`AccountSettingsResult` из действующего adapter. `auth/application` и app импортируют через account/server; UI импортирует type из account/model. `AccountHeader` внутри feature импортирует `AccountAvatar` локально. Никакого server runtime в account/ui нет.

## Структура файлов

- Move `src/lib/account/{constants,normalize-profile,types}.ts` → `src/features/account/model/`; добавить `model/index.ts`, обновить `get-account-settings.ts` и integration импорт.
- Move `src/components/{AccountHeader,AccountAvatar}/*` → `src/features/account/ui/`; добавить `ui/index.ts`, обновить app и Query fixture.
- Add `src/features/account/server/index.ts` с server-only публичным входом без нового fetch; обновить `src/app/page.tsx` и `src/features/auth/application/resolve-home.ts`.
- Add `tests/unit/account-profile.test.ts` для независимых границ нормализации; `tests/component/account-avatar.test.tsx` и `tests/component/account-header.test.tsx` для fallback/доступности; сохранить `tests/integration/account-profile.spec.ts`, `get-account-settings.spec.ts`, `home-flow.spec.ts` и `tests/e2e/account-profile.spec.ts`.
- Документы `specs/047-account-feature-migration/*` и итоговая строка `docs/refactoring-roadmap.md`. Карта 035 для трёх model и восьми UI файлов уже соответствует целевым путям; provider adapter остаётся server-owned до 054.

## Порядок и проверки

Baseline целевых integration, E2E и модели; read-only анализ. Затем UI/model перенос и тесты при неизменном поведении; отдельный поведенческий Red не нужен. Провести Green и Refactor через Vitest, typecheck/lint/styles/format, integration, Query, E2E последовательно, client/server граф, post-analyze, diff/secret review, commit/push и оба CI jobs для кода и документации. При несовпадении baseline остановить изменение поведения и зафиксировать расхождение. Новых пакетов и пользовательских действий нет.

## Post-design C1–C8

PASS: модель и UI отделены, server entry явный, внешний и auth контракты прежние, зависимость UI от server runtime отсутствует. Отклонений от принципов нет.
