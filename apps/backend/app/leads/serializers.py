from rest_framework import serializers
from app.leads.models import Lead


class LeadSerializer(serializers.ModelSerializer):
    """
    Используется и на вход (POST), и на вывод (ответ после создания).
    Ожидаем, что модель Lead содержит:
      - car (FK на Car, nullable допустимо)
      - name (имя клиента)
      - phone (телефон)
      - created_at (auto_now_add / DateTimeField)
    """
    class Meta:
        model = Lead
        fields = ["id", "car", "name", "phone", "created_at"]
        read_only_fields = ["id", "created_at"]
