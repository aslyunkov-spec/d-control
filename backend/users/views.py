from django.contrib.auth import get_user_model
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny

from .serializers import UserPickerSerializer


class UserListAPIView(ListAPIView):
    serializer_class = UserPickerSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        return (
            get_user_model()
            .objects.filter(is_active=True)
            .select_related("profile__role", "profile__department")
            .order_by("first_name", "last_name", "username")
        )
