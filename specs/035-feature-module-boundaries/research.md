# Исследование 035: границы функциональных модулей

Дата: 2026-10-03. 028–034 завершены; [дорожная карта](../../docs/refactoring-roadmap.md)
утверждает функциональные модули. В 035 код не перемещается.

## Факты текущего репозитория

`git ls-files src tests`: 251 исходный и 109 тестовых файлов. AST-анализ
210 TS/TSX исходников нашёл 621 связь импорта/реэкспорта и цикл
`src/lib/chats/session-chat-facts.ts` ↔
`src/lib/query/create-query-session.ts`. Вторая сторона цикла является
type-only импортом, но файловый граф цикличен; общий Query-сеанс также
сам импортирует `fetchChats` и `reconcileSessionChats` из области чатов.
Клиентские хуки в `src/lib/chats`, `history`, `messages`, `unread`
импортируют `src/components/QueryProvider` и/или
`ConversationSelectionProvider`. Следовательно, текущее имя `lib` не
обозначает чистую модель. Дополнительно `chats/types.ts`,
`history/types.ts`, `notifications/types.ts`, `sending/types.ts`
смешивают DTO с Query-ошибками, `Request` или типом серверных
реквизитов; их нельзя целиком перенести в чистый `model`. Целевые зависимости не будут описываться как
уже существующие; каждому нарушению назначается задача переноса.

Маршруты Next.js остаются в `src/app`: по документированному соглашению
Route Handler находится в `route.ts` внутри app. Server Component может
рендерить Client Component, но импорт из файла с `use client` расширяет
клиентский граф; серверные секреты и адаптеры должны иметь отдельную
точку входа. Для текущего объёма проекта не требуется новый state manager
или новый слой абстракций на каждый файл.

## Варианты и выбор

| Решение | Преимущество | Риск/итог |
| --- | --- | --- |
| Сохранить технические корни `components`/`lib` | Минимум перемещений | Владелец и направление зависимостей неочевидны; отклонено пользователем в пользу функциональных модулей |
| `features/{auth,account,recipients,chats,conversation}` + небольшие shared/server | Код сценария рядом с его моделью и UI; явные server/client входы | Переход требует согласованных 036–049; выбрано |
| Перенести всё в 035 | Быстро получить новое дерево | Большой diff мешает проверки поведения и владения; отклонено |
| Сначала документировать 360 файлов и переносить по задачам | Каждый путь и временный импорт имеют владельца | Карта требует актуализации после каждого переноса; выбрано |
| Один `index.ts` на feature | Короткие импорты | Серверный экспорт может попасть в client graph; отклонено |
| Раздельные `model`, `application`, `ui`, `server` входы | Граница среды видна в import path | Четыре входа применяются только там, где слой реально существует; выбрано |

Не создаём общий `shared` только потому, что код лежит в `lib`:
переносим туда лишь нейтральные контракты и реально общие примитивы.
Клиентский Query-сеанс хранит владение ресурсами; конкретная загрузка
чатов должна поступать через feature-specific composition/порт (044/048),
а не импортироваться нейтральной фабрикой. Модель сообщений и статусов
помещается в conversation/model (042), координация кеша — в
conversation/application (043), отправка и уведомления — в отдельные
подобласти этого же feature (039–044).

## Источники

- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components): граница `use client`, защита server-only модулей.
- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers): `route.ts` остаётся в app.
- [TanStack Query Advanced Server Rendering](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr): Client QueryClientProvider и разные роли серверного/клиентского кода.
- Фактические `src`, `tests`, [CODING_RULES](../../docs/CODING_RULES.md), [CODE_STYLE](../../docs/CODE_STYLE.md), 028 и 034.
