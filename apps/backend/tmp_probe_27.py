import os, django, json
os.environ.setdefault('DJANGO_SETTINGS_MODULE','project.settings')
django.setup()

from app.cars.models import Car
from app.cars.serializers import CarSerializer

c = Car.objects.get(id=27)
print('DB values:')
print('  id=', c.id, 'external_id=', c.external_id)
print('  transmission=', repr(c.transmission))
print('  transmission_raw=', repr(getattr(c, 'transmission_raw', None)))
print('  source=', c.source)

data = CarSerializer(c).data
print('\\nAPI values (what frontend gets):')
for k in ['transmission','transmission_label','fuel_type','fuel_type_label','year','make','model']:
    print(' ', k, '=>', data.get(k))

print('\\nFull serializer snapshot (first 1.2KB):')
print(json.dumps(data, ensure_ascii=False)[:1200])
