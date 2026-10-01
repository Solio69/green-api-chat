# Acceptance checklist: список чатов и Query

Дата: 2026-10-02. Kind: Acceptance. Автоматическая приёмка Passed; результаты — verification.md. Видимый список подключает 015, ручной реальный GetChats — NotRun. Ссылка: [spec.md](../spec.md).

- [x] CHK001 [SC-001; FR-001–FR-005] GetChats через server session, mixed только user, empty/pending/error различимы, safe DTO без секретов/вымышленных полей.
- [x] CHK002 [SC-002; FR-002, FR-006] Нет сессии/неверный scope → ноль provider calls; подтверждённый отказ очищает cookie, временный сохраняет, 429 максимум одна server retry.
- [x] CHK003 [SC-003; FR-007–FR-009] Два настоящих потребителя разделяют один запрос, свежий remount без повторного API, stale/refetch/error действуют по контракту.
- [x] CHK004 [SC-004; FR-010–FR-012] Успех выхода/401/смена scope очищают и скрывают данные, late promises их не возвращают; logout error сохраняет; нет persisted cache.
- [x] CHK005 [SC-005; FR-013, FR-015] Dependency установлена пользователем; production/fixture build и actual provider совместимы; login/profile/search/logout регрессия зелёная.
- [x] CHK006 [SC-006; FR-008, FR-014, FR-016] Публичный hook и handoff docs проверены; shared изменения сохранены, стили/редизайн не переписаны, статус UI указан честно.
- [x] CHK007 [C7] Поведенческий Red новой логики предшествует реализации, Green после серии, Refactor и финальная регрессия записаны в verification.md.
- [x] CHK008 [C4–C6] Git index не менялся агентом; секреты отсутствуют в публичных данных/logs/tests; настоящую ручную проверку не выдавали за выполненную.

Проверка реального GetChats пользователем — NotRun. Для будущего исключения/Blocked требуется причина в verification; просто поставить Pass нельзя.
