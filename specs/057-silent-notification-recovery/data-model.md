# Модель доступности отправки

Новых полей нет. Проекция ConnectionModel → ConnectionState использует status и everConnected.

| status | everConnected | canSend |
| --- | --- | --- |
| connected | true | true |
| retrying | true | true |
| retrying | false | false |
| closed / connecting / limited / paused | любое | false |

everConnected устанавливается успешным settings_ready. Само наличие сессии или владение вкладкой его не заменяет. Контроллер отправки дополнительно проверяет активную сессию, текущего владельца, валидный текст и отсутствие другой попытки.

status, issue, pendingAck, generation и publish_recovery сохраняются. Новый retrying не означает отмену текущей отправки; успех получения не повторяет POST сообщения.
