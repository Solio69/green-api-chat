# Implementation Plan: поиск получателя 046

**Spec**: [spec.md](spec.md). Дата: 2026-10-03. Полный цикл и commit/push refactor уже поручены.

## Summary

Разделить парсер/форматирование, серверный HTTP/use-case, браузерный запрос, локальный controller формы и UI. Перенести пять компонентов в features/recipients/ui, rules в model, handler/response в server. Прежний маршрут, формат JSON, тексты, размеры и выбор сохраняются. При unmount/смене scope отменить активный запрос и не применять поздний результат.

## Основание, варианты и C1–C8

[Research](research.md) сравнивает три варианта. C1 PASS: риск и выбор описаны. C2 PASS: только recipients, другие UI области остаются в своих задачах. C3/C4 PASS: реализация/commit/push авторизованы этой перепиской. C5/C6 PASS: без пакетов/БД/секретов. C7 PASS: baseline подтверждён, новый lifecycle abort проверяется поведенческим Red до реализации; перенос опирается на baseline. C8 PASS: без лишнего хранилища, карта 035 уточняется по фактическим зависимостям.

## Модель и контракт

[Data model](data-model.md), [contract](contracts/recipient-search.md), [quickstart](quickstart.md). Новые public entries features/recipients/model, server, ui. Model владеет constants, validate-search, format-recipient-label; server — handle-search-request и resolve-search, импортирует model и server/http; UI — пять компонентов, request-recipient-search и use-recipient-search внутри RecipientSearchForm. UI вызывает существующий ConversationSelection/QuerySession; серверный маршрут делегирует server entry. Код ответа 401 имеет прежнюю навигацию, но только пока владелец активен. Отсутствующий/неожиданный ответ не становится успехом.

## Файлы и тесты

- Move src/lib/recipients/{constants,validate-search}.ts -> src/features/recipients/model; format-recipient-label.ts из RecipientSearchForm -> model; resolve-search.ts и handle-search-request.ts -> src/features/recipients/server. Добавить index.ts по ролям.
- Move src/components/RecipientSearchForm, RecipientSearchField, RecipientSearchHint, RecipientSearchModeSwitch, RecipientSearchResult -> src/features/recipients/ui; добавить ui/index.ts и request-recipient-search.ts/use-recipient-search.ts рядом с формой. Сохранить SCSS/DOM.
- Обновить app route, app/page, ChatListItem, ConversationHeader, GREEN-API check-account, Query fixtures и тестовые импорты. Исправить две строки specs/035-feature-module-boundaries/ownership-map.csv, поскольку resolve-search содержит серверный Response, а format-recipient-label чистую модель.
- Новые tests/unit/recipient-search-client.test.ts, tests/component/recipient-search-form.test.tsx. Существующие tests/unit/recipient-label.test.ts, tests/component/recipient-search-result.test.tsx, tests/integration/recipient-search.spec.ts/shared-http-contract.spec.ts, tests/e2e/recipient-search.spec.ts/recipient-search-ui.spec.ts/search-layout.spec.ts, Query selection/unread.

## Последовательность проверки

Подтвердить baseline, провести read-only analyze C1–C8. Написать lifecycle abort test и подтвердить поведенческий Red; затем move/adapters/hook/UI, Green и Refactor. Проверить два режима, границы, pending/повтор, 401, поздний ответ, нормализованную подпись и отсутствие отправки. Запустить typecheck/lint/styles/format/Vitest/integration/Query/E2E (Playwright последовательно), граф server/client, post-analyze, diff/secret review, commit/push и обе CI jobs кода/документов.

## Post-design C1–C8

PASS при server/model разделении, неизменном HTTP/DOM/selection контракте и без нового store.
