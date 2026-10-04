# Contract 047: профиль аккаунта

1. `normalizeAccountProfile({value, credentials})` возвращает только `label` и `avatarUrl`. `label` — обрезанный username, иначе обрезанный phone, иначе пустая строка. Некорректные типы и значения с реквизитами не отображаются. Avatar — только абсолютный HTTPS URL без URL-credentials и с прежней фильтрацией реквизитов.
2. `account/server` предоставляет существующий `getAccountSettings`/`AccountSettingsResult` без изменения URL, fetch options, retry, timeout и классификации ответов. `auth/application/resolveHome` сохраняет прежнее решение LOGIN/END_SESSION/RETRY/authorized.
3. `AccountHeader` отображает `label || DEFAULT_LABEL`, статус подключения и кнопку выхода; `AccountAvatar` отображает изображение с пустым alt и прежним referrerPolicy или декоративный SVG при пустом URL/ошибке загрузки. Доступное имя области, размеры, темы и keyboard/focus не меняются.
4. Публичные входы разделены: `account/model`, `account/ui`, `account/server`. Client UI не импортирует server entry, DTO и credentials. Профиль не пишется в storage и не отправляется в provider.
