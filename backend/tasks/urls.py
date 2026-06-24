from django.urls import path

from .views import TaskDetailAPIView, TaskListAPIView

app_name = "tasks"

urlpatterns = [
    path("tasks/", TaskListAPIView.as_view(), name="task-list"),
    path("tasks/<int:pk>/", TaskDetailAPIView.as_view(), name="task-detail"),
]
