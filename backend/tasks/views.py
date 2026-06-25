from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Task, TaskComment
from .serializers import TaskCommentSerializer, TaskDetailSerializer, TaskSerializer


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


class TaskCommentCreateAPIView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        text = str(request.data.get("text", "")).strip()

        if not text:
            return Response(
                {"text": ["Комментарий не может быть пустым."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user if request.user.is_authenticated else None
        if user is None:
            # TODO: заменить fallback на request.user после внедрения авторизации API.
            user = get_user_model().objects.order_by("id").first()

        if user is None:
            return Response(
                {"detail": "Не найден пользователь для создания комментария."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        comment = TaskComment.objects.create(task=task, author=user, text=text)
        serializer = TaskCommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)