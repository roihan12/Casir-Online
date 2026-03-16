up:
	docker compose -f docker-compose.prod.yml --env-file .env.production up -d

down:
	docker compose -f docker-compose.prod.yml --env-file .env.production down

logs:
	docker compose -f docker-compose.prod.yml --env-file .env.production logs -f

build:
	docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build