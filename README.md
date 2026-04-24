# Brommerlogboek Webapp

Een mobile-first webapp om kosten, ritten, onderhoud en visuele herkenning van je brommers eenvoudig bij te houden.

## Lokale flow

1. Kopieer `.env.example` naar `.env.local`.
2. Start de database met `npm run db:up`.
3. Wacht tot Postgres klaar is en pas migrations toe met `npm run db:init`.
4. Start de app lokaal met `npm run local`.

## Scripts

- `npm run local` start de Next.js app op `http://localhost:3000`
- `npm run db:up` start alleen de Postgres container
- `npm run db:migrate` past openstaande SQL migrations toe
- `npm run db:init` combineert database start, wachtlus en migrations
- `npm run db:down` stopt de lokale Docker stack
- `npm run typecheck` voert de TypeScript check uit
- `npm run build` bouwt de productieversie

## Productieflow

- `GitHub Actions` bouwt en publiceert de app-image
- `Portainer` gebruikt `compose.deploy.yaml`
- de webapp bindt standaard op `127.0.0.1:6000`, bedoeld voor reverse proxy via `Caddy`
- dezelfde image draait zowel `migrate` als `app`
- `Postgres` draait als eigen container met persistente opslag
- uploads worden buiten de image bewaard via een persistente mount op `/app/storage/uploads`
