from django.urls import path

from .views import TaskListAPIView

app_name = "tasks"

urlpatterns = [
    path("tasks/", TaskListAPIView.as_view(), name="task-list"),
]
