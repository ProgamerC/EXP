from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("cars", "0004_alter_car_year"),
    ]

    operations = [
        migrations.AlterField(
            model_name="car",
            name="fuel_type",
            field=models.CharField(
                max_length=32,
                default="other",
                choices=[
                    ("petrol", "Бензин"),
                    ("diesel", "Дизель"),
                    ("lpg_propane", "Газ / Бензин (пропан)"),
                    ("cng_methane", "Газ / Бензин (метан)"),
                    ("hybrid", "Гибрид"),
                    ("electric", "Электричество"),
                    ("phev_petrol", "Плагин-гибрид (бензин)"),
                    ("phev_diesel", "Плагин-гибрид (дизель)"),
                    ("mhev_petrol", "Мягкий-гибрид (бензин)"),
                    ("mhev_diesel", "Мягкий-гибрид (дизель)"),
                    ("other", "Другое"),
                ],
            ),
        ),
    ]
