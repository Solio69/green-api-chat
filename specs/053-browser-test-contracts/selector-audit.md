# Selector audit 053

| Группа | Решение и проверяемый контракт |
| --- | --- |
| `login-form.spec.ts` SVG `innerHTML()` equality | Удалить сравнение path; доступные имена Show/Hide, title, тип/значение input проверяют действие. Наличие декоративного SVG и `aria-hidden` оставить. |
| `home.spec.ts` generic `input` count | Удалить; обе label + required уже проверяются. |
| `recipient-search.spec.ts` `MAIN_SELECTOR` | Заменить на landmark role `main`; тест проверяет защищённую страницу, не DOM tag selector. |
| `login-ui`, `login-form-safety`, `search-layout` CSS selectors | Оставить для размеров, фоновых цветов, scroll width, точных layout вычислений. Пользовательские действия там уже через roles/labels. |
| `account-profile` SVG/image/HTML selectors | Оставить: avatar fallback, отсутствие секретов в rendered HTML, decor и touch/contrast. Generic `input` count в theme сценарии заменён на `getByRole(ROLE_TEXTBOX)`; ровно одно поле поиска остаётся проверяемым требованием экрана. |
| `chat-list-ui` initials/decoration/parent/paragraph/SVG | Оставить: настоящие initials, отсутствие выдуманной decoration, contrast и reduced motion icon animation; selection через role/name. |
| Query `QUERY_OUTPUT_SELECTOR` и probe IDs | Fixture state output намеренно JSON contract; browser проверяет Next request/reload/console, а не пользовательский UI. |
| Query history/unread scroll/bounds/image | Оставить: scroll geometry, virtual window, image absence, responsive badge/heading. |

Поиск `waitForTimeout`: 0. Проверки `innerHTML` вне login-form используются для отсутствия секретов в rendered HTML, их нельзя заменить проверкой видимого текста. Audit обновить, если финальный diff выявит дополнительную хрупкость.
