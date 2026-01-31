# Local PostgreSQL (Docker)

## Start the database

```bash
docker compose up -d
```

## Use it in your app

Point your app at the local DB by setting `DATABASE_URL` before running (e.g. in `apps/web/.env` or `packages/prisma/.env`, or in your shell):

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dy"
```

Then run migrations from the repo root:

```bash
pnpm --filter @reelo/db db:migrate
```

## Stop

```bash
docker compose down
```

Data is stored in the `dy_postgres_data` volume. Use `docker compose down -v` to remove it.
