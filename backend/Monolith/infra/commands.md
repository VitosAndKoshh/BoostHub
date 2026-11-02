# BoostHub Commands

!!! All commands are executed from the repository root directory.

---

## Backend

### Start Backend and PostgreSQL

```bash
docker compose \
  -f ./backend/Monolith/infra/docker-compose.yml \
  -p boost-hub \
  --env-file ./backend/Monolith/infra/.env \
  up --build -d
```

### Start Development Tools Only

```bash
docker compose \
  -f ./backend/Monolith/infra/docker-compose.dev.yml \
  -f ./backend/Monolith/infra/docker-compose.override.yml \
  -p boost-hub \
  --env-file ./backend/Monolith/infra/.env \
  up -d
```

### Start Backend, PostgreSQL and Development Tools

```bash
docker compose \
  -f ./backend/Monolith/infra/docker-compose.yml \
  -f ./backend/Monolith/infra/docker-compose.dev.yml \
  -p boost-hub \
  --env-file ./backend/Monolith/infra/.env \
  up --build -d
```

### Start Backend with Local Overrides and Development Tools

```bash
docker compose \
  -f ./backend/Monolith/infra/docker-compose.yml \
  -f ./backend/Monolith/infra/docker-compose.dev.yml \
  -f ./backend/Monolith/infra/docker-compose.override.yml \
  -p boost-hub \
  --env-file ./backend/Monolith/infra/.env \
  up --build -d
```

---

## Migrations

### Create Migration

```bash
dotnet ef migrations add "MigrationName" \
  -p ./backend/Monolith/src/Migrations/
```

### Update Database

```bash
dotnet ef database update \
  -p ./backend/Monolith/src/Migrations/
```

---

## Docker Compose Management

### Stop Backend Stack

```bash
docker compose \
  -f ./backend/Monolith/infra/docker-compose.yml \
  -p boost-hub \
  --env-file ./backend/Monolith/infra/.env \
  down
```

### View Running Services

```bash
docker compose \
  -f ./backend/Monolith/infra/docker-compose.yml \
  -p boost-hub \
  --env-file ./backend/Monolith/infra/.env \
  ps
```