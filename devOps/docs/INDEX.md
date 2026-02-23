

Local:
bashdocker compose -f docker-compose.yml -f docker-compose.local.yml --env-file .env.local up
Producción:
bashdocker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod up 