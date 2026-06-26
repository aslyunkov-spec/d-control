from django.urls import path

from .views import (
    TaskCommentCreateAPIView,
    TaskCommentUpdateAPIView,
    TaskDetailAPIView,
    TaskFileCreateAPIView,
    TaskFileDeleteAPIView,
    TaskListAPIView,
    TaskSubtaskCreateAPIView,
    TaskSubtaskDeleteAPIView,
    TaskSubtaskToggleAPIView,
)

app_name = "tasks"

urlpatterns = [
    path("tasks/", TaskListAPIView.as_view(), name="task-list"),
    path("tasks/<int:pk>/", TaskDetailAPIView.as_view(), name="task-detail"),
    path("tasks/<int:pk>/comments/", TaskCommentCreateAPIView.as_view(), name="task-comment-create"),
    path(
        "tasks/<int:pk>/comments/<int:comment_pk>/",
        TaskCommentUpdateAPIView.as_view(),
        name="task-comment-update",
    ),
    path("tasks/<int:pk>/files/", TaskFileCreateAPIView.as_view(), name="task-file-create"),
    path(
        "tasks/<int:pk>/files/<int:file_pk>/",
        TaskFileDeleteAPIView.as_view(),
        name="task-file-delete",
    ),
    path("tasks/<int:pk>/subtasks/", TaskSubtaskCreateAPIView.as_view(), name="task-subtask-create"),
    path(
        "tasks/<int:pk>/subtasks/<int:subtask_pk>/toggle/",
        TaskSubtaskToggleAPIView.as_view(),
        name="task-subtask-toggle",
    ),
    path(
        "tasks/<int:pk>/subtasks/<int:subtask_pk>/",
        TaskSubtaskDeleteAPIView.as_view(),
        name="task-subtask-delete",
    ),
]