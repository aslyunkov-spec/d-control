from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny

from .models import Task
from .serializers import TaskDetailSerializer, TaskSerializer


class TaskListAPIView(ListAPIView):
    serializer_class = TaskSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        queryset = Task.objects.select_related(
            "department",
            "status",
            "priority",
        ).order_by("column__sort_order", "-created_at")

        department_id = self.request.query_params.get("department")
        if department_id:
            queryset = queryset.filter(department_id=department_id)

        return queryset


class TaskDetailAPIView(RetrieveAPIView):
    serializer_class = TaskDetailSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        return Task.objects.select_related(
            "department",
            "status",
            "priority",
        ).prefetch_related(
            "assignments__user",
            "comments__author",
            "files",
            "history_events",
        )
