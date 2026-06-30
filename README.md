# D-Control

D-Control — внутренняя система управления задачами, отделами, исполнителями и контролем выполнения.

## Стек

- Backend: Django
- Frontend: React
- Database: PostgreSQL
- Notifications: Email digest
- Deployment: локальный Linux-сервер, позже возможен cloud

## Текущий статус

Реализовано:

- Django project
- Django Admin
- apps: users, departments, tasks, notifications
- базовые модели пользователей, ролей, разрешений, отделов, задач
- TaskAssignment
- тестовый отдел Д-тест
- тестовые колонки
- первая задача TEST-1

## Документация

Документы находятся в папке `/docs`.

## Следующий этап разработки

Продолжение после модели `TaskAssignment`:

1. Настроить отображение назначений в Django Admin.
2. Добавить связь задач с исполнителями.
3. Проверить создание задач с несколькими исполнителями.
4. Подготовить базовую бизнес-логику отображения задач по пользователю.

## AI Development

Перед началом работы обязательно изучить:

1. docs/00_project/D-Control_Constitution.md
2. docs/00_project/AI_INSTRUCTIONS.md
3. docs/00_project/Architecture_Index.md
4. docs/01_ui/D-Control_UI_UX_Guidelines.md

Все изменения должны соответствовать этим документам.