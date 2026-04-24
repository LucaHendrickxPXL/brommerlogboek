# Brommerlog Webapp V1 Spec

## Doel

Deze webapp wordt een persoonlijke app voor het beheren van brommers, kosten, ritten en onderhoud.

De app moet het dagelijkse leven van een eigenaar eenvoudiger maken:

- weten hoeveel een brommer echt kost
- snel een tankbeurt of andere kost registreren
- ritten bijhouden in een tripjournal
- zien welke brommer binnenkort onderhoud nodig heeft
- overzicht houden zonder dat de app technisch of zwaar aanvoelt

De app is dus geen developer backoffice en geen zakelijke fleettool.
Het is een consumentgerichte webapp voor een eindgebruiker die zijn eigen brommerleven overzichtelijk wil houden.

## Productvisie

De app voelt als een combinatie van:

- een persoonlijk logboek
- een nette kostenapp
- een onderhoudsassistent

De app moet vooral drie vragen snel beantwoorden:

- Wat heeft mijn brommer mij deze maand gekost?
- Welke ritten heb ik recent gedaan?
- Wanneer moet de volgende onderhoud gebeuren?

## V1 Scope

De app moet in `v1` minstens toelaten om:

- een owner-account te gebruiken
- meerdere brommers aan te maken en te beheren
- per brommer basisgegevens en kilometerstand bij aankoop bij te houden
- één hoofdfoto per brommer toe te voegen
- tankbeurten te registreren met brandstoftype, bedrag en optioneel kilometerstand
- andere kosten te registreren zoals verzekering, onderhoud, onderdelen en accessoires
- ritten te loggen met datum, afstand en notities
- één optionele foto per rit toe te voegen
- onderhoudsplannen aan te maken per brommer
- onderhoudsbeurten te registreren en automatisch de volgende onderhoud te berekenen
- signalen te tonen voor aankomende of overdue onderhoud
- maand- en jaaroverzichten te tonen
- kosten per brommer, per categorie en per periode te tonen
- een rustige `Home` te bieden met snelle acties en aandachtspunten

## Buiten Scope Voor V1

Deze zaken horen voorlopig niet in `v1`.
We gaan deze dus bewust niet bouwen in deze fase:

- live GPS tracking tijdens het rijden
- automatische route-import uit Google Maps of andere apps
- OBD of voertuigtelemetrie
- sociale functies of ritten delen met anderen
- multi-user huishoudens of gedeelde garages
- upload van factuurscans met OCR
- pushnotificaties naar telefoon of mail
- voorraadbeheer voor onderdelen
- boekhoudkoppelingen
- tankkaarten, pechbijstand of verzekeringsflows
- meerdere foto's per brommer
- meerdere foto's per rit
- galerijweergaves of media-bibliotheken
- beeldbewerking of filters
- externe cloud-mediaflow als verplichte eerste stap

## V1 Randvoorwaarden

- de app blijft eigenaar-gericht en eenvoudig
- de interface gebruikt menselijke taal
- de app moet mobiel comfortabel bruikbaar zijn
- de app wordt mobile-first ontworpen
- gsm is de primaire gebruiksvorm van deze app
- een sterke mobiele UI is dus geen nice-to-have maar een harde vereiste
- standaardflows moeten snel invoer toelaten met weinig typen
- grote tabellen zijn niet het uitgangspunt op mobiele schermen
- analyse mag aanwezig zijn, maar mag de dagelijkse logflow niet overheersen
- development en productie moeten een duidelijke, herhaalbare releaseflow hebben
- productie mag niet afhangen van lokale builds op de host
- de productie-runtime moet vlot kunnen draaien via `Portainer`
- de database draait volledig in Docker via een eigen `Postgres` container
- schemawijzigingen moeten via migrations beheerd worden

## Tech Stack

De app gebruikt dezelfde algemene stackrichting als de andere moderne webapps in deze workspace:

- `Next.js App Router`
- `React`
- `TypeScript`
- `Mantine`
- `TanStack Query`
- `Postgres`
- `pg` voor server-side database toegang
- officiële `postgres` Docker image
- `Docker` voor lokale en deelbare runtime
- persistente filesystem-opslag voor uploads in `v1`
- `GitHub Actions` voor CI en image builds
- `GHCR` of een gelijkaardige container registry voor distributie
- `Portainer` als productie-runtime

Belangrijke frontendafspraak:

- omdat de frontend hier op `React` gebouwd wordt, werken we component-based
- het is niet de bedoeling om volledige views of grote stukken UI in één enkele file te proppen
- de codebase gaat uit van herbruikbare componenten die op meerdere plaatsen ingezet kunnen worden
- gedeelde UI-patronen zoals cards, form sections, list rows, detail panels, action bars en empty states worden dus waar logisch als aparte componenten opgebouwd

## Runtime Aanpak

### Development

- `Postgres` draait lokaal via `docker compose`
- de webapp draait lokaal via `npm run dev`
- databaseconnectie loopt via `DATABASE_URL`
- development blijft bij voorkeur buiten Docker voor snellere iteratie
- een verse lokale omgeving start met de `postgres` service en daarna een migratierun

### Lokale Development Flow

De canonieke lokale flow is CLI-first:

1. `npm run db:up`
2. `npm run db:migrate`
3. `npm run local`
4. optioneel `npm run db:seed`
5. na afloop `npm run db:down`

Belangrijke afspraak:

- de app draait lokaal via `npm`
- alleen de database draait in Docker
- development hoort dus niet te steunen op een volledige appcontainer voor gewone UI-iteratie

### Production

- productie draait image-based via `Portainer`
- de host bouwt de app niet zelf
- `Portainer` pullt een vooraf gebouwde image uit de container registry
- de productie-stack bevat zowel de app als een `Postgres` service
- runtime-envs en secrets worden pas in `Portainer` of een host-specifieke stackconfig gezet
- de database gebruikt een named volume en een intern Docker-netwerk
- de databasepoort wordt in productie standaard niet extern gepubliceerd
- healthchecks moeten deel zijn van de standaardruntime voor zowel app als database

### Routing

De app gebruikt interne app-routing in plaats van een losse klassieke adminstructuur.

Belangrijkste routes of views:

- `/`
- `/api/health`
- interne views voor:
  - `Home`
  - `Garage`
  - `Ritten`
  - `Kosten`
  - `Onderhoud`
  - `Overzicht`
  - `Instellingen`

### Data Mutations

Voorkeur:

- data lezen server-side waar dat logisch is
- mutaties via server actions of gerichte route handlers
- UI opbouwen rond views en dagelijkse flows, niet rond losse CRUD-endpoints
- server-side dataflow krijgt voorrang zodat de productie-image zo environment-neutraal mogelijk blijft

## Deploy En Releaseflow

## Doel

De app moet eenvoudig van development naar productie kunnen gaan zonder handmatige buildstappen op de productieserver.

De gekozen richting is daarom:

- lokaal ontwikkelen buiten Docker waar dat sneller werkt
- in CI valideren en bouwen
- een productie-image publiceren in een container registry
- `Portainer` alleen laten pullen en starten

## Aanbevolen Productiemodel

De productie-opstelling gebruikt:

- een multi-stage `Dockerfile`
- `Next.js` standalone output voor een compacte runtime
- een `Portainer` stack met minstens `app` en `postgres`
- runtimeconfig via env-vars of secrets in `Portainer`
- een named volume voor database-opslag
- een intern Docker-netwerk tussen app en database
- een migratierun als deel van de deployflow

Voor deze app is de eenvoudigste productierichting:

- app container in `Portainer`
- `postgres` container in dezelfde stack
- geen buildcontext of `npm install` op de host
- geen handmatige schema-edits op de productiehost

## GitHub Actions Strategie

Er komen minstens twee workflows:

### 1. CI Workflow

Trigger:

- `pull_request`
- optioneel ook `push` naar feature branches

Taken:

- dependencies installeren
- een tijdelijke `Postgres` service opstarten in CI
- `npm run db:migrate` uitvoeren tegen een verse database
- `npm run check`
- `npm run build`
- mislukte quality gates blokkeren merge

### 2. Release Workflow

Trigger:

- `push` naar `main` voor kandidaat-images
- `workflow_dispatch` of version tags zoals `v1.0.0` voor productiepromotie

Taken:

- image builden
- image pushen naar de registry
- meerdere tags publiceren
- deploy-artefacten en composebestanden valideren
- optioneel release metadata of changelog koppelen
- optioneel een Portainer stack webhook triggeren

Belangrijke grens:

- `GitHub Actions` bouwt en publiceert de image
- de productie-migratie draait pas in de runtimeomgeving tegen de echte productie-`Postgres`
- CI mag niet rechtstreeks de productie-database wijzigen

## Image Tagging Strategie

De app gebruikt bij voorkeur zowel bewegende als immutable tags.

Aanbevolen tags:

- `sha-<commit>` voor elke build
- `main` voor de laatste build op de hoofdbranch
- `vX.Y.Z` voor echte releases
- `prod` als bewegende productie-tag

Belangrijke afspraak:

- `Portainer` gebruikt standaard liever een immutable tag zoals `v1.2.0`
- `prod` is handig voor snelle updates, maar minder veilig als enige bron van waarheid

## Portainer Deploymodel

Portainer gebruikt een stack of composebestand dat:

- verwijst naar een registry-image voor de app
- een gepinde `postgres` imageversie gebruikt voor de database
- geen lokale buildcontext verwacht
- runtime-envs buiten git bewaart
- healthchecks ondersteunt
- een named volume voor database-opslag gebruikt
- geen publieke databasepoort nodig heeft voor normaal gebruik

Voorkeursrichting:

- een productie-stack met:
  - gepinde app-releasetag
  - gepinde `postgres` major/minor versie
  - interne netwerkverbinding
  - volume voor `postgres`
- optioneel een tweede stackvariant die `:prod` volgt

Dat geeft twee praktische paden:

- gecontroleerde release via tag pinning
- sneller updaten via de bewegende `prod` tag

Voorkeur voor migrations in productie:

- een aparte `migrate` run of one-shot service binnen dezelfde Portainer stack
- die gebruikt dezelfde app-image en dezelfde `DATABASE_URL`
- pas daarna start of herstart de gewone appservice

Definitieve `v1` keuze:

- productie gebruikt een aparte migratierun
- de gewone appcontainer voert in productie geen automatische schemawijzigingen uit bij start
- startup-migraties in de appcontainer zijn alleen aanvaardbaar voor lokale development of tijdelijke interne testomgevingen

Waarom:

- dit maakt deploys voorspelbaarder
- dit verkleint de kans dat meerdere appcontainers tegelijk migraties proberen uit te voeren
- dit maakt failures en retries in `Portainer` veel duidelijker

## Runtimeconfiguratie

Deze waarden horen niet in de image of in git:

- `APP_URL`
- `SESSION_SECRET`
- `DATABASE_URL`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- optionele registry credentials of extra toegangsbescherming

Belangrijke regel:

- buildtime en runtime moeten zo veel mogelijk losgekoppeld worden
- de app moet liefst server-side werken met runtime-injectie in plaats van buildtime-secrets

## Healthchecks En Operaties

De productie-image moet minstens voorzien in:

- een `/api/health` endpoint
- een niet-root runtime waar haalbaar
- nette shutdown van de webserver
- duidelijke logs

De productie-stack moet daarnaast voorzien in:

- een `postgres` healthcheck
- startup-volgorde op basis van `service_healthy`
- duidelijke logging voor migraties en opstart

`Portainer` moet de containerstatus kunnen aflezen zonder manuele inspectie in de app.

## Rollbackstrategie

Rollback moet eenvoudig blijven.

Daarom:

- elke release krijgt een immutable tag
- `Portainer` moet snel kunnen terugzetten naar een vorige tag
- deploys mogen geen onomkeerbare host-side buildstappen vereisen
- migrations moeten bij voorkeur additief en rollback-vriendelijk geschreven worden

Een rollback is dan eenvoudig:

- vorige image-tag kiezen
- stack opnieuw deployen

Maar:

- als een migratie destructief is, kan een app-rollback schema-incompatibel worden
- daarom krijgt `v1` de voorkeur voor niet-destructieve of gefaseerde schemawijzigingen

Praktische releasevolgorde:

1. nieuwe app-image wordt beschikbaar in de registry
2. `migrate` job draait tegen de productie-database
3. als de migratierun slaagt, wordt de gewone appservice naar de nieuwe image gezet
4. als de migratierun faalt, blijft de vorige appservice actief of wordt niet gepromoveerd

## Gewenste Repo-Artefacten

De implementatie moet later minstens deze artefacten voorzien:

- `Dockerfile`
- `.dockerignore`
- `compose.yaml` voor lokale runtime met `app + postgres`
- `compose.dev.yaml` of een gelijkaardige dev-variant
- `compose.deploy.yaml` of hostgerichte stackfile voor `Portainer`
- `migrations/`
- `scripts/db-migrations.mjs` of een gelijkaardige migratierunner
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
- `deploy/production/README.md`
- `.env.example`
- `.env.deploy.example`

## Voorbeeld `compose.deploy.yaml` Richting

Onderstaande structuur is richtinggevend voor de implementatie:

```yaml
services:
  postgres:
    image: postgres:17.5
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - brommerlog_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 10s
      timeout: 5s
      retries: 10

  migrate:
    image: ghcr.io/your-org/brommerlog:${APP_IMAGE_TAG}
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: ${DATABASE_URL}
    command: ["npm", "run", "db:migrate"]
    restart: "no"

  app:
    image: ghcr.io/your-org/brommerlog:${APP_IMAGE_TAG}
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: ${DATABASE_URL}
      SESSION_SECRET: ${SESSION_SECRET}
      APP_URL: ${APP_URL}
    ports:
      - "3000:3000"
    restart: unless-stopped

volumes:
  brommerlog_postgres_data:
```

Belangrijke afspraak:

- in productie wordt `migrate` bewust eerst uitgevoerd
- de database expose je normaal niet naar buiten
- de named volume blijft bestaan los van containerrestarts

## Voorbeeld GitHub Actions Richting

Onderstaande flow is de bedoelde richting:

```yaml
name: release

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  verify:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17.5
        env:
          POSTGRES_DB: app
          POSTGRES_USER: app
          POSTGRES_PASSWORD: app
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U app -d app"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://app:app@localhost:5432/app
      - run: npm run check
      - run: npm run build

  publish:
    needs: verify
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
      - uses: docker/build-push-action@v6
        with:
          push: true
          tags: |
            ghcr.io/your-org/brommerlog:main
            ghcr.io/your-org/brommerlog:sha-${{ github.sha }}
```

Doel van dit voorbeeld:

- migrations worden gevalideerd vóór image-publicatie
- de productiehost blijft build-vrij
- tags blijven bruikbaar voor rollback

## UX/UI Richting

## Hoofdprincipe

De app mag niet aanvoelen alsof ze voor developers gebouwd is.

Dus niet:

- ruwe tabellen als standaard
- technische termen zoals `records`, `entities` of `mutations`
- schermen die vooral databasevelden tonen
- een backofficegevoel

Wel:

- een persoonlijke assistent voor je brommers
- een rustige app die snel laat zien wat belangrijk is
- duidelijke taal zoals `Tankbeurt`, `Volgende onderhoud` en `Deze maand kwijt`

## Algemene UX-principes

### 1. Dagelijks gebruik eerst

De app vertrekt vanuit terugkerende taken:

- tanken registreren
- een rit toevoegen
- een kost toevoegen
- onderhoud registreren
- controleren wat binnenkort moet gebeuren

Niet vanuit technische objecten of tabellen.

### 2. Home is het echte startpunt

`Home` moet antwoord geven op:

- wat vraagt nu aandacht
- hoeveel heb ik recent uitgegeven
- welke brommer moet ik binnenkort checken
- wat wil ik nu snel toevoegen

### 3. Elke view heeft een duidelijke rol

Per scherm moet direct duidelijk zijn:

- wat het hoofddoel is
- welke actie je daar het vaakst doet
- welke info secundair is

### 4. Rust boven volledigheid

We tonen niet alles tegelijk.

We kiezen voor:

- compacte kaarten
- duidelijke secties
- korte labels
- rustige statusbadges
- heldere empty states

### 5. Mobiel is een volwaardige ervaring

Op mobiel:

- werken kaarten beter dan brede tabellen
- opent detail als aparte focuslaag waar dat logischer is
- krijgen snelle invoerflows voorrang

### 6. Mobile First Is Verplicht

Deze app wordt in de praktijk vooral via gsm gebruikt.

Daarom geldt:

- mobile is het primaire ontwerppunt
- desktop is een verrijking, geen vertrekpunt
- elke kernflow moet eerst sterk werken op gsm
- snelle invoer, duidelijke tapdoelen en scanbaarheid op kleine schermen zijn essentieel

## Taalgebruik

Goede labels:

- `Nieuwe tankbeurt`
- `Rit toevoegen`
- `Deze maand kwijt`
- `Volgende onderhoud`
- `Onderhoud binnen 18 dagen`
- `Onderhoud geregistreerd`

Te vermijden labels:

- `Create entry`
- `Manage records`
- `Mutation complete`
- `Service entity`
- `Vehicle resource`

## Visuele Richting

De app mag niet steriel of technisch aanvoelen.

De visuele richting is:

- warm en rustig
- licht en verzorgd
- compact zonder hard te worden

Aanbevolen stijlsignalen:

- diepe petrolblauwe hoofdaccenten
- zachte zand- of steenkleurige oppervlakken
- een bescheiden roestoranje accent voor aandacht
- geen zwarte developer-dashboardlook
- geen felle gamingkleuren

## Iconen En Knoppen

Als een actie duidelijk en zonder verwarring herkenbaar is met alleen een icoon, dan krijgt een icon-only knop de voorkeur boven een tekstknop.

Goede kandidaten:

- terug
- sluiten
- bewerken
- verwijderen
- favoriet of pinnen als dat later bestaat

Niet bedoeld voor:

- primaire acties zoals `Tankbeurt toevoegen`
- primaire acties zoals `Rit toevoegen`
- primaire acties zoals `Onderhoud registreren`
- andere acties waarbij de betekenis sneller of veiliger duidelijk wordt met tekst

Belangrijke regels:

- gebruik alleen icon-only knoppen voor algemeen herkenbare acties
- als er twijfel mogelijk is, gebruik dan tekst of tekst + icoon
- icon-only knoppen krijgen altijd een duidelijke `aria-label`
- iconen moeten visueel rustig en consistent blijven, niet decoratief om het decoratieve

## Navigatieprincipes

### Desktop

Voorgestelde hoofdnavigatie:

- `Home`
- `Garage`
- `Ritten`
- `Kosten`
- `Onderhoud`
- `Overzicht`

Secundair:

- `Instellingen`

### Mobile

Mobiel blijft compacter.

Voorkeur:

- `Home` als primair anker
- snelle acties op `Home`
- andere views via launcher cards en contextsprongen
- geen drukke bottom nav met te veel items

## Selectie En Herkenbaarheid Van Brommers

Wanneer de gebruiker een brommer moet kiezen, tonen we indien beschikbaar:

- de hoofdfoto van de brommer
- de naam van de brommer
- bijkomende context zoals merk/model of nummerplaat

Belangrijke regel:

- een foto alleen is niet genoeg als identifier
- tekst blijft de primaire bron van duidelijkheid

## Kernconcepten

### 1. Brommer

Een brommer is de centrale entiteit van de app.

Een brommer heeft onder meer:

- naam of bijnaam
- merk
- model
- bouwjaar
- nummerplaat optioneel
- kilometerstand bij aankoop optioneel
- status actief of niet actief
- notities optioneel

De gebruiker kan meerdere brommers beheren.

### 2. Brommerfoto

Elke brommer kan in `v1` één hoofdfoto hebben.

De brommerfoto dient als:

- visuele herkenning in lijsten
- ondersteunende avatar in selecties
- duidelijke context in detailweergaves

Belangrijke regel:

- de brommerfoto vervangt nooit de tekstuele identificatie volledig
- naam en bijkomende context zoals merk, model of nummerplaat blijven zichtbaar

### 3. Kost

Een kost is elke uitgave die aan een brommer gekoppeld wordt.

Voorbeelden:

- benzine
- verzekering
- onderhoud
- onderdelen
- banden
- accessoires
- parking
- wasbeurt
- belasting
- andere

Een kost hoort in `v1` altijd bij exact een brommer.

### 4. Tankbeurt

Een tankbeurt is een speciale vorm van kost met extra velden.

Een tankbeurt bevat onder meer:

- datum
- brommer
- brandstoftype (`95`, `98` of `diesel`)
- totaalbedrag
- tankstation optioneel
- full tank ja of nee
- notitie optioneel

Tankbeurten tellen mee in het totale kostenoverzicht.

### 5. Rit

Een rit is een logboekitem in het tripjournal.

Een rit bevat onder meer:

- datum
- brommer
- titel of korte omschrijving
- vertrekpunt optioneel
- aankomstpunt optioneel
- afstand in km
- type rit optioneel
- duur optioneel
- notitie optioneel

### 6. Ritfoto

Elke rit kan in `v1` één optionele foto hebben.

De ritfoto dient als:

- persoonlijke herinnering in het tripjournal
- visuele verrijking in ritdetail
- extra context zonder de ritdata te vervangen

Belangrijke regel:

- de ritfoto is optioneel
- ritten blijven volledig bruikbaar zonder foto

### 7. Onderhoudsplan

Een onderhoudsplan beschrijft een terugkerende onderhoudstaak voor een brommer.

Voorbeelden:

- olie verversen elke `6 maanden`
- groot onderhoud elke `12 maanden`
- remcontrole elke `6 maanden`
- algemene servicecheck elke `3 maanden`

Een onderhoudsplan is in `v1` tijdsgebaseerd.
De gebruiker stelt dus zelf een interval in maanden in, bijvoorbeeld:

- elke `3 maanden`
- elke `6 maanden`
- elke `12 maanden`

### 8. Onderhoudsbeurt

Een onderhoudsbeurt is een uitgevoerde onderhoudsactie.

Ze bevat onder meer:

- brommer
- titel
- datum uitgevoerd
- gekoppeld onderhoudsplan optioneel
- kostbedrag optioneel
- notitie optioneel

Na registratie van een onderhoudsbeurt moet de app, waar mogelijk, de volgende onderhoud opnieuw berekenen.

## Data Model

## Tabellenoverzicht

V1 gebruikt deze kern-tabellen:

- `users`
- `sessions`
- `vehicles`
- `vehicle_photos`
- `trips`
- `trip_photos`
- `cost_entries`
- `maintenance_rules`
- `maintenance_events`

## 1. users

Doel:

- eigenaar-account voor een private app

Belangrijkste velden:

- `id`
- `email`
- `password_hash`
- `display_name`
- `created_at`
- `updated_at`

Belangrijke regels:

- `v1` ondersteunt enkel eenvoudige owner-scoped toegang
- geen team- of household-model in `v1`

## 2. sessions

Doel:

- login-sessies voor de owner

Belangrijkste velden:

- `id`
- `user_id`
- `token_hash`
- `expires_at`
- `last_seen_at`
- `created_at`

## 3. vehicles

Doel:

- brommers beheren

Belangrijkste velden:

- `id`
- `user_id`
- `name`
- `brand`
- `model`
- `year` nullable
- `license_plate` nullable
- `engine_cc` nullable
- `purchase_date` nullable
- `purchase_price` nullable
- `purchase_odometer_km` nullable
- `notes` nullable
- `is_active`
- `created_at`
- `updated_at`

Belangrijke regels:

- elke brommer hoort bij exact een gebruiker
- `purchase_odometer_km` is puur informatieve metadata
- inactieve brommers blijven zichtbaar in historiek en rapportage

## 4. vehicle_photos

Doel:

- hoofdfoto per brommer bewaren

Belangrijkste velden:

- `id`
- `user_id`
- `vehicle_id`
- `storage_key`
- `original_filename`
- `mime_type`
- `size_bytes`
- `width_px` nullable
- `height_px` nullable
- `created_at`
- `updated_at`

Belangrijke regels:

- in `v1` heeft een brommer maximaal één foto
- metadata staat in `Postgres`, het bestand zelf niet
- `vehicle_id` is uniek in deze tabel in `v1`

## 5. trips

Doel:

- ritten vastleggen in een persoonlijk tripjournal

Belangrijkste velden:

- `id`
- `user_id`
- `vehicle_id`
- `trip_date`
- `title`
- `start_location` nullable
- `end_location` nullable
- `distance_km`
- `ride_type` nullable
- `duration_minutes` nullable
- `notes` nullable
- `created_at`
- `updated_at`

Voorgestelde rittypes:

- `vrije_rit`
- `woon_werk`
- `boodschap`
- `onderhoud`
- `anders`

Belangrijke regels:

- een rit hoort bij exact een brommer
- `distance_km` is verplicht
- ritafstand wordt rechtstreeks door de gebruiker ingegeven
- ritten doen geen afleiding of berekening op basis van kilometerstand

## 6. trip_photos

Doel:

- optionele ritfoto per rit bewaren

Belangrijkste velden:

- `id`
- `user_id`
- `trip_id`
- `storage_key`
- `original_filename`
- `mime_type`
- `size_bytes`
- `width_px` nullable
- `height_px` nullable
- `created_at`
- `updated_at`

Belangrijke regels:

- in `v1` heeft een rit maximaal één foto
- metadata staat in `Postgres`, het bestand zelf niet
- `trip_id` is uniek in deze tabel in `v1`

## 7. cost_entries

Doel:

- alle uitgaven per brommer registreren

Belangrijkste velden:

- `id`
- `user_id`
- `vehicle_id`
- `entry_date`
- `cost_type`
- `title`
- `amount`
- `vendor_name` nullable
- `payment_method` nullable
- `notes` nullable
- `fuel_type` nullable
- `fuel_station` nullable
- `is_full_tank` nullable
- `linked_maintenance_event_id` nullable
- `created_at`
- `updated_at`

Voorgestelde kosttypes:

- `fuel`
- `insurance`
- `maintenance`
- `parts`
- `accessories`
- `tax`
- `parking`
- `washing`
- `fine`
- `other`

Voorgestelde betaalmethodes:

- `cash`
- `card`
- `bank`
- `other`

Belangrijke regels:

- een kost hoort bij exact een brommer
- `fuel_type` wordt alleen gebruikt voor `fuel`
- een kost van type `fuel` moet minstens brandstoftype en totaalbedrag bevatten
- een kost van type `maintenance` kan gekoppeld zijn aan een onderhoudsbeurt

## 8. maintenance_rules

Doel:

- terugkerende onderhoudsplannen beheren

Belangrijkste velden:

- `id`
- `user_id`
- `vehicle_id`
- `title`
- `rule_type`
- `interval_months`
- `last_completed_at` nullable
- `next_due_date` nullable
- `notes` nullable
- `is_active`
- `created_at`
- `updated_at`

Voorgestelde rule types:

- `time_based`

Belangrijke regels:

- een onderhoudsplan hoort bij exact een brommer
- `interval_months` is verplicht
- `next_due_date` wordt na elke relevante onderhoudsbeurt opnieuw berekend

## 9. maintenance_events

Doel:

- uitgevoerde onderhoudsbeurten bewaren

Belangrijkste velden:

- `id`
- `user_id`
- `vehicle_id`
- `maintenance_rule_id` nullable
- `title`
- `performed_at`
- `cost_amount` nullable
- `notes` nullable
- `created_at`
- `updated_at`

Belangrijke regels:

- een onderhoudsbeurt hoort bij exact een brommer
- een onderhoudsbeurt kan aan een onderhoudsplan gekoppeld zijn, maar dat is niet verplicht
- als `cost_amount` wordt ingevuld, moet de app een gekoppelde `cost_entry` van type `maintenance` aanmaken of bijwerken

## Afgeleide Waarden

De volgende waarden worden niet als bron van waarheid opgeslagen, maar afgeleid:

### Totale kosten per brommer

Afleiding:

- som van `cost_entries.amount` per brommer

### Totale benzinekosten

Afleiding:

- som van `cost_entries.amount` waar `cost_type = fuel`

### Totale onderhoudskosten

Afleiding:

- som van `cost_entries.amount` waar `cost_type = maintenance`

### Kosten per kilometer

Afleiding:

- `totale kosten / totale gereden kilometers`
- berekend per brommer of per geselecteerde periode

### Recente afstand

Afleiding:

- som van `trips.distance_km` in gekozen periode

### Brandstofkosten per type

Afleiding:

- som van `cost_entries.amount` gegroepeerd per `fuel_type`

### Volgende onderhoud

Afleiding:

- gebaseerd op actieve `maintenance_rules`
- gesorteerd op eerstvolgende datum

## Belangrijkste Businessregels

## Brommers

- elke brommer hoort bij exact een gebruiker
- een brommer kan actief of inactief zijn
- historische kosten en ritten blijven gekoppeld aan de brommer, ook als die inactief wordt

## Foto's En Media

- een brommer heeft in `v1` maximaal één hoofdfoto
- een rit heeft in `v1` maximaal één optionele foto
- foto's worden op persistente opslag bewaard, niet als blob in `Postgres`
- de database bewaart alleen metadata en verwijzingen
- brommerfoto's ondersteunen herkenning, maar vervangen tekstlabels niet
- verwijderen van een brommer of rit moet gekoppelde media netjes opruimen of markeren voor cleanup

## Kilometerstand

- `purchase_odometer_km` op brommerniveau is informatieve metadata
- deze waarde stelt de kilometerstand bij aankoop voor
- ritten gebruiken deze waarde niet voor automatische berekeningen
- de app leidt geen ritafstand, huidige kilometerstand of updateflow af uit ritten

## Ritten

- een rit hoort bij exact een brommer
- een rit moet minstens datum, brommer en afstand hebben
- ritten gebruiken geen begin- of eindkilometer voor afleidingen of validaties

## Kosten

- een kost hoort bij exact een brommer
- benzine is een kosttype met extra velden
- onderhoudskosten moeten zichtbaar zijn in zowel `Kosten` als `Onderhoud`

## Onderhoud

- een onderhoudsplan is in `v1` tijdsgebaseerd
- een uitgevoerde onderhoudsbeurt mag een onderhoudsplan updaten
- wanneer een onderhoudsbeurt aan een plan gekoppeld is, worden `last_completed_at` en `next_due_date` herberekend
- overdue onderhoud moet duidelijk zichtbaar zijn op `Home` en in `Onderhoud`

## Privacy En Toegang

- gegevens zijn owner-scoped
- `v1` bevat geen gedeelde toegang tussen meerdere accounts

## Rapportagevisie Voor V1

De app moet antwoord kunnen geven op vragen zoals:

- hoeveel heeft elke brommer deze maand gekost
- hoeveel geef ik uit aan benzine versus onderhoud
- hoeveel kilometer reed ik per brommer
- welke brommer is het duurst over de voorbije 12 maanden
- welke onderhoudsbeurten heb ik recent gedaan
- welke brommer moet het eerst binnen voor onderhoud

## Viewstructuur

## Home

Doel:

- dagelijkse cockpit voor snelle acties en aandachtspunten

Belangrijkste blokken:

- `Snelle acties`
- `Deze maand`
- `Binnenkort`
- `Recente ritten`
- `Aandacht`

Voorbeelden van inhoud:

- `Tankbeurt toevoegen`
- `Rit toevoegen`
- `Kost toevoegen`
- `Onderhoud registreren`
- totale kosten van deze maand
- benzinekosten van deze maand
- eerstvolgende onderhoud per brommer
- recent gereden kilometers
- brommers met overdue onderhoud

Desktoprichting:

- rustige command center layout
- duidelijke zones voor acties, huidige stand en aandacht

Mobilerichting:

- launcher-achtige cards
- 2 tot 4 kernsignalen eerst
- korte lijsten, geen zware tabellen

## Garage

Doel:

- brommers beheren en hun samenvatting bekijken

Desktoplayout:

- list-detail
- links een scanbare lijst van brommers
- rechts detail van de geselecteerde brommer

Linker pane toont per brommer:

- naam
- merk en model
- kilometerstand bij aankoop
- volgende onderhoud
- kosten deze maand

Rechter pane toont:

- kerninfo
- hoofdfoto van de brommer indien beschikbaar
- kilometerstand bij aankoop
- aankomend onderhoud
- recente tankbeurten
- recente ritten
- kostenverdeling

Belangrijke acties:

- `Nieuwe brommer`
- `Kilometerstand aanpassen`
- `Tankbeurt toevoegen`
- `Rit toevoegen`
- `Onderhoud registreren`

## Ritten

Doel:

- tripjournal beheren

Desktoplayout:

- links filters en quick add
- rechts rittenlijst of detail

Belangrijke functies:

- rit toevoegen
- filteren op brommer en periode
- detail van een rit openen
- notities en rittypes bekijken
- optioneel een ritfoto tonen in detail

Mobile:

- ritcards in plaats van brede tabellen
- detail opent als focuslaag

## Kosten

Doel:

- alle uitgaven snel kunnen invoeren en bekijken

Desktoplayout:

- links snelle invoer
- rechts recente kosten en filters

Belangrijke functies:

- tankbeurt registreren
- algemene kost registreren
- filter op categorie, brommer en periode
- totalen tonen per categorie

Belangrijke subgroepen:

- `Alles`
- `Benzine`
- `Onderhoud`
- `Vaste kosten`
- `Overig`

De view mag niet aanvoelen als boekhoudsoftware.
De nadruk ligt op snel registreren en snel begrijpen.

## Onderhoud

Doel:

- onderhoudsplannen en onderhoudshistoriek beheren

Desktoplayout:

- links actieve onderhoudsplannen en due items
- rechts detail of historiek

Belangrijke functies:

- onderhoudsplan toevoegen
- interval in maanden instellen, bijvoorbeeld `3`, `6` of `12`
- onderhoud registreren
- volgende onderhoud zien
- overdue taken herkennen

Belangrijke blokken:

- `Binnenkort`
- `Te laat`
- `Actieve plannen`
- `Recente onderhoudsbeurten`

## Overzicht

Doel:

- trends en vergelijkingen tonen

Voorbeelden:

- kosten per maand
- kosten per brommer
- kosten per categorie
- gereden kilometers per maand
- kost per kilometer
- benzinetrend

Deze view mag analytischer zijn dan `Home`, maar moet rustig en begrijpelijk blijven.

## Instellingen

Doel:

- account- en appvoorkeuren beheren

Voorbeelden:

- profiel
- wachtwoord
- valuta en datumformaat
- standaard brommer
- privacy-optie om bedragen te verbergen

## Acceptance Criteria Per View

## Home

- de gebruiker ziet zonder extra klik:
  - totale kosten deze maand
  - benzinekosten deze maand
  - eerstvolgende onderhoudstaak
  - minstens de 3 recentste ritten of een duidelijke lege staat
- de gebruiker kan vanaf `Home` in maximaal 1 klik starten met:
  - `Tankbeurt toevoegen`
  - `Rit toevoegen`
  - `Kost toevoegen`
  - `Onderhoud registreren`
- overdue onderhoud is visueel duidelijker dan gewone aankomende taken

## Garage

- de gebruiker kan meerdere brommers beheren zonder de context van de lijst te verliezen
- de geselecteerde brommer toont:
  - kilometerstand bij aankoop
  - hoofdfoto of fallback-avatar
  - kosten deze maand
  - volgende onderhoud
  - recente tankbeurten
  - recente ritten
- op mobile opent brommerdetail als aparte focuslaag of duidelijke vervolgstap
- selectors en lijsten tonen nooit alleen een foto zonder naam of context

## Ritten

- een rit kan toegevoegd worden met minimaal:
  - datum
  - brommer
  - afstand
- de gebruiker kan filteren op brommer en periode zonder complexe filterwand
- ritten zijn scanbaar op datum, brommer, afstand en korte omschrijving
- een ritdetail toont notities duidelijk
- ritten leiden geen afstand of andere waarden af uit kilometerstand
- een rit kan optioneel één foto bevatten
- een rit zonder foto blijft volledig bruikbaar en duidelijk

## Kosten

- een tankbeurt kan in minder velden ingevoerd worden dan een algemene kost
- de gebruiker kan kosten filteren op:
  - brommer
  - categorie
  - periode
- totalen per categorie zijn zichtbaar zonder naar een apart analytisch scherm te moeten
- onderhoudskosten blijven logisch zichtbaar in zowel `Kosten` als `Onderhoud`

## Onderhoud

- de gebruiker ziet duidelijk:
  - `Te laat`
  - `Binnenkort`
  - `Actieve plannen`
  - `Recente onderhoudsbeurten`
- de gebruiker kan het onderhoudsinterval zelf instellen in maanden
- een onderhoudsbeurt registreren kan optioneel ook een kost registreren
- na een onderhoudsbeurt wordt de volgende onderhoud automatisch herberekend wanneer er een gekoppeld plan bestaat

## Overzicht

- de gebruiker kan minstens deze analyses zien:
  - kosten per maand
  - kosten per brommer
  - kosten per categorie
  - gereden kilometers per periode
  - kost per kilometer
- grafieken of kaarten moeten telkens een duidelijke vraag beantwoorden, niet alleen decoratief zijn

## Instellingen

- de gebruiker kan zijn account beveiligen
- de gebruiker kan voorkeuren aanpassen zonder technische termen te zien
- instellingen blijven secundair en verstoren de dagelijkse flow niet

## Media Acceptance Criteria

- een brommer kan één hoofdfoto uploaden, vervangen en verwijderen
- als er geen brommerfoto is, toont de app een duidelijke fallback-avatar
- een rit kan één optionele foto uploaden, vervangen en verwijderen
- ongeldige bestandstypes krijgen een duidelijke foutmelding
- te grote bestanden krijgen een duidelijke foutmelding
- mediaweergave mag de kernflow van kosten, ritten en onderhoud niet blokkeren

## Kernflows

## 1. Eerste Setup

1. gebruiker maakt een account aan of voltooit de eerste owner-setup
2. gebruiker voegt de eerste brommer toe
3. app toont meteen een bruikbare lege `Home` met duidelijke volgende stappen
4. gebruiker kan kiezen om direct:
   - een tankbeurt
   - een rit
   - een onderhoudsplan
   toe te voegen

Succescriteria:

- binnen enkele minuten is de app bruikbaar zonder technische configuratie door de eindgebruiker

## 2. Tankbeurt Registreren

1. gebruiker kiest `Tankbeurt toevoegen`
2. gebruiker kiest brommer
3. gebruiker kiest `95`, `98` of `diesel` en vult datum en bedrag in
4. de flow blijft korter en sneller dan een algemene kost
5. na opslaan ziet de gebruiker de impact meteen in `Home`, `Garage` en `Kosten`

Succescriteria:

- benzine telt direct mee in kostenoverzichten
- de flow voelt sneller dan een algemene kost ingeven

## 3. Rit Toevoegen

1. gebruiker kiest `Rit toevoegen`
2. gebruiker kiest brommer en datum
3. gebruiker vult afstand in en optioneel titel, route of notities
4. app slaat de rit op in het tripjournal
5. `Home`, `Garage` en `Overzicht` tonen de nieuwe afstand mee

Succescriteria:

- een korte rit moet in minder dan een minuut ingevoerd kunnen worden

## 4. Onderhoudsplan Aanmaken En Uitvoeren

1. gebruiker maakt een onderhoudsplan aan, bijvoorbeeld `Olie verversen elke 6 maanden`
2. app berekent de eerstvolgende onderhoud op basis van huidige context
3. zodra onderhoud uitgevoerd is, registreert de gebruiker een onderhoudsbeurt
4. optioneel voegt de gebruiker meteen de kost toe of laat die automatisch koppelen
5. app werkt `last completed` en `next due` bij

Succescriteria:

- de gebruiker hoeft niet zelf opnieuw uit te rekenen wanneer de volgende onderhoud komt

## 5. Dagelijkse Controle

1. gebruiker opent `Home`
2. app toont wat nu aandacht vraagt
3. gebruiker springt vanuit een aandachtspunt direct naar de juiste brommer of onderhoudstaak
4. gebruiker handelt de taak af en ziet het signaal verdwijnen of verschuiven

Succescriteria:

- `Home` helpt kiezen wat nu belangrijk is in plaats van alleen cijfers te tonen

## Lege Staten En Eerste Ervaring

De eerste ervaring is belangrijk omdat de app persoonlijk en uitnodigend moet voelen.

De app moet in een lege staat helpen met:

- eerste brommer toevoegen
- eerste tankbeurt registreren
- eerste rit toevoegen
- eerste onderhoudsplan aanmaken

Lege schermen mogen dus niet koud of technisch aanvoelen.
Ze moeten telkens een duidelijke eerstvolgende stap tonen.

## Bouwklare Uitwerking Voor De Volgende Fase

### Doel Van Deze Fase

De eerstvolgende bouwfase zet de huidige starter om naar een eerste echt bruikbare private `v1`.

Deze fase is pas geslaagd wanneer:

- de owner zich kan opzetten en inloggen
- een brommer echt aangemaakt, bewerkt en gearchiveerd kan worden
- `Tankbeurt`, `Kost`, `Rit` en `Onderhoud` via echte formulieren opgeslagen kunnen worden
- `Home`, `Garage`, `Ritten`, `Kosten` en `Onderhoud` hun data uit `Postgres` halen
- zichtbare primaire knoppen en zichtbare filters ook echt werken
- brommerfoto en ritfoto echt opgeslagen en vervangen kunnen worden

### Niet-Onderhandelbare UX-Regels

- een primaire CTA opent altijd een echte route, modal, drawer of submitflow
- een zichtbaar filter verandert altijd de lijst of telling waar het naast staat
- statuslabels mogen er niet uitzien als klikbare primaire knoppen
- een formulier toont altijd een pending state tijdens submit
- een succesvolle mutatie eindigt altijd met zichtbare feedback
- een mislukte mutatie toont een duidelijke fout op veldniveau of formulierniveau
- mobile blijft het primaire ontwerpkader voor formulieren, lijsten en detailweergaven

### Beschermde Routes En Redirectgedrag

- als er nog geen owner-account bestaat, sturen beschermde routes door naar `/setup`
- zodra een owner-account bestaat, stuurt `/setup` door naar `/login` of `/`
- niet-ingelogde gebruikers worden voor beschermde routes doorgestuurd naar `/login`
- ingelogde gebruikers die `/login` opnieuw openen, worden doorgestuurd naar `/`
- `logout` wist de sessiecookie en stuurt door naar `/login`

### Route- En Schermmodel

De eerstvolgende bouwfase werkt minstens met deze routes:

- `/setup`
- `/login`
- `/`
- `/new`
- `/garage`
- `/garage/new`
- `/garage/[vehicleId]`
- `/garage/[vehicleId]/edit`
- `/trips`
- `/trips/new`
- `/trips/[tripId]`
- `/costs`
- `/costs/new`
- `/costs/new/fuel`
- `/maintenance`
- `/maintenance/rules/new`
- `/maintenance/events/new`
- `/settings`

Belangrijke route-afspraken:

- `/new` is alleen een launcher en geen dead end
- `Tankbeurt` gaat vanuit `Home` en `/new` rechtstreeks naar `/costs/new/fuel`
- `Kost` gaat rechtstreeks naar `/costs/new`
- `Rit` gaat rechtstreeks naar `/trips/new`
- `Onderhoud registreren` gaat rechtstreeks naar `/maintenance/events/new`
- `Onderhoudsplan toevoegen` zit op `/maintenance/rules/new`

### Gedrag Per Hoofdscherm In Deze Fase

#### Home

- toont echte aggregaties uit de database
- toont minstens de eerstvolgende onderhoudstaak, maandkosten, benzinekosten en recente ritten
- snelle acties linken naar echte invoerflows
- `Garage openen` linkt naar `/garage`
- `Alle ritten` linkt naar `/trips`

#### Garage

- toont een scanbare lijst van actieve brommers
- laat toe om een brommer toe te voegen via `/garage/new`
- laat toe om een brommer te openen via `/garage/[vehicleId]`
- laat toe om een brommer te bewerken via `/garage/[vehicleId]/edit`
- laat toe om een brommer te archiveren zonder historiek te verliezen

#### Ritten

- toont ritten gesorteerd op `trip_date desc`, daarna `created_at desc`
- laat een nieuwe rit toevoegen via `/trips/new`
- filters op deze pagina werken meteen echt
- een ritdetail op `/trips/[tripId]` toont notities, foto en kerngegevens

#### Kosten

- toont kosten gesorteerd op `entry_date desc`, daarna `created_at desc`
- toont een zichtbare ingang voor zowel `Tankbeurt` als algemene `Kost`
- algemene kost sluit `fuel` uit als categorie, omdat `fuel` een eigen flow heeft

#### Onderhoud

- groepeert plannen in `Te laat`, `Binnenkort` en `Op schema`
- laat een plan toevoegen via `/maintenance/rules/new`
- laat een onderhoudsbeurt registreren via `/maintenance/events/new`
- toont recente onderhoudsbeurten met eventuele gekoppelde kost

### Formulierdefinities

#### 1. Owner Setup

Velden:

- `display_name` verplicht
- `email` verplicht
- `password` verplicht
- `password_confirmation` verplicht

Validatie:

- `display_name` minimaal 2 tekens
- `email` moet syntactisch geldig zijn
- `password` minimaal 10 tekens
- `password_confirmation` moet gelijk zijn aan `password`
- setup faalt als er al een owner-account bestaat

Na succes:

- owner-account wordt aangemaakt
- eerste sessie wordt meteen gestart
- gebruiker wordt doorgestuurd naar `/garage/new`

#### 2. Login

Velden:

- `email`
- `password`

Validatie:

- beide velden verplicht
- ongeldige combinatie toont een generieke foutmelding

Na succes:

- sessiecookie wordt gezet
- gebruiker gaat naar `/`

#### 3. Brommer Aanmaken En Bewerken

Velden:

- `name` verplicht
- `brand` optioneel
- `model` optioneel
- `year` optioneel
- `license_plate` optioneel
- `engine_cc` optioneel
- `purchase_date` optioneel
- `purchase_price` optioneel
- `purchase_odometer_km` optioneel
- `notes` optioneel
- `vehicle_photo` optioneel

Validatie:

- `name` minimaal 2 en maximaal 80 tekens
- `year` is een positief jaartal binnen een realistisch bereik
- `engine_cc` is positief indien ingevuld
- `purchase_price` is `>= 0`
- `purchase_odometer_km` is `>= 0`
- upload valideert type, grootte en afbeeldingsmetadata server-side

Na succes:

- nieuwe brommer gaat naar `/garage/[vehicleId]`
- bewerken blijft op de detailpagina of keert terug naar de detailpagina
- lijst, home en selectors worden vernieuwd

#### 4. Tankbeurt Toevoegen

Velden:

- `vehicle_id` verplicht
- `entry_date` verplicht, standaard vandaag
- `fuel_type` verplicht met vaste keuzes `95`, `98` of `diesel`
- `amount` verplicht
- `fuel_station` optioneel
- `is_full_tank` optioneel
- `payment_method` optioneel
- `notes` optioneel
- `odometer_km` optioneel en puur informatief

Validatie:

- `amount > 0`
- `fuel_type` moet een geldige vaste keuze zijn
- `vehicle_id` moet naar een bestaande owner-brommer verwijzen
- `odometer_km`, indien ingevuld, is `>= 0`

Gedrag:

- submit maakt een `cost_entry` met `cost_type = fuel`
- na succes wordt teruggekeerd naar `/costs` of `/` met succesfeedback

#### 5. Algemene Kost Toevoegen

Velden:

- `vehicle_id` verplicht
- `entry_date` verplicht, standaard vandaag
- `cost_type` verplicht
- `title` verplicht
- `amount` verplicht
- `vendor_name` optioneel
- `payment_method` optioneel
- `notes` optioneel

Validatie:

- `cost_type` mag niet `fuel` zijn in deze flow
- `title` minimaal 2 tekens
- `amount > 0`

Gedrag:

- submit maakt een gewone `cost_entry`
- na succes worden `Home`, `Garage`, `Kosten` en eventueel `Overzicht` vernieuwd

#### 6. Rit Toevoegen

Velden:

- `vehicle_id` verplicht
- `trip_date` verplicht, standaard vandaag
- `distance_km` verplicht
- `title` optioneel
- `start_location` optioneel
- `end_location` optioneel
- `ride_type` optioneel
- `duration_minutes` optioneel
- `notes` optioneel
- `trip_photo` optioneel

Validatie:

- `distance_km > 0`
- `duration_minutes`, indien ingevuld, is `>= 0`
- ritfoto valideert type en grootte server-side

Gedrag:

- als `title` leeg is, mag de server een simpele standaardtitel genereren
- ritten gebruiken geen begin- of eindkilometer
- na succes wordt teruggekeerd naar `/trips` of `/trips/[tripId]`

#### 7. Onderhoudsplan Toevoegen Of Bewerken

Velden:

- `vehicle_id` verplicht
- `title` verplicht
- `interval_months` verplicht
- `last_completed_at` optioneel
- `next_due_date` conditioneel verplicht
- `notes` optioneel

Validatie:

- `interval_months` is een positief geheel getal
- als `last_completed_at` is ingevuld, berekent de app `next_due_date` automatisch
- als `last_completed_at` leeg is, moet de gebruiker `next_due_date` zelf invullen

Gedrag:

- gekoppelde brommer is owner-scoped
- na succes gaat de gebruiker terug naar `/maintenance`

#### 8. Onderhoudsbeurt Registreren

Velden:

- `vehicle_id` verplicht
- `maintenance_rule_id` optioneel
- `title` verplicht
- `performed_at` verplicht, standaard vandaag
- `workshop_name` optioneel
- `notes` optioneel
- `cost_amount` optioneel
- `cost_vendor_name` optioneel
- `cost_payment_method` optioneel

Validatie:

- `title` minimaal 2 tekens
- `cost_amount`, indien ingevuld, is `> 0`
- `maintenance_rule_id`, indien ingevuld, moet bij dezelfde brommer horen

Gedrag:

- submit maakt altijd een `maintenance_event`
- als `cost_amount` bestaat, maakt submit ook een gekoppelde `cost_entry`
- als er een gekoppeld plan bestaat, update submit `last_completed_at` en `next_due_date`
- dit gebeurt transactioneel

### Error-State Matrix Per Formulier

Deze matrix is verplicht voor de eerstvolgende bouwfase.

Elke formflow behandelt minstens deze fouttypes:

- `field_error`
- `form_error`
- `auth_error`
- `not_found`
- `conflict`
- `upload_error`
- `storage_error`
- `database_error`
- `unexpected_error`

Algemene regels:

- veldfouten verschijnen inline onder het betrokken veld
- formulierfouten verschijnen boven de submitknop
- auth- en routefouten gebruiken redirect of een duidelijke blokkerende melding
- onverwachte fouten tonen een veilige generieke melding zonder stacktrace
- een gebruiker mag na een fout nooit twijfelen of de submit wel of niet gelukt is

#### Matrix 1. Owner Setup

- `display_name` leeg of te kort
  - type: `field_error`
  - feedback: fout onder `display_name`
  - submit: geblokkeerd
- `email` ongeldig
  - type: `field_error`
  - feedback: fout onder `email`
  - submit: geblokkeerd
- `password` te kort
  - type: `field_error`
  - feedback: fout onder `password`
  - submit: geblokkeerd
- `password_confirmation` komt niet overeen
  - type: `field_error`
  - feedback: fout onder bevestigingsveld
  - submit: geblokkeerd
- owner-account bestaat al
  - type: `conflict`
  - feedback: formulierbrede melding
  - gedrag: link of redirect naar `/login`
- database niet bereikbaar
  - type: `database_error`
  - feedback: formulierbrede melding
  - gedrag: gebruiker kan opnieuw proberen
- onverwachte fout
  - type: `unexpected_error`
  - feedback: generieke foutmelding
  - gedrag: geen account of sessie half aangemaakt

#### Matrix 2. Login

- `email` of `password` leeg
  - type: `field_error`
  - feedback: inline fout per veld
  - submit: geblokkeerd
- ongeldige logincombinatie
  - type: `form_error`
  - feedback: generieke fout boven submit
  - gedrag: niet zeggen welk deel fout was
- sessiecookie kan niet gezet worden
  - type: `unexpected_error`
  - feedback: formulierbrede melding
  - gedrag: gebruiker blijft op `/login`
- database niet bereikbaar
  - type: `database_error`
  - feedback: formulierbrede melding
  - gedrag: retry mogelijk

#### Matrix 3. Brommer Aanmaken En Bewerken

- verplichte naam ontbreekt
  - type: `field_error`
  - feedback: inline onder `name`
- `year`, `engine_cc`, `purchase_price` of `purchase_odometer_km` ongeldig
  - type: `field_error`
  - feedback: inline onder betrokken veld
- brommer niet gevonden bij bewerken
  - type: `not_found`
  - feedback: schermbrede melding of `not found` state
  - gedrag: niet opslaan
- brommer hoort niet bij owner
  - type: `auth_error`
  - feedback: routeblokkade of `not found`
- foto heeft ongeldig type of grootte
  - type: `upload_error`
  - feedback: inline bij uploadveld
  - gedrag: overige velden blijven bewaard
- opslag van foto mislukt
  - type: `storage_error`
  - feedback: formulierbrede melding
  - gedrag: brommerrecord wordt niet half opgeslagen met kapotte fotoreferentie
- concurrente updateconflict
  - type: `conflict`
  - feedback: formulierbrede melding
  - gedrag: gebruiker moet nieuwste staat herladen
- databasefout
  - type: `database_error`
  - feedback: formulierbrede melding

#### Matrix 4. Tankbeurt Toevoegen

- brommer ontbreekt of is ongeldig
  - type: `field_error`
  - feedback: inline onder `vehicle_id`
- `amount <= 0`
  - type: `field_error`
  - feedback: inline onder `amount`
- `fuel_type` ontbreekt of is ongeldig
  - type: `field_error`
  - feedback: inline onder `fuel_type`
- `entry_date` ongeldig
  - type: `field_error`
  - feedback: inline onder datumveld
- brommer niet gevonden of niet van owner
  - type: `auth_error` of `not_found`
  - feedback: blokkeren met veilige melding
- submit dubbel verstuurd
  - type: `conflict`
  - feedback: tweede submit wordt client-side geblokkeerd
- databasefout tijdens insert
  - type: `database_error`
  - feedback: formulierbrede melding
  - gedrag: gebruiker weet dat de tankbeurt niet bevestigd is

#### Matrix 5. Algemene Kost Toevoegen

- ontbrekende brommer
  - type: `field_error`
  - feedback: inline
- `cost_type` ontbreekt of is `fuel`
  - type: `field_error`
  - feedback: inline onder `cost_type`
- `title` te kort
  - type: `field_error`
  - feedback: inline onder `title`
- `amount <= 0`
  - type: `field_error`
  - feedback: inline onder `amount`
- brommer niet gevonden of niet van owner
  - type: `auth_error` of `not_found`
  - feedback: blokkerende melding
- databasefout
  - type: `database_error`
  - feedback: formulierbrede melding

#### Matrix 6. Rit Toevoegen

- brommer ontbreekt
  - type: `field_error`
  - feedback: inline
- `distance_km <= 0`
  - type: `field_error`
  - feedback: inline onder `distance_km`
- `duration_minutes < 0`
  - type: `field_error`
  - feedback: inline onder `duration_minutes`
- ritfoto ongeldig type of grootte
  - type: `upload_error`
  - feedback: inline bij foto
  - gedrag: tekstvelden blijven staan
- opslag van ritfoto mislukt
  - type: `storage_error`
  - feedback: formulierbrede melding
  - gedrag: rit wordt niet bevestigd met kapotte fotoverwijzing
- brommer niet gevonden of niet van owner
  - type: `auth_error` of `not_found`
  - feedback: blokkerende melding
- databasefout
  - type: `database_error`
  - feedback: formulierbrede melding

#### Matrix 7. Onderhoudsplan Toevoegen Of Bewerken

- `title` ontbreekt
  - type: `field_error`
  - feedback: inline
- `interval_months <= 0`
  - type: `field_error`
  - feedback: inline onder intervalveld
- `last_completed_at` leeg en `next_due_date` ontbreekt
  - type: `field_error`
  - feedback: inline onder `next_due_date`
- datumvelden ongeldig
  - type: `field_error`
  - feedback: inline onder betrokken datumveld
- brommer niet gevonden of niet van owner
  - type: `auth_error` of `not_found`
  - feedback: blokkerende melding
- conflict met ondertussen gedeactiveerd plan
  - type: `conflict`
  - feedback: formulierbrede melding
- databasefout
  - type: `database_error`
  - feedback: formulierbrede melding

#### Matrix 8. Onderhoudsbeurt Registreren

- `vehicle_id` ontbreekt
  - type: `field_error`
  - feedback: inline
- `title` te kort
  - type: `field_error`
  - feedback: inline onder `title`
- `performed_at` ongeldig
  - type: `field_error`
  - feedback: inline onder datumveld
- `cost_amount <= 0`
  - type: `field_error`
  - feedback: inline onder kostveld
- `maintenance_rule_id` hoort niet bij de gekozen brommer
  - type: `field_error`
  - feedback: inline of formulierbrede melding
- databasefout tijdens transactionele write
  - type: `database_error`
  - feedback: formulierbrede melding
  - gedrag: noch `maintenance_event`, noch gekoppelde `cost_entry` mag half blijven bestaan
- conflict of stale state tijdens planupdate
  - type: `conflict`
  - feedback: formulierbrede melding
  - gedrag: gebruiker herlaadt de nieuwste staat

### Lijst- En Filtergedrag

#### Garage

- standaard sorteert `Garage` op actieve brommers eerst, daarna alfabetisch op naam
- een archived of inactive brommer verdwijnt niet uit historiek
- een afzonderlijke toggle `Actief` of `Alles` is toegestaan, maar mag pas zichtbaar zijn als die ook echt werkt

#### Ritten

- minimumfilters in deze fase:
  - brommer
  - periode
- periode biedt minstens:
  - `Alles`
  - `Deze maand`
  - `Laatste 30 dagen`
  - `Laatste 3 maanden`
- filters updaten:
  - de lijst
  - het aantal ritten
  - de totale afstand in de huidige selectie
- een lege filtercombinatie toont een echte lege staat en geen lege witte ruimte

#### Kosten

- minimumfilters in deze fase:
  - brommer
  - categorie
  - periode
- filters updaten:
  - de lijst
  - totalen
  - categorieblokken in de huidige selectie

#### Onderhoud

- grouping op status is leidend
- `Te laat` staat altijd boven `Binnenkort`
- een gekoppelde brommer is meteen zichtbaar in elke regel

### Validatie, Feedback En Pending States

- verplichte velden tonen inline foutfeedback onder het veld
- serverfouten tonen een formulierbrede fout boven de submitknop
- submitknoppen worden disabled tijdens pending state
- dubbele submits worden actief geblokkeerd
- een succesvolle submit toont een korte succesmelding of duidelijke redirect
- een mislukte upload toont duidelijke feedback zonder de rest van het formulier te wissen

### Codebasebrede Error-Handling Standaard

Error handling moet in deze codebase als een kernkwaliteit behandeld worden, niet als afwerking.

#### 1. Errorcategorieën

Alle fouten vallen in minstens één van deze categorieën:

- `validation`
- `authentication`
- `authorization`
- `not_found`
- `conflict`
- `upload`
- `storage`
- `database`
- `external_service`
- `unexpected`

#### 2. Standaardvorm Voor Mutatieresultaten

Server actions en route handlers geven bij voorkeur een gestandaardiseerd resultaat terug:

- `ok`
- `data`
- `fieldErrors`
- `formError`
- `errorCode`
- `retryable`
- `redirectTo`
- `successMessage`

Werkafspraken:

- geen losse string-returns als foutprotocol
- geen silent failures
- geen stacktraces of ruwe databasefouten naar de eindgebruiker
- foutcodes zijn stabiel genoeg om UI-beslissingen op te nemen

#### 3. UI-Regels

- elke submitflow heeft een pending state
- elke foutbare async actie heeft een zichtbare foutstaat
- lege states en error states zijn visueel onderscheidbaar
- retrybare fouten tonen een duidelijke herprobeeractie
- niet-retrybare fouten tonen wat de gebruiker nu best doet
- icon-only acties krijgen ook foutfeedback die zonder hover begrijpelijk blijft

#### 4. Server-Regels

- alle owner-scoped writes controleren eigenaarschap server-side
- alle databasewrites vangen bekende constraintfouten af en vertalen ze naar domeinfouten
- transacties rollen altijd volledig terug bij een fout
- bestandsuploads schrijven geen blijvende metadata weg voordat opslag succesvol bevestigd is
- cleanup van vervangen bestanden gebeurt pas na geslaagde commit of via veilige async cleanup

#### 5. Logging En Observability

- elke `unexpected`, `database`, `storage` of `external_service` fout wordt server-side gelogd
- logs bevatten minstens:
  - timestamp
  - route of action
  - owner id indien beschikbaar
  - entity id indien relevant
  - stabiele `errorCode`
- gevoelige waarden zoals wachtwoorden, sessietokens en ruwe cookies komen nooit in logs

#### 6. Route- En Paginafouten

- beschermde routes gebruiken expliciete redirectlogica voor authfouten
- `not found` voor resources van andere users lekt geen bestaan van die resource
- pagina's met dataqueries hebben een duidelijke error UI en indien gepast een retry
- globale renderfouten gebruiken een veilige globale error boundary

#### 7. Bestandsuploads

- client valideert vroeg op type en grootte voor snelle feedback
- server valideert altijd opnieuw en is leidend
- bij mislukte upload blijft de rest van het formulier intact
- orphaned files worden vermeden via transactielogica of cleanup jobs

#### 8. Definition Of Done Voor Error Handling

Een flow is niet klaar zolang:

- een fout de gebruiker in twijfel laat of data opgeslagen is
- een fout alleen in de console zichtbaar is
- een bekende databasefout als generieke crash eindigt
- een uploadfout de rest van het formulier wist
- een conflict of authfout een technisch lek naar de UI geeft

### Error Code Catalog

De codebase gebruikt een vaste error code catalog zodat UI, server actions, logs en monitoring hetzelfde foutbeeld delen.

Werkafspraken:

- elke `formError` of blokkerende serverfout krijgt indien mogelijk een `errorCode`
- errorcodes zijn stabiel en in hoofdletters met underscore-notatie
- errorcodes zijn domeinspecifiek genoeg voor de UI, maar lekken geen interne implementatiedetails
- nieuwe foutcodes worden alleen toegevoegd als bestaande codes semantisch niet passen
- foutcodes worden hergebruikt in:
  - server action responses
  - route handler responses
  - server logs
  - toast- en formulierfeedback

#### 1. Auth En Sessie

- `AUTH_SETUP_ALREADY_COMPLETED`
  - setup geprobeerd terwijl owner-account al bestaat
- `AUTH_INVALID_CREDENTIALS`
  - logincombinatie ongeldig
- `AUTH_SESSION_REQUIRED`
  - gebruiker is niet ingelogd voor een beschermde route of mutatie
- `AUTH_SESSION_EXPIRED`
  - sessie bestaat niet meer of is verlopen
- `AUTH_FORBIDDEN`
  - gebruiker heeft geen toegang tot de gevraagde resource
- `AUTH_LOGOUT_FAILED`
  - logout kon sessie niet correct afsluiten

#### 2. Validatie Algemeen

- `VALIDATION_FAILED`
  - generieke formuliervalidatie is mislukt
- `VALIDATION_REQUIRED_FIELD`
  - verplicht veld ontbreekt
- `VALIDATION_INVALID_EMAIL`
  - e-mailadres ongeldig
- `VALIDATION_INVALID_DATE`
  - datumveld ongeldig
- `VALIDATION_INVALID_NUMBER`
  - numeriek veld ongeldig
- `VALIDATION_NEGATIVE_NUMBER`
  - waarde moet positief of nul zijn
- `VALIDATION_NON_POSITIVE_NUMBER`
  - waarde moet strikt groter zijn dan nul
- `VALIDATION_ENUM_VALUE_INVALID`
  - waarde valt buiten toegelaten lijst

#### 3. Garage En Brommers

- `VEHICLE_NOT_FOUND`
  - brommer niet gevonden
- `VEHICLE_NAME_REQUIRED`
  - naam ontbreekt of is te kort
- `VEHICLE_YEAR_INVALID`
  - jaartal buiten realistisch bereik
- `VEHICLE_ENGINE_CC_INVALID`
  - cilinderinhoud ongeldig
- `VEHICLE_PURCHASE_PRICE_INVALID`
  - aankoopprijs ongeldig
- `VEHICLE_PURCHASE_ODOMETER_INVALID`
  - kilometerstand bij aankoop ongeldig
- `VEHICLE_ALREADY_ARCHIVED`
  - archiveactie uitgevoerd op reeds gearchiveerde brommer
- `VEHICLE_CONFLICT`
  - brommergegevens zijn verouderd of conflicteren met recente wijziging

#### 4. Kosten En Tankbeurten

- `COST_NOT_FOUND`
  - kostrecord niet gevonden
- `COST_TYPE_INVALID`
  - kosttype ongeldig voor deze flow
- `COST_AMOUNT_INVALID`
  - bedrag ontbreekt of is niet geldig
- `FUEL_TYPE_INVALID`
  - brandstoftype ontbreekt of is niet geldig
- `FUEL_FLOW_REQUIRES_FUEL_TYPE`
  - tankbeurtflow kreeg een niet-brandstoftype
- `GENERAL_COST_FLOW_DISALLOWS_FUEL`
  - algemene kostflow kreeg `fuel`
- `COST_VEHICLE_MISMATCH`
  - kost probeert te schrijven naar ongeldige of niet-toegankelijke brommer

#### 5. Ritten

- `TRIP_NOT_FOUND`
  - rit niet gevonden
- `TRIP_DISTANCE_INVALID`
  - afstand ontbreekt of is niet geldig
- `TRIP_DURATION_INVALID`
  - duur is ongeldig
- `TRIP_VEHICLE_REQUIRED`
  - brommer ontbreekt voor rit
- `TRIP_CONFLICT`
  - rit is intussen gewijzigd of conflictueert met andere write

#### 6. Onderhoud

- `MAINTENANCE_RULE_NOT_FOUND`
  - onderhoudsplan niet gevonden
- `MAINTENANCE_EVENT_NOT_FOUND`
  - onderhoudsbeurt niet gevonden
- `MAINTENANCE_INTERVAL_INVALID`
  - interval in maanden ongeldig
- `MAINTENANCE_NEXT_DUE_REQUIRED`
  - volgende datum ontbreekt waar die verplicht is
- `MAINTENANCE_RULE_VEHICLE_MISMATCH`
  - onderhoudsplan hoort niet bij gekozen brommer
- `MAINTENANCE_COST_INVALID`
  - kostbedrag bij onderhoud ongeldig
- `MAINTENANCE_TRANSACTION_FAILED`
  - onderhoudsbeurt plus gekoppelde kost konden niet atomair opgeslagen worden
- `MAINTENANCE_CONFLICT`
  - plan of event werd intussen gewijzigd

#### 7. Uploads En Bestandsopslag

- `UPLOAD_MISSING_FILE`
  - geen bestand ontvangen
- `UPLOAD_FILE_TOO_LARGE`
  - bestand overschrijdt maximumgrootte
- `UPLOAD_FILE_TYPE_INVALID`
  - mime type of extensie niet toegestaan
- `UPLOAD_IMAGE_METADATA_INVALID`
  - bestand is geen bruikbare afbeelding
- `UPLOAD_VEHICLE_PHOTO_REJECTED`
  - brommerfoto geweigerd na validatie
- `UPLOAD_TRIP_PHOTO_REJECTED`
  - ritfoto geweigerd na validatie
- `STORAGE_WRITE_FAILED`
  - bestand kon niet naar persistente opslag geschreven worden
- `STORAGE_DELETE_FAILED`
  - bestaand bestand kon niet veilig verwijderd worden
- `STORAGE_REFERENCE_CONFLICT`
  - metadata en opslagreferentie lopen niet correct gelijk

#### 8. Database En Infrastructuur

- `DB_CONNECTION_FAILED`
  - database niet bereikbaar
- `DB_QUERY_FAILED`
  - query faalde zonder beter domeinalternatief
- `DB_CONSTRAINT_VIOLATION`
  - unieke of relationele constraint geschonden
- `DB_TRANSACTION_FAILED`
  - transactie faalde en werd teruggerold
- `MIGRATION_FAILED`
  - migrationrun faalde
- `HEALTHCHECK_FAILED`
  - app of database healthcheck faalde

#### 9. Generieke Fallback Codes

- `RESOURCE_NOT_FOUND`
  - generieke not-found wanneer geen specifieke resourcecode past
- `CONFLICT_DETECTED`
  - generieke conflictcode
- `EXTERNAL_SERVICE_FAILED`
  - fout in externe dienst of provider
- `UNEXPECTED_ERROR`
  - veilige fallback voor onvoorziene fouten

#### 10. Gebruik In De UI

De UI hoeft niet voor elke code een uniek scherm te bouwen, maar gebruikt de catalog wel voor consistente feedback.

Aanbevolen mapping:

- `AUTH_*`
  - redirect of blokkerende authmelding
- `VALIDATION_*`
  - inline veldfeedback waar mogelijk
- `*_NOT_FOUND`
  - `not found` state of veilige terugval naar lijst
- `*_CONFLICT`
  - herlaad- of retryboodschap
- `UPLOAD_*` en `STORAGE_*`
  - uploadspecifieke feedback bij het betrokken veld of bestand
- `DB_*` en `UNEXPECTED_ERROR`
  - generieke formulierbrede melding met retry waar passend

### Data-, Query- En Revalidatieafspraken

- elke hoofdview krijgt een eigen server-side data loader
- `Home` haalt geaggregeerde data op via een `home-data` service
- `Garage` haalt lijst- en detaildata op via `vehicles-data`
- `Ritten` haalt lijst- en detaildata op via `trips-data`
- `Kosten` haalt lijst- en totalendata op via `costs-data`
- `Onderhoud` haalt rule-, event- en signal-data op via `maintenance-data`
- server actions voeren writes uit
- succesvolle writes doen minstens `revalidatePath` voor alle direct getroffen schermen

### Verwachte Schema-Aanscherpingen Voor De Eerstvolgende Migrations

De huidige starterdatabase moet eerst in lijn gebracht worden met dit document voordat echte CRUD gebouwd wordt.

Minimumdoelen voor de eerstvolgende migrations:

- `vehicles` bevat alle velden uit dit specdocument, inclusief `is_active`
- `vehicle_photos` en `trip_photos` volgen de eenduidige `max 1 foto in v1` regel
- `cost_entries` bevat alle brandstofvelden:
  - `fuel_type`
  - `fuel_station`
  - `is_full_tank`
- `cost_entries` bevat een link naar gekoppeld onderhoud als die bestaat
- `maintenance_events` gebruikt de definitieve velden `performed_at`, `workshop_name` en `cost_amount`
- alle owner-scoped tabellen hebben correcte foreign keys en indexes

Concreet resultaat:

- de database past bij de doel-flow van de formulieren
- we hoeven tijdens de CRUD-implementatie geen domeinlogica rond de database heen te improviseren

### Teststrategie En Definition Of Done Voor Deze Fase

Automatisch:

- `npm run typecheck`
- `npm run build`
- `npm run db:migrate`
- minstens een CI-run tegen verse `Postgres`

Handmatige smoke tests:

- fresh install zonder owner stuurt naar `/setup`
- owner setup maakt account en logt in
- brommer aanmaken werkt
- brommer bewerken werkt
- tankbeurt toevoegen werkt en is zichtbaar in `Home` en `Kosten`
- rit toevoegen werkt en is zichtbaar in `Home` en `Ritten`
- onderhoudsplan toevoegen werkt
- onderhoudsbeurt met kost werkt en is zichtbaar in `Onderhoud` en `Kosten`
- brommerfoto upload werkt
- ritfoto upload werkt
- filters in `Ritten` en `Kosten` veranderen de lijst echt

Definition of done voor deze fase:

- geen zichtbare primaire CTA zonder echte bestemming
- geen zichtbare filter zonder echt effect
- geen kernview gebruikt nog vaste hardcoded demo-data
- alle kernflows werken op mobile zonder horizontaal breken

## Implementatierichting

## Database

- `Postgres` als bron van waarheid
- draait volledig in Docker, lokaal en in productie
- gebruikt de officiële `postgres` image
- krijgt een named volume voor persistente opslag
- draait op een intern Docker-netwerk met de app
- wordt in productie standaard niet publiek blootgesteld
- vraagt een aparte backupstrategie, want een volume alleen is geen backup

## Migrations

Schemawijzigingen worden niet beheerd via één grote mutable `schema.sql` file als runtimebron van waarheid.

De voorkeursrichting is:

- een `migrations/` map met oplopende SQL-files
- bijvoorbeeld `0001_init.sql`, `0002_add_trip_type.sql`
- een `schema_migrations` tabel in `Postgres`
- een migratierunner die openstaande files exact één keer toepast
- een snapshotbestand zoals `schema.sql` mag bestaan voor leesbaarheid, maar is niet leidend

Belangrijke afspraken:

- elke schemawijziging krijgt een nieuwe migration file
- bestaande migrations worden niet stilzwijgend aangepast zodra ze toegepast kunnen zijn
- migrations moeten transactioneel uitgevoerd worden waar mogelijk
- de migratierunner gebruikt best een lock, bijvoorbeeld `pg_advisory_lock`, om race conditions te vermijden

Aanbevolen scripts:

- `npm run db:up`
- `npm run db:down`
- `npm run db:migrate`
- `npm run db:init`
- `npm run db:seed`
- `npm run db:reset`

Praktische betekenis:

- `db:migrate` past openstaande migrations toe
- `db:init` is bedoeld voor een verse lokale database
- `db:seed` laadt voorbeelddata voor development
- `db:reset` is alleen voor bewuste lokale resetflows, niet voor productie
- demo- of seeddata wordt nooit automatisch in productie geladen

## Media En Bestandsopslag

Bestanden worden in `v1` niet in `Postgres` opgeslagen.

De voorkeursrichting is:

- bestandsopslag op persistente filesystem-opslag
- metadata en verwijzingen in `Postgres`
- uploads buiten de build-image houden

Aanbevolen structuur:

- `uploads/vehicles/<vehicleId>/<uuid>.webp`
- `uploads/trips/<tripId>/<uuid>.webp`

Aanbevolen validaties:

- alleen `jpg`, `png` en `webp`
- duidelijke maximale bestandsgrootte, bijvoorbeeld `10 MB`
- server-side normalisatie naar een webvriendelijk formaat

Belangrijke regels:

- bestandsnamen mogen niet blind vertrouwd worden
- de server valideert mime type en grootte
- uploadfouten moeten duidelijke gebruikersfeedback geven

## Backup En Restore

`v1` moet een eenvoudige maar echte backupstrategie hebben.

Minimumafspraken:

- een Docker volume alleen telt niet als backup
- productie maakt periodieke `pg_dump` backups
- backups worden buiten de live containeropslag bewaard
- restore moet minstens één keer getest zijn vóór de app als stabiele productie-app beschouwd wordt

Aanbevolen `v1` aanpak:

- dagelijkse `pg_dump` van de productie-database
- retentie van meerdere recente backups
- een korte restoretest op een aparte tijdelijke database of omgeving

Minimaal runbook:

1. stop geen volume-backups blind zonder te weten wat je terugplaatst
2. maak of gebruik een recente `pg_dump` backup
3. start een lege of tijdelijke `postgres` databasecontainer
4. herstel de dump in die database
5. valideer dat tabellen, migratiestatus en kernflows werken
6. wijs pas daarna de app naar de herstelde database als dat echt nodig is

Operationele succescriteria:

- je kunt een databaseverlies herstellen zonder handmatig tabellen te reconstrueren
- je weet welke backup het laatst bruikbaar is
- je weet hoe lang een restore ongeveer duurt

Aanvullende media-backupafspraken:

- uploaded media hoort mee in de backupstrategie
- naast `pg_dump` hoort ook de upload-opslag periodiek geback-upt te worden
- een restoretest moet ook controleren of brommer- en ritfoto's nog correct gekoppeld zijn
- het herstel van database en upload-opslag moet als één samenhangende operationele flow beschouwd worden

## Serverlaag

Voorgestelde services:

- `src/lib/server/db.ts`
- `vehicles-data.ts`
- `vehicle-photos-data.ts`
- `trips-data.ts`
- `trip-photos-data.ts`
- `costs-data.ts`
- `maintenance-data.ts`
- `home-data.ts`
- `insights-data.ts`

De serverlaag gebruikt directe `pg`-toegang.
Geen browser-side databaseclient en geen databasecalls rechtstreeks vanuit de UI.

## UI-laag

De app gebruikt een view-driven workspace met een duidelijke shell en menselijke navigatie.

Mogelijke top-level state:

- `activeView = home | garage | trips | costs | maintenance | insights | settings`

Componentarchitectuur:

- views blijven composities van kleinere `React` componenten
- generieke of herhaalbare UI wordt niet gekopieerd maar geëxtraheerd
- vermijd monolithische bestanden waarin layout, formulierlogica, lijstweergave en detailgedrag allemaal samenkomen
- componenten mogen zowel view-specifiek als gedeeld bestaan, zolang hun verantwoordelijkheid duidelijk blijft

## Componentstructuur

De frontend organiseert componenten minstens in deze denkrichtingen:

- gedeelde UI-componenten
  - kaarten
  - knoppen
  - form sections
  - list rows
  - detail panels
  - action bars
  - empty states
- view-specifieke componenten
  - `Home`
  - `Garage`
  - `Ritten`
  - `Kosten`
  - `Onderhoud`
  - `Overzicht`
- server- en datamodules
  - database helpers
  - domeinservices
  - mutatielogica

Belangrijke regel:

- dezelfde UI of logica op meerdere plaatsen betekent normaal dat er een gedeelde component of module hoort te bestaan

## Deploylaag

De deploylaag volgt expliciet een image-first model.

Belangrijke afspraken:

- development draait lokaal via `npm run dev`
- kwaliteitscontrole gebeurt in CI
- productie-images worden in `GitHub Actions` gebouwd
- `Portainer` pullt alleen images uit de registry
- productiehosts krijgen geen repo-clone of lokale buildverplichting
- `Portainer` runt ook de `postgres` service via dezelfde stack
- schemawijzigingen worden door een migratierun binnen de stack toegepast
- uploads draaien op persistente storage buiten de app-image
- backups moeten zowel database als uploads meenemen

Aanbevolen scripts:

- `npm run local`
- `npm run check`
- `npm run build`
- `npm run db:up`
- `npm run db:down`
- `npm run db:migrate`
- `npm run db:init`
- `npm run docker:build`
- `npm run docker:up`
- `npm run release:verify`

## Mutaties

Mutaties verlopen bij voorkeur via gerichte server actions.

Werkafspraken:

- elke zichtbare create- of editflow heeft een eigen mutatie
- een mutatie schrijft alleen owner-scoped data
- een mutatie retourneert een voorspelbaar resultaatobject
- een mutatie triggert daarna de nodige revalidatie

Aanbevolen return contract:

- `ok`
- `fieldErrors`
- `formError`
- `redirectTo`
- `successMessage`

Kernmutaties voor deze fase:

- `createOwnerAction`
- `loginOwnerAction`
- `logoutOwnerAction`
- `createVehicleAction`
- `updateVehicleAction`
- `archiveVehicleAction`
- `setVehiclePhotoAction`
- `deleteVehiclePhotoAction`
- `createFuelEntryAction`
- `createCostEntryAction`
- `createTripAction`
- `updateTripAction`
- `setTripPhotoAction`
- `deleteTripPhotoAction`
- `createMaintenanceRuleAction`
- `updateMaintenanceRuleAction`
- `toggleMaintenanceRuleAction`
- `createMaintenanceEventAction`

## Kritieke transacties

De volgende acties moeten transactioneel gebeuren:

- onderhoud registreren met kost
  - `maintenance_event` aanmaken
  - gekoppelde `cost_entry` aanmaken of updaten
  - bij gekoppeld plan de volgende onderhoud herberekenen

- brommer verwijderen of deactiveren
  - historiek bewaren
  - referentiele integriteit respecteren

- brommerfoto vervangen
  - nieuwe metadata opslaan
  - oude referentie veilig vervangen
  - cleanup van het oude bestand na geslaagde commit

- ritfoto vervangen
  - nieuwe metadata opslaan
  - oude referentie veilig vervangen
  - cleanup van het oude bestand na geslaagde commit

## Aanbevolen Eerste Implementatiefase

### Fase 0 - Schema En Runtime In Lijn Brengen

1. starterdatabase aligneren met het doelmodel in dit document
2. ontbrekende velden voor `cost_entries`, `maintenance_events` en `vehicles` via migrations toevoegen
3. lokale scripts `db:up`, `db:migrate`, `db:init`, `db:seed` en `db:reset` afronden
4. uploadmap en lokale persistente opslag structureren

Deliverable:

- een verse lokale machine kan de database en app bootstrapen zonder handmatig schemawerk

### Fase 1 - Owner Setup En Auth

1. `/setup` bouwen
2. `/login` bouwen
3. sessiebeheer, auth-redirects en logout implementeren
4. owner-only toegang afdwingen op alle hoofdviews

Deliverable:

- de app is privé bruikbaar door exact één owner-account

### Fase 2 - Brommer CRUD

1. `/garage`, `/garage/new`, `/garage/[vehicleId]` en `/garage/[vehicleId]/edit` bouwen
2. create, edit en archive voor brommers implementeren
3. brommerfoto upload, vervanging en verwijdering implementeren
4. selectors en lege staten aan de echte data koppelen

Deliverable:

- de gebruiker kan minstens één echte brommer volledig beheren

### Fase 3 - Kosten En Tankbeurten

1. `/costs` bouwen op echte querydata
2. `/costs/new` bouwen voor algemene kosten
3. `/costs/new/fuel` bouwen voor tankbeurten
4. categorie- en periodefilters werkend maken
5. `Home` en `Garage` laten meevernieuwen na submit

Deliverable:

- kosten en tankbeurten zijn de eerste volledig bruikbare dagelijkse flow

### Fase 4 - Ritten

1. `/trips`, `/trips/new` en `/trips/[tripId]` bouwen op echte data
2. ritformulier bouwen
3. ritfoto upload, vervanging en verwijdering toevoegen
4. brommer- en periodefilters echt maken

Deliverable:

- het tripjournal is bruikbaar zonder demo-data

### Fase 5 - Onderhoud

1. `/maintenance` bouwen op echte data
2. `/maintenance/rules/new` bouwen
3. `/maintenance/events/new` bouwen
4. transactielogica voor onderhoud plus gekoppelde kost implementeren
5. `next_due_date` en statusherberekening afwerken

Deliverable:

- onderhoudssignalen, plannen en uitgevoerde beurten werken end-to-end

### Fase 6 - Home En Overzicht

1. `Home` volledig op geaggregeerde data zetten
2. `Overzicht` op echte periodes, totalen en grafiekdata zetten
3. snelle acties, lege staten en cross-links nalopen

Deliverable:

- `Home` is een echte cockpit en geen prototype-landing

### Fase 7 - Hardening En Productie

1. CI, build en image-release finaliseren
2. uploadvolume, databasevolume en migratierun in `compose.deploy.yaml` nalopen
3. smoke deploy in `Portainer` uitvoeren
4. backup- en restore-runbook testen
5. rollback op vorige image-tag controleren

Deliverable:

- een eerste productieklare `v1` deployflow

## Samenvatting

`Brommerlog` wordt een eindgebruikergerichte webapp voor brommerbezitters met focus op:

- kostenoverzicht
- benzinebeheer
- tripjournal
- onderhoudsopvolging
- eenvoudige media-ondersteuning voor brommers en ritten

De kernrelaties zijn:

- een `vehicle` is de brommer
- een `vehicle_photo` bewaart de metadata van de hoofdfoto van een brommer
- een `trip` bewaart ritten
- een `trip_photo` bewaart de metadata van een optionele ritfoto
- een `cost_entry` bewaart uitgaven, inclusief benzine
- een `maintenance_rule` bewaart onderhoudsplannen
- een `maintenance_event` bewaart uitgevoerde onderhoudsbeurten

De belangrijkste productkeuzes zijn:

- meerdere brommers ondersteunen
- `Home` als dagelijkse cockpit gebruiken
- onderhoud zichtbaar en proactief maken
- benzine als aparte snelle flow behandelen
- de app laten aanvoelen als persoonlijke assistent in plaats van adminpaneel
- productie image-based releasen via `GitHub Actions` naar `Portainer`
- de database als Dockerized `Postgres` service meedraaien in de stack
- schemawijzigingen via migrations beheren in plaats van handmatige database-edits
- media op persistente opslag bewaren en niet in de database zelf

Dit document is de functionele en technische bron van waarheid voor `v1`.
