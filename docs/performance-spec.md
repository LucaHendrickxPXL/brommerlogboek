# Performance Spec

Status: voorstel, nog niet geimplementeerd  
Datum: 23 april 2026  
Scope: harde performance-verbetering voor de volledige app, met focus op mobile-first gebruik

## 1. Doel

De app moet snel aanvoelen voor een gewone eigenaar die vooral op gsm werkt. Performance is geen nice-to-have of eindpolish, maar een producteigenschap.

De gebruiker moet het gevoel hebben dat:

- schermen snel openen
- formulieren direct bruikbaar zijn
- navigatie niet "zwaar" voelt
- data zonder merkbare vertraging verschijnt
- de app ook met veel ritten, kosten en onderhoud rustig blijft

## 2. Kernprincipe

Deze app optimaliseert voor:

- snelle perceptie
- weinig wachttijd
- weinig overbodige data
- weinig client-JavaScript
- weinig database-roundtrips
- snelle mobiele flows

Niet voor:

- maximale technische flexibiliteit ten koste van snelheid
- "een generieke datahelper voor alles"
- zware schermen die alle informatie tegelijk ophalen
- desktop-first schermen die mobiel worden "samengedrukt"

## 3. Belangrijke nuance: dev versus productie

Performance moet op twee manieren bekeken worden:

### 3.1 Development performance

Dit gaat over:

- hoe snel `next dev` start
- hoe snel routes in dev de eerste keer compilen
- hoe vlot de feedbackloop is tijdens bouwen

### 3.2 Product performance

Dit gaat over:

- hoe snel een echte gebruiker de app ervaart
- serverresponstijd
- payloadgrootte
- aantal requests
- hoeveelheid client-JS
- hoeveel data boven de vouw meteen geladen wordt

Belangrijke regel:

- een trage eerste hit in `next dev` is geen betrouwbare maat voor productieperformance
- het is wel nuttige feedback over codegewicht, dynamiek en compilecomplexiteit

## 4. Huidige codebase: concrete observaties

### 4.1 Bijna alle hoofdschermen zijn `force-dynamic`

In de huidige codebase zijn nagenoeg alle app-routes expliciet `force-dynamic`. Daardoor:

- wordt serverrendering steeds opnieuw afgedwongen
- vallen caching- en hergebruikmogelijkheden grotendeels weg
- groeit de kans op trage TTFB bij elke navigatie

Dit is vandaag zichtbaar in onder meer:

- `src/app/page.tsx`
- `src/app/costs/page.tsx`
- `src/app/trips/page.tsx`
- `src/app/maintenance/page.tsx`
- `src/app/garage/page.tsx`
- bijna alle create/edit/detail routes

### 4.2 Auth doet meerdere DB-checks per request

`requireAppUser()` in `src/server/auth.ts` doet momenteel:

- `getUserCount()`
- `getCurrentUser()`

Daardoor kost zelfs een simpele auth-gate meer databasewerk dan nodig.

### 4.3 Home gebruikt zware screen-level datahelpers voor een samenvattingsscherm

`src/server/home.ts` haalt nu tegelijk op:

- `listGarageVehiclesForUser`
- `listTripsForUser`
- `getCostsPageData`
- `getMaintenancePageData`

Dat is functioneel correct, maar niet performant. Het home-scherm gebruikt maar een deel van die data:

- bij ritten worden nu alle ritten opgehaald, terwijl `Home` alleen `tripCount` en de laatste 3 ritten nodig heeft
- bij kosten wordt een volledige kostenlijst opgehaald, terwijl `Home` enkel maandtotalen gebruikt
- bij onderhoud wordt bredere paginadata opgehaald, terwijl `Home` vooral actieve aandachtspunten nodig heeft

Dit is vandaag een van de duidelijkste structurele bottlenecks.

### 4.4 Screen-level fetchers worden hergebruikt waar route-specifieke fetchers nodig zijn

De code hergebruikt nu vaak helpers die voor een volledig scherm zijn bedoeld, ook op plekken waar alleen samenvattingsdata nodig is.

Dat leidt tot:

- meer querywerk
- grotere serialisatie
- meer serverwerk per request
- minder duidelijke performancegrenzen per route

### 4.5 Er zitten onnodige client-kosten in de globale app-shell

`src/app/providers.tsx` laadt vandaag:

- Mantine provider
- Dates provider
- `QueryClientProvider` van `@tanstack/react-query`

Op dit moment wordt `react-query` in de app praktisch nog niet gebruikt voor echte client-fetching. Dat betekent:

- extra dependency
- extra client-JS
- extra providercomplexiteit
- zonder duidelijke huidige opbrengst

### 4.6 De globale layout is client-side

`src/components/layout/app-frame.tsx` is een client component. Dat is niet automatisch fout, maar het betekent wel:

- globale navigatiechrome draagt client-kost op elke pagina
- de shell moet daarom extreem lean blijven

### 4.7 Form routes halen soms meer context op dan strikt nodig

Voorbeeld:

- `/costs/new/fuel` haalt zowel desktop-form data als mobile-card data op

Dat is begrijpelijk voor UX, maar vanuit performance moeten create-routes tot de lichtste schermen van de hele app behoren.

### 4.8 De homepage doet relatief veel losse DB-rondes

Vandaag ontstaat voor `/` ongeveer dit patroon:

- auth-checks
- garage query
- trips query
- costs queries
- maintenance queries

Daardoor is de homepage een van de duurste paden in de app, terwijl het net het dagelijkse startscherm is.

## 5. Prestatievisie per schermtype

Niet elk scherm hoeft even zwaar of even realtime te zijn. Daarom krijgt elk schermtype een duidelijke performance-intentie.

### 5.1 Summary screens

Voorbeelden:

- `/`
- delen van `/overview`

Regel:

- alleen samenvattingsdata boven de vouw
- geen volledige lijsten als een top-3 of aggregaat volstaat

### 5.2 List screens

Voorbeelden:

- `/costs`
- `/trips`
- `/maintenance`
- `/garage`

Regel:

- laad alleen eerste venster of eerste relevante set
- filters en sortering mogen niet standaard alle historische data vereisen

### 5.3 Detail screens

Voorbeelden:

- `/garage/[vehicleId]`
- `/trips/[tripId]`

Regel:

- laad detaildata specifiek voor dat entity-id
- laad gerelateerde data beperkt en doelgericht

### 5.4 Form screens

Voorbeelden:

- `/costs/new/fuel`
- `/costs/new`
- `/trips/new`
- `/maintenance/events/new`

Regel:

- form routes moeten extreem licht zijn
- alleen opties laden die nodig zijn om het formulier direct bruikbaar te maken
- geen extra analytische of niet-essentiele context

### 5.5 Analytics screens

Voorbeelden:

- `/overview`

Regel:

- mag zwaarder zijn dan een form of home
- maar bovenste samenvatting moet snel komen
- diepere analyses mogen ondergeschikt of progressief opgebouwd zijn

## 6. Harde performance-doelen

Deze doelen gelden voor productiegedrag, niet voor de eerste compile in `next dev`.

### 6.1 TTFB-doelen

Voor een warm systeem en normale lokale of nabijgelegen hosting:

- auth redirect routes: server response doel `<= 150ms` p50
- lichte form routes: server response doel `<= 250ms` p50
- home route: server response doel `<= 350ms` p50
- zwaardere lijst- of overzichtspagina's: server response doel `<= 500ms` p50

### 6.2 Query-budget per route

- auth gate: doel maximaal `1` primaire DB-hit in het warme pad
- home: doel maximaal `3` gerichte datafetches naast auth
- form create routes: doel maximaal `2` datafetches naast auth
- detail routes: doel maximaal `3` fetchgroepen naast auth

### 6.3 Data-volume budget

- home haalt geen volledige historische rittenlijst op
- home haalt geen volledige kostenlijst op
- home haalt geen inactieve onderhoudslijsten op tenzij expliciet nodig
- create routes laden geen data die alleen desktop of alleen latere stappen nodig hebben, tenzij die dataset ook voor de andere variant efficient genoeg is

### 6.4 Client bundle-budget

Doel:

- globale gedeelde client-JS blijft zo klein mogelijk
- elke nieuwe client dependency moet aantoonbaar functionele winst geven
- geen library meegeven aan alle routes als slechts 1 scherm ze nodig heeft

### 6.5 Perceptie-doelen

- bovenste inhoud van `Home` moet snel zichtbaar zijn
- snelle invoerflows moeten direct bruikbaar voelen
- primary CTA's moeten zonder merkbare vertraging reageren
- navigatie mag niet "even hangen" voor eenvoudige schermen

## 7. Harde architectuurregels

### Regel 1

Nieuwe routes krijgen geen `force-dynamic` zonder expliciete reden.

### Regel 2

Een page-level fetcher mag niet automatisch een full-screen fetcher hergebruiken als die pagina maar een samenvatting nodig heeft.

### Regel 3

`Home` haalt alleen summary-shaped data op.

Concreet:

- trip count via een tellende query of licht aggregaat
- recente ritten apart en beperkt
- kosten als maandaggregaten
- onderhoud als actieve aandachtspunten

### Regel 4

Auth moet in het warme pad zo weinig mogelijk databasewerk doen.

### Regel 5

Create-routes zijn performancekritisch en moeten tot de lichtste routes van de app behoren.

### Regel 6

Elke client component moet een duidelijke interactiereden hebben.

### Regel 7

Globale providers blijven minimaal.

Als een provider niet aantoonbaar nodig is voor meerdere routes, hoort die niet standaard rond de volledige app.

### Regel 8

Lijstschermen laden geen onbeperkte historische datasets als de UI initieel maar een deel toont.

### Regel 9

Boven-de-vouw content krijgt voorrang op volledige datacompleetheid.

### Regel 10

Mobiele flows krijgen prioriteit boven desktop-luxe.

## 8. Doelarchitectuur voor data-ophaalgedrag

### 8.1 Datahelpers per intentie

Er moeten aparte datahelpers bestaan voor:

- `summary`
- `list`
- `detail`
- `form-options`
- `analytics`

Niet alles mag onder een brede page-data helper vallen.

### 8.2 Route-specifieke fetchers

Voorbeelden van gewenste richting:

- `getHomeSummaryData`
- `getFuelEntryCreateOptions`
- `getGarageListData`
- `getVehicleDetailData`
- `getOverviewAnalyticsData`

Elke helper levert alleen wat die route nodig heeft.

### 8.3 Shared DB-kost beperken

Waar meerdere stukjes data voor een scherm nodig zijn:

- voorkom overmatige chaining van aparte screen fetchers
- combineer gericht waar dat zinvol is
- hergebruik bij voorkeur een page-level samengestelde querylaag

### 8.4 Revalidatie blijft write-driven

De huidige write-flows gebruiken al `revalidatePath(...)`. Dat blijft goed, maar moet gekoppeld worden aan:

- small, targeted read-shapes
- korte en voorspelbare renderpaden

## 9. Route-classificatie voor optimalisatie

### P0 routes

Deze routes bepalen het gevoel van de hele app en krijgen absolute prioriteit:

- `/`
- `/login`
- `/costs/new/fuel`
- `/trips/new`
- `/costs/new`
- `/maintenance/events/new`

### P1 routes

- `/garage`
- `/costs`
- `/trips`
- `/maintenance`
- `/garage/[vehicleId]`

### P2 routes

- `/overview`
- edit-routes
- settings

## 10. Grootste concrete verbeterpunten per domein

### 10.1 Auth

Huidig probleem:

- meerdere checks per request

Doel:

- warm auth-pad compacter
- minder querywerk voor simpele redirects en protected routes

### 10.2 Home

Huidig probleem:

- fan-out naar meerdere bredere datahelpers
- te veel data voor een samenvattingsscherm

Doel:

- home wordt een echte summary route
- alleen top-signalen, aggregaten en top-3 items

### 10.3 Kosten en ritten

Huidig probleem:

- helpers halen volledige lijsten waar dat niet altijd nodig is

Doel:

- lijstschermen werken met beperkte initiele datasets
- tellingen en totalen krijgen eigen lichte queries

### 10.4 Onderhoud

Huidig probleem:

- page-data en home-data zijn nog te weinig gescheiden

Doel:

- home gebruikt alleen actieve waarschuwingen
- onderhoudspagina blijft rijker, maar hoeft niet het home-pad te vertragen

### 10.5 Form routes

Huidig probleem:

- sommige create-routes laden extra context die niet strikt noodzakelijk is

Doel:

- forms openen sneller dan overzichtsschermen
- alleen directe formopties en defaults

### 10.6 Client bundle

Huidig probleem:

- globale providers en libraries zijn nog niet streng genoeg geevalueerd op echte noodzaak

Doel:

- minder globale client overhead
- route- en interactiegebonden clientcode waar mogelijk

## 11. Concrete budgets voor deze app

### 11.1 Home

- geen volledige `trips` lijst
- geen volledige `cost_entries` lijst
- geen `inactiveRules`
- geen `events` lijst
- maximaal 3 recente items per relevante sectie

### 11.2 Fuel quick add

- route moet direct bruikbaar zijn
- voertuigkeuze en form defaults zijn ok
- geen niet-noodzakelijke analytics of brede context

### 11.3 Kostenlijst en rittenlijst

- eerste render op lijstvenster
- verdere verdieping alleen wanneer nodig

### 11.4 Garage

- lijst en detail scheiden qua data-intentie
- desktop list-detail mag niet automatisch dezelfde zware data op mobiel afdwingen

## 12. Client-side discipline

### 12.1 Alleen client waar nodig

Voorbeelden van legitiem clientgebruik:

- formulierinteractie
- stateful mobile quick-add flows
- toasts
- upload previews

### 12.2 Niet standaard client

Geen client component alleen omdat:

- het makkelijker voelt
- state misschien later handig wordt
- een provider al bestond

### 12.3 Provider discipline

Globale providers moeten:

- aantoonbaar nodig zijn
- meerdere routes bedienen
- moeilijk lokaal in te kapselen zijn

## 13. Development performance-doelen

Hoewel productperformance de hoofdzaak is, krijgt development ook harde regels:

- root-layout en globale imports blijven klein
- compilegewicht in de shell blijft laag
- grote, weinig gebruikte dependencies worden vermeden
- build- en devwaarschuwingen rond tracing of onbedoeld brede imports worden actief opgevolgd

Belangrijke nuance:

- eerste route-compile in `next dev` mag merkbaar trager zijn dan een warme route
- dat is normaal
- maar extreem trage eerste hits blijven een signaal dat routes of globale imports te zwaar zijn

## 14. Meetstrategie

Performanceverbetering wordt alleen geldig verklaard als ze meetbaar is.

### 14.1 Meten per route

Minstens meten voor:

- `/`
- `/login`
- `/costs/new/fuel`
- `/costs`
- `/garage`
- `/maintenance`

### 14.2 Minstens registreren

- totale responstijd
- aandeel `next.js`
- aandeel `application-code`
- aantal DB-queries
- payload-vorm van de route
- gebruikte datahelpers

### 14.3 Productiebaseline boven devgevoel

De belangrijkste vergelijking is:

- voor optimalisatie versus na optimalisatie
- in productiebuild of productieachtige omgeving

Niet:

- enkel subjectief "het voelt sneller"

## 15. Gefaseerde uitvoer

### Fase 0: Baseline en meetpunten

Doel:

- per kernroute huidige laadtijd en querypad vastleggen

### Fase 1: Auth en home

Doel:

- auth-pad compacter maken
- home ombouwen naar echte summary route

Verwachte winst:

- grootste directe snelheidswinst in dagelijkse ervaring

### Fase 2: Form routes

Doel:

- create-routes extreem lean maken
- mobile quick flows als snelle entrypoints behandelen

Verwachte winst:

- app voelt sneller bij dagelijks gebruik

### Fase 3: List screens

Doel:

- kosten, ritten, onderhoud en garage initieel minder data laten ophalen

### Fase 4: Client bundle cleanup

Doel:

- providers, dependencies en client-boundaries opschonen

### Fase 5: Advanced polish

Doel:

- progressive disclosure
- slimmere prefetch
- gerichte cache- en invalidatiestrategie

## 16. Acceptatiecriteria

De performance-aanpak is pas geslaagd als het volgende waar is:

- `Home` gebruikt geen full-screen datahelpers meer voor data die het niet toont
- auth doet minder werk per request dan vandaag
- create-routes zijn merkbaar lichter dan overzichtsschermen
- er is een duidelijke routeclassificatie tussen summary, list, detail, form en analytics
- nieuwe routes krijgen geen automatische `force-dynamic`
- globale client providers zijn kritisch geevalueerd
- datavolume en queryvolume zijn per route bewust begrensd
- performance wordt op route-niveau gemeten en niet op gevoel alleen

## 17. Expliciete niet-doelen

Deze spec gaat niet over:

- premature micro-optimisaties in losse componenten
- complexe client caching als vervanging voor slanke serverpaden
- een volledige technische herbouw van de app
- performance ten koste van duidelijkheid of correctheid

## 18. Beslisregel voor toekomstige features

Elke nieuwe feature moet vooraf een antwoord hebben op deze vragen:

1. Welk schermtype is dit: summary, list, detail, form of analytics?
2. Welke data is boven de vouw echt nodig?
3. Hoeveel queries mag deze route kosten?
4. Moet dit echt client-side zijn?
5. Welke bestaande route wordt hierdoor potentieel trager?

Als die vragen niet beantwoord zijn, is de feature nog niet performance-klaar.
