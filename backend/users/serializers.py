from django.contrib.auth import get_user_model
from rest_framework import serializers


class UserPickerSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = get_user_model()
        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "role",
            "department",
            "avatar",
        )

    def get_role(self, user):
        profile = getattr(user, "profile", None)
        role = getattr(profile, "role", None)
        return role.name if role else None

    def get_department(self, user):
        profile = getattr(user, "profile", None)
        department = getattr(profile, "department", None)
        return department.name if department else None

    def get_avatar(self, user):
        profile = getattr(user, "profile", None)
        avatar = getattr(profile, "avatar", None)
        if not avatar:
            return ""
        request = self.context.get("request")
        return request.build_absolute_uri(avatar.url) if request else avatar.url
