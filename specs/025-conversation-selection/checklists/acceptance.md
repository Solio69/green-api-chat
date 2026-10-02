# Acceptance: выбор переписки

**Kind**: Acceptance. **Status**: Passed в собственной границе025; ревью пользователя NotRun. Совместная интеграция019/021 — NotRunExternal.

- [x] ACC001 A/B и найденный получатель выбираются без SendMessage, повторного поиска и дубля — Query/E2E Passed.
- [x] ACC002 accessId каждого открытия, selectionEpoch switch/close и mobile сохранение — integration/Query Passed.
- [x] ACC003 Состояния на контрактном history-слоте различимы — Query Passed; настоящая история019 NotRunExternal.
- [x] ACC004 Mobile back/close/resize сохраняют согласованный выбор, Query/список/cookie — integration/Query/E2E Passed.
- [x] ACC005 Фокус, Enter/Tab, скрытие панелей, 320–1280px и длинная подпись при 200% тексте — E2E Passed; визуальное ревью 320/1280 агентом выполнено.
- [x] ACC006 Закрытая область скрывает/блокирует выбор; новая scope начинает с нуля — Query Passed. Поздний fixture result не меняет выбранный чат.
- [x] ACC007 Сигнал очистки ввода — Query contract consumer Passed; настоящий composer и late HTTP021 NotRunExternal.
- [x] ACC008 TDD/Refactor и регрессия записаны в verification; редизайна и Git mutations нет; сеть истории относится к отдельно разрешённой018 — Passed.

Результаты и ограничения: [verification.md](../verification.md). Ручное ревью пользователя не отмечается выполненным автоматическими тестами.

- [x] ACC010 Приватный хук фокуса: скрытие панели восстанавливает фокус, внешний
      фокус не перехватывается, глобальные window/document listeners отсутствуют;
      baseline6 и итоговые14 E2E Passed. Рефакторинг разрешён пользователем.

- [x] ACC011 Строка выделена в ChatListItem с собственным SCSS Module и публичным
      экспортом; фактические подписи, инициал, выбор и доступность сохранены.
      Все8 list и6 selection E2E Passed; typecheck/lint/styles/format Passed.

- [x] ACC012 Блок ошибки и повтора выделен в ChatListRecovery с собственным SCSS
      Module и экспортом; Query/состояние/обработчик остались в ChatListPanel.
      Все8 list E2E, typecheck/lint/styles/format Passed.

- [x] ACC013 Две подсказки используют RecipientSearchHint(text,isHidden) с отдельным
      SCSS Module и экспортом; hintId, доступное описание и резервирование высоты
      сохранены. 2 search UI/layout E2E и typecheck/lint/styles/format Passed.
