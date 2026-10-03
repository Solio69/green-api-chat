# Implementation Plan: Достоверный React lifecycle

**Spec**: [spec.md](spec.md)
**Дата**: 2026-10-03
**Согласование и реализация**: пользователь поручил весь согласованный рефакторинг, полный цикл каждой задачи, самостоятельные commit и push в refactor.

## Summary

Проверить настоящий стек QueryProvider → NotificationProvider под корневым
StrictMode. Управлять только внешними fetch/lease и временем. Сохранить
существующий браузерный сценарий, уточнив его название.

## Considered Options

Сравнение среды, подмен, времени и ключа находится в [research.md](research.md).
Выбран RTL с настоящими объектами; production браузер остаётся для своих контрактов.

## Technical Context

React 19.3, TanStack Query 5.104, TypeScript 5.9, Vitest 5, RTL 16,
jsdom 29; текущие зависимости 029. Локальные фиктивные scope/данные.
Продуктовый код и пользовательское поведение не меняются.

## Constitution Check

| Принцип | До и после проектирования |
| --- | --- |
| C1 | PASS: объяснены настоящие провайдеры и key; новых продуктовых решений нет |
| C2 | PASS: одна задача 030 с измеримым ресурсным контрактом |
| C3 | PASS: spec → plan/tasks → read-only анализ → код; авторизация из переписки |
| C4 | PASS: явное пользовательское исключение commit/push в refactor |
| C5 | PASS: без установок и БД |
| C6 | PASS: явный feature, вымышленные данные, чужих изменений нет |
| C7 | PASS: регрессионные тесты существующего кода; реальные команды и отчёт |
| C8 | PASS: минимальная фикстура, без новой архитектуры приложения |

## Research and Design

[research.md](research.md), [data-model.md](data-model.md),
[contracts/lifecycle.md](contracts/lifecycle.md), [quickstart.md](quickstart.md).
HTTP API не меняется; контракт описывает наблюдаемые ресурсы.

## Project Structure

Новые файлы:
- tests/support/provider-lifecycle.ts — управляемые ответы fetch; mock lease и React harness находятся в component-тесте.
- tests/component/provider-lifecycle.test.tsx — сценарии реальных провайдеров.
- specs/030-react-lifecycle-contracts/research.md, plan.md, data-model.md,
  contracts/lifecycle.md, quickstart.md, tasks.md, analysis.md, verification.md.

Изменяемые:
- tests/query/chat-query.spec.ts — только точное название production-сценария.
- specs/030-react-lifecycle-contracts/spec.md и checklists/requirements.md — фактическая авторизация/готовность.
- docs/refactoring-roadmap.md — поручение полного цикла и результаты 030.

## Tasks and Dependencies

029 завершена и отправлена. T001–T006 выполняются последовательно.
Сначала тесты существующего поведения; искусственный Red не нужен.
При обнаружении дефекта отдельная запись с воспроизведением и привязкой к
согласованному исправлению, без ослабления ожиданий и смешивания с переносом.
Новые изменения поведения требуют отдельного согласованного контракта и Red.

## Verification

Vitest полный набор, root и Vitest typecheck, ESLint, Stylelint, Prettier.
Playwright query chat-query.spec.ts запускается с production fixture:
проверяет сохранение всех прежних browser-сценариев, а не development replay.
Контроль чувствительности: временно убрать StrictMode только из harness,
убедиться в падении replay-ожидания, восстановить и проверить итоговый набор.
Проверяются поздний receive, поздний lease, отказ lease и ошибочный cleanup,
два потребителя, кеш/владелец/отмена/таймеры при закрытии.
Полный E2E здесь не повторяется: src не меняется; известный DEFECT-01 остаётся
в roadmap до исправления перед зелёным browser CI.

## Post-design Constitution Check

C1–C8 PASS с основаниями выше. Неприменимых обязательных артефактов нет.

## Complexity Tracking

Один helper объединяет setup/teardown и внешние управляемые границы.
Он не реализует бизнес-модель и не воспроизводит внутренний цикл контроллера.
