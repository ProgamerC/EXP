# ExpertAuto — Working Restore (Next.js + Django/DRF)

This snapshot matches the state when the site was working and the car image displayed.
Steps (Windows 10 + Docker Desktop):

```powershell
cd expertauto_working_restore

# env
copy env\dev\.env.example env\dev\.env

# up
docker compose -f infra/docker-compose.dev.yml up -d --build

# migrate + superuser
docker compose -f infra/docker-compose.dev.yml exec backend python manage.py migrate
docker compose -f infra/docker-compose.dev.yml exec backend python manage.py createsuperuser

# open
# Frontend: http://localhost:3000
# API:      http://localhost:8000
# Admin:    http://localhost:8000/admin
```
Deployed via GitHub Actions on Wed Nov  5 22:19:58 CET 2025
