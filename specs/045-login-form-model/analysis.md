# Анализ 045 до реализации

Дата: 2026-10-03. Проверены spec/checklist/research/plan/data-model/contracts/login-form/quickstart/tasks, C1–C8, архитектурная карта и действующие исходники/браузерные тесты. Read-only проход: 21 путь, SHA-256 до/после `895ce8531574ca55ad2b76fc307251fd467f8f73d9fe23f2d2a341c669481a85`, unchanged=true. Этот отчёт записан отдельным действием после прохода.

## Findings

| ID | Категория/важность | Путь | Суть и рекомендация |
| --- | --- | --- | --- |
| F045-1 | Архитектура / HIGH | plan.md, research.md, tasks.md, data-model.md, contracts/login-form.md | План предлагает новый `src/features/auth/client/` и оставляет UI в `src/components`, тогда как утверждённая карта 035 и CODING_RULES задают auth `{model,application,ui,server}` и перенос компонентов входа в `features/auth/ui` в задаче 045. До кода уточнить владельцев: браузерные адаптеры/хуки и компоненты — в auth/ui, внешние импорты через public entry; server/application не втягивать в клиентский bundle. Обновить все файлы комплекта и повторить анализ. |

CRITICAL: 0, HIGH: 1, MEDIUM: 0, LOW: 0. Проверки базового поведения и Red/Green пока NotRun; результаты будут в verification.md. Исправление F045-1 — отдельный следующий шаг, не часть этого read-only прохода.

## Покрытие требований

| Требование | Задачи |
| --- | --- |
| FR-001 | T001, T003–T006 |
| FR-002 | T001, T003–T006 |
| FR-003 | T001, T003–T006 |
| FR-004 | T003–T006 |
| FR-005 | T001, T003–T006 |
| FR-006 | T001, T003–T006 |
| FR-007 | T001, T003–T006 |
| FR-008 | T001, T003–T006 |
| SC-001 | T003–T007 |
| SC-002 | T003–T007 |
| SC-003 | T001, T003–T007 |

8 FR, 3 SC, 7 задач; покрытие 11/11, задач без требования 0, дублирования требований 0. C1 PASS: варианты/цена описаны. C2 BLOCKED F045-1. C3/C4 PASS: разрешение текущего цикла и Git из переписки. C5/C6 PASS: нет новых пакетов/секретов. C7 PASS в плане: behavioral Red до реализации новой защиты unmount, baseline для переноса, итоговые проверки; фактически ещё NotRun. C8 BLOCKED F045-1: лишний слой против утверждённой целевой структуры. После исправления повторить read-only анализ.

## Повторный read-only анализ после исправления F045-1

Проверены те же 21 путь; SHA-256 до/после `3dca316d0d3c9ddf3f89a8b4d70fb063fb06d5eb843dd8ec5f1fbae5fb1ef580`, unchanged=true. F045-1 RESOLVED: план, исследование, контракт и задачи теперь размещают adapters/hooks и четыре компонента в `features/auth/ui`, обновляют public entry и внешних потребителей по карте 035. Ссылок на новый `auth/client` и планируемое сохранение auth UI в `src/components` нет. C1–C8 PASS; покрытие 11/11; открытых findings 0. Baseline, Red/Green/Refactor и итоговые проверки ещё NotRun.

## Read-only анализ после реализации

Проверены 34 файла комплекта, перенесённого UI и тестов; SHA-256 до/после `179d0026dffb220ae40ca3cbff3ba2c12de59b88cab140650854efb6b36c736b`, unchanged=true. Старых runtime/test импортов четырёх `src/components/*` нет; клиентский auth UI не импортирует auth/server, session runtime и `next/headers`. Код соответствует исправленной карте 035. C1–C8 PASS, FR/SC 11/11 трассируются в tasks, открытых findings 0. Тесты и CI документируются отдельно в verification.md.
