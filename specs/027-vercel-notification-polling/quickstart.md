# Проверка и Vercel

Зависимости уже установлены; npm run dev и прежний пользовательский сценарий. Фиктивный стенд: npm run test:query -- polling-workspace.spec.ts. Полный контроль: npm run test:integration, затем npm run test:query, затем npm run test:e2e; quality checks из README.

Vercel: Import GitHub repository, Framework Next.js, RootDirectory корень, Node 24, Build npm run build; стандартные настройки Next.js. EnvironmentVariables: SESSION_PASSWORD (серверный секрет минимум 32 символа) для Production, отдельно Preview если нужен; NEXT_PUBLIC префикс не добавлять. .env.local не коммитить. Секрет лучше отдельный дляproduction. Новых переменных/Redis нет. После изменения env нужен redeploy. Пользователь публикует актуальные изменения в GitHub по своему процессу, агент Git mutations не делает.

После deploy пользователь проверяет login→history→send→incoming→status→unread→logout и две вкладки; localhost иVercel разныеorigins, одновременно одниминстансом не проверять. Реальный Vercel/Telegram в автотестах NotRun. ДемоURL не выдумывать.
