from django.db import models
class Lead(models.Model):
    name = models.CharField(max_length=120)
    phone = models.CharField(max_length=50)
    message = models.TextField(blank=True)
    source = models.CharField(max_length=20, default="web")
    car = models.ForeignKey("cars.Car", null=True, blank=True, on_delete=models.SET_NULL)
    utm = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"{self.name} ({self.phone})"
