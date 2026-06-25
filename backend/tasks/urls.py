from django.urls import path

from .views import TaskCommentCreateAPIView, TaskDetailAPIView, TaskListAPIView

app_name = "tasks"

urlpatterns = [
    path("tasks/", TaskListAPIView.as_view(), name="task-list"),
    path("tasks/<int:pk>/", TaskDetailAPIView.as_view(), name="task-detail"),
    path("tasks/<int:pk>/comments/", TaskCommentCreateAPIView.as_view(), name="task-comment-create"),
]