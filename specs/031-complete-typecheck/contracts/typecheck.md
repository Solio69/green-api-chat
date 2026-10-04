# Контракт typecheck

- npm run typecheck проверяет все три области, exit 0 только при их успехе.
- typecheck:app генерирует root Next types, затем выполняет tsc без incremental.
- typecheck:tests проверяет Vitest без Next build.
- typecheck:query генерирует query-app Next types и проверяет его tsconfig.
- Полные команды доступны отдельно для локальной диагностики.
- Ошибка string → number в новом src, component/unit и query fixture файле
  должна давать TS2322 с конкретным путём через общий npm run typecheck.
- Удалённые из активных мест старые generated types восстанавливаются командой.
- Неизвестный Playwright matcher toBeInTheDocument отвергается, штатные RTL
  matcher imports проходят. any/suppressions не используются.
- Зависимости, отчёты и сборочные результаты не становятся исходными областями;
  необходимые .next/types и .next/dev/types включены явно.
