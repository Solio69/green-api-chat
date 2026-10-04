# Модель CI качества

- Workflow event: push main/refactor, pull_request, workflow_dispatch.
- Run identity: run_id, head_sha, event, branch, run_attempt, html_url.
- Job/step result: queued/in_progress/completed, success/failure/cancelled/skipped.
- Evidence: named logs в test-results/quality, GitHub artifact id/URL.
- Acceptance: local validation, initial remote success, expected negative failure,
  restored remote success. Эти результаты не взаимозаменяемы.

Ни workflow, ни артефакты не содержат реальные реквизиты приложения.
Все source/package данные читаются из зафиксированного commit.
