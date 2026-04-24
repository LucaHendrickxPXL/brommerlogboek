# Brommerlog Webapp Brief

## Productdoel

Deze webapp wordt een rustige, persoonlijke garage-assistent voor iemand met een of meerdere brommers.

De app helpt om op een eenvoudige manier:

- alle kosten bij te houden
- tankbeurten te registreren
- ritten te loggen in een tripjournal
- onderhoud op te volgen
- op tijd te zien wanneer de volgende onderhoudsbeurt nodig is

De app moet aanvoelen als een hulpmiddel voor een gewone eigenaar, niet als een developer tool, spreadsheet of adminpaneel.

## V1 Moet Toelaten Om

- meerdere brommers te beheren
- per brommer een duidelijk totaaloverzicht van kosten te zien
- benzinekosten, verzekering, onderhoud, onderdelen en andere kosten te registreren
- ritten met datum, afstand en notities bij te houden
- tijdsgebaseerde onderhoudsplannen aan te maken met een instelbaar interval in maanden
- uitgevoerde onderhoudsbeurten te registreren
- snel te zien welke brommer binnenkort onderhoud nodig heeft
- maand- en jaartotalen te bekijken
- kosten per brommer en per categorie te vergelijken

## V1 Randvoorwaarden

- eenvoudige owner-scoped login
- focus op een enkele eigenaar, geen multi-user huishouden in `v1`
- mobiele invoer moet even belangrijk zijn als desktopgebruik
- de app wordt mobile-first ontworpen
- gsm is de primaire gebruiksvorm
- een sterke mobiele UI is dus een must
- de app gebruikt duidelijke, menselijke taal
- de app blijft rustig en overzichtelijk, ook wanneer er veel ritten en kosten zijn
- een duidelijke en herhaalbare dev-naar-prod flow is verplicht
- productie draait image-based via `Portainer`, niet via builds op de host
- de database draait volledig via Docker in een eigen `Postgres` container
- schemawijzigingen moeten beheerd worden via migrations, niet via losse handmatige edits

## UX Richting

De app voelt als:

- een persoonlijk logboek
- een onderhoudsassistent
- een compacte garage-overzichtspagina

Niet als:

- boekhoudsoftware
- fleet management software
- een generiek CRUD-dashboard

Belangrijke UX-keuzes:

- `Home` is het dagelijkse startpunt
- snelle acties zoals `Tankbeurt toevoegen` en `Rit toevoegen` staan centraal
- lijsten zijn scanbaar en compact
- mobiele schermen gebruiken kaarten en focuslagen in plaats van brede tabellen
- de navigatie gebruikt gewone woorden zoals `Ritten`, `Kosten` en `Onderhoud`

## Tech Stack

De app volgt dezelfde algemene stackrichting als de andere moderne webapps in deze workspace:

- `Next.js App Router`
- `React`
- `TypeScript`
- `Mantine`
- `TanStack Query`
- `Postgres`
- `pg` voor server-side database toegang
- officiële `postgres` Docker image voor lokale en productie-database
- `Docker` voor lokale en deelbare runtime
- `GitHub Actions` voor CI en image builds
- een container registry voor productie-images
- `Portainer` als productie-runtime

Frontendarchitectuur-afspraak:

- omdat de app met `React` gebouwd wordt, werken we component-based
- het is niet de bedoeling om volledige schermen of grote stukken UI in één file te stoppen
- er wordt expliciet van uitgegaan dat componenten op meerdere plaatsen in de app herbruikt kunnen worden
- gedeelde patronen zoals kaarten, formulieren, lijstitems, detailpanelen, actiebalken en lege staten horen dus als aparte componenten opgebouwd te worden waar dat logisch is

## Belangrijkste Productkeuzes

- meerdere brommers zijn first-class in het datamodel
- kostenoverzicht en onderhoudsopvolging zijn even belangrijk als het rittenlogboek
- benzine krijgt een eigen invoerflow, maar telt mee in het totale kostenoverzicht
- onderhoud is in `v1` tijdsgebaseerd en werkt met een instelbaar maandinterval
- `Home` toont vooral signalen, aandachtspunten en snelle acties
- `Overzicht` is bedoeld voor trends en vergelijkingen, niet voor dagelijkse invoer
- productie deploys gebruiken vooraf gebouwde images uit CI
- `Portainer` pullt images uit de registry in plaats van lokaal te builden
- runtime-secrets blijven buiten git en buiten de image
- `migrations/` wordt de bron van waarheid voor schemawijzigingen
- de productie-stack bevat zowel de app als een `Postgres` service met persistente volume-opslag

## Volgende Bouwfase

De eerstvolgende bouwfase moet de huidige starter omzetten naar een eerste echt bruikbare `v1`.

Deze fase levert minstens op:

- werkende owner-setup en login
- echte `Garage` CRUD voor brommers
- werkende formulieren voor `Tankbeurt`, `Kost`, `Rit` en `Onderhoud`
- de tankbeurtflow blijft bewust eenvoudig: `brandstoftype + bedrag`, zonder liters of prijs per liter
- `Home`, `Garage`, `Ritten`, `Kosten` en `Onderhoud` op echte databasegegevens
- brommerfoto en ritfoto met persistente opslag
- zichtbare filters en knoppen die ook echt werken
- geen dode CTA's of nep-interacties in de UI

De werkafspraak is dus:

- zichtbare primaire acties openen altijd een echte flow
- zichtbare filters reageren altijd echt op de lijst die erbij hoort
- statuslabels mogen niet op actieknoppen lijken
- foutafhandeling moet door de hele codebase consequent en van hoog niveau zijn
- UI, server en logging gebruiken daarvoor dezelfde stabiele foutcodes
- de app mag in deze fase minder features hebben, maar wat getoond wordt moet wel echt werken

## Belangrijkste Views

- `Home`
- `Garage`
- `Ritten`
- `Kosten`
- `Onderhoud`
- `Overzicht`

## Deploy En Runtime Afspraken

- lokale development blijft buiten Docker waar dat sneller werkt
- lokale database draait via `docker compose`
- productie gebruikt een image-based deployflow
- `GitHub Actions` valideert code en bouwt images
- productie-images krijgen een immutable tag per release
- `Portainer` gebruikt bij voorkeur een gepinde releasetag voor gecontroleerde deploys
- een bewegende tag zoals `prod` mag bestaan voor gemak, maar is niet de veiligste standaard
- runtimeconfiguratie gebeurt via `Portainer` env-vars of secrets
- de image zelf blijft zo environment-neutraal mogelijk
- healthchecks en eenvoudige rollback moeten vanaf `v1` mee voorzien worden
- de `Postgres` container gebruikt een named volume en een interne Docker-netwerkverbinding
- de databasepoort wordt in productie standaard niet publiek gepubliceerd
- schemawijzigingen lopen via een migratierun in de deployflow
- migrations moeten bij voorkeur achterwaarts-veilige of additieve wijzigingen gebruiken zodat rollback realistisch blijft

## Knowledge Base Eerst

Bij verdere keuzes rond UX en schermopbouw kijken we eerst naar de relevante notas in `../knowledge-base/`.

Belangrijke referenties:

- `../knowledge-base/product/ux-ui/2026-03-31-dashboard-ux.md`
- `../knowledge-base/product/ux-ui/2026-04-01-mobile-first-design-for-data-heavy-finance-apps.md`
- `../knowledge-base/product/ux-ui/navigation/2026-04-01-list-detail-and-supporting-pane-layouts.md`

## Detaildocument

De volledige functionele en technische bron van waarheid voor `v1` staat in:

- `docs/v1-spec.md`
