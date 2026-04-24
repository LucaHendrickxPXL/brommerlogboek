# Multi-User Auth En Data-Isolatie Spec

Status: voorstel, nog niet geimplementeerd  
Datum: 24 april 2026  
Scope: de app omzetten van single-owner naar meerdere zelfstandige gebruikersaccounts

## 1. Samenvatting

De app stopt met werken als een prive-tool voor exact een eigenaar-account en wordt een gewone accountgebaseerde applicatie:

- meerdere gebruikers kunnen een eigen account aanmaken
- elke gebruiker logt in met eigen credentials
- elke gebruiker ziet alleen eigen brommers, ritten, kosten, onderhoud en statistieken
- er komt voorlopig geen adminpagina en geen beheerscherm voor andere gebruikers

Belangrijke nuance:

- dit is geen team- of garage-sharing model
- dit is ook geen huishoudmodel
- elke account is volledig gescheiden van de andere accounts

## 2. Waarom

De huidige app heeft al veel user-scoped serverlogica, maar het productgedrag is nog single-owner:

- er is een eerste setup-flow
- de copy spreekt over `owner`
- de app gaat ervan uit dat er maar een eerste account mag bestaan
- de v1-spec noemt multi-user nog buiten scope

Dat botst met het nieuwe gebruiksdoel:

- jij bent niet de enige gebruiker
- andere mensen moeten gewoon zelf kunnen inloggen
- niemand mag data van iemand anders kunnen zien of aanpassen

## 3. Doelen

- meerdere gebruikersaccounts toelaten zonder adminlaag
- alle data hard isoleren per gebruiker
- onboarding vereenvoudigen naar normale registratie en login
- bestaande sessie-aanpak behouden waar die al goed werkt
- bestaande domeinflows behouden zonder gedeelde data of complexe rechtenstructuur

## 4. Niet-doelen

- geen adminpaneel
- geen rolensysteem
- geen gebruikersbeheer door andere gebruikers
- geen gedeelde garages of gedeelde brommers
- geen invites
- geen organisaties, teams of households
- geen permissieniveaus zoals viewer/editor
- geen publieke profielen
- geen e-mailverificatie als harde eerste vereiste
- geen password reset flow in deze fase, tenzij later apart gespecificeerd

## 5. Productbeslissing

### 5.1 Nieuwe accountfilosofie

De app wordt:

- multi-user
- private by default
- account-per-persoon

Elke gebruiker heeft een volledig eigen dataset.

### 5.2 Geen admin

Er is bewust geen adminpagina.

Dat betekent:

- geen gebruikerslijst in de UI
- geen user impersonation
- geen accountbeheer van anderen
- geen apart backoffice

Operationele accountingrepen gebeuren voorlopig alleen direct in de database of via toekomstige supportflows, niet via de app-UI.

### 5.3 Geen gedeelde data

Data wordt niet gedeeld tussen accounts.

Dus:

- brommers zijn eigendom van exact een gebruiker
- ritten horen indirect bij exact een gebruiker via de brommer
- kosten horen indirect bij exact een gebruiker via de brommer
- onderhoudsplannen en onderhoudsevents horen indirect bij exact een gebruiker via de brommer
- uploads volgen diezelfde eigendomslijn

## 6. Huidige situatie in deze codebase

De codebase is al deels voorbereid op user-isolatie:

- `users` en `sessions` bestaan al
- `vehicles` heeft al `user_id`
- server actions werken al via `requireAppUser()`
- veel queries controleren al op `user_id`

De grootste huidige beperking zit niet in de basisdata, maar in de productflow:

- `createInitialOwner`
- `/setup`
- `createOwnerAction`
- `loginOwnerAction`
- `logoutOwnerAction`
- copy en schermnamen rond `owner`

Belangrijke conclusie:

- dit is geen volledige auth-herbouw
- dit is een product- en toegangsmodelmigratie bovenop een al bruikbare users/sessions-basis

## 7. Functionele scope

## 7.1 Nieuwe publieke auth-routes

De app krijgt deze publieke auth-routes:

- `/login`
- `/register`

De route `/setup` verdwijnt uit de normale productflow.

### Gewenst gedrag

- niet-ingelogde gebruiker kan naar `/login`
- niet-ingelogde gebruiker kan naar `/register`
- ingelogde gebruiker wordt weggeleid van beide routes naar `/`

## 7.2 Registratie

Een nieuwe gebruiker kan zelfstandig een account aanmaken.

Minimaal vereist:

- naam
- e-mailadres
- wachtwoord
- wachtwoordbevestiging

Na succesvolle registratie:

- gebruiker krijgt meteen een sessie
- gebruiker wordt naar de eerste relevante private flow gestuurd
- voorkeur: `/garage/new`

## 7.3 Login

Login blijft functioneel vergelijkbaar met nu:

- e-mailadres
- wachtwoord
- sessiecookie

Belangrijke wijziging:

- de logica en copy verwijzen niet langer naar `owner`
- login is voor gewone gebruikersaccounts

## 7.4 Logout

Logout blijft beschikbaar in `Instellingen`.

De semantiek verandert niet:

- huidige sessie ongeldig maken
- cookie verwijderen
- terug naar `/login`

## 7.5 Eerste gebruiker

De eerste gebruiker is niet speciaal.

Dat betekent:

- er bestaat geen `initial owner` concept meer in productgedrag
- de eerste registratie gebruikt dezelfde flow als elke latere registratie
- er wordt geen exclusieve eerste-account bescherming meer afgedwongen

## 8. UX-flow

## 8.1 Niet-ingelogde gebruiker

Niet-ingelogde gebruiker op private route:

- redirect naar `/login`

Op loginpagina:

- duidelijke CTA naar `Account aanmaken`

## 8.2 Nieuwe gebruiker

Flow:

1. opent `/register`
2. vult naam, e-mail en wachtwoord in
3. account wordt aangemaakt
4. sessie wordt gestart
5. redirect naar `/garage/new`

## 8.3 Bestaande gebruiker

Flow:

1. opent `/login`
2. logt in
3. komt op `/`

## 8.4 Gebruiker zonder data

Nieuwe gebruiker zonder brommers:

- ziet lege staten zoals vandaag
- krijgt CTA's naar `Brommer toevoegen`

Belangrijk:

- een lege persoonlijke dataset is een normale toestand
- de app mag niet impliciet steunen op seeddata of globale demo-data

## 9. Data-isolatie regels

## 9.1 Harde regel

Elke read en write moet aan exact een gebruiker scoped zijn.

Concreet:

- een gebruiker kan nooit data van een andere gebruiker lezen
- een gebruiker kan nooit data van een andere gebruiker wijzigen
- een gebruiker kan nooit data van een andere gebruiker verwijderen

## 9.2 Data-eigendom

De eigendomslijn is:

- `users`
  - eigenaar van sessies
  - eigenaar van voertuigen
- `vehicles`
  - eigenaar van ritten
  - eigenaar van kosten
  - eigenaar van onderhoudsplannen
  - eigenaar van onderhoudsevents
  - context voor foto-uploads

## 9.3 Toegangscontrole per domein

### Garage

- lijst alleen eigen brommers
- detail alleen toegankelijk voor eigen brommers
- edit/archive alleen op eigen brommers

### Ritten

- lijst alleen ritten van eigen brommers
- detail alleen op eigen ritten
- create alleen voor eigen brommers
- edit/delete alleen voor eigen ritten

### Kosten

- lijst alleen kosten van eigen brommers
- create alleen voor eigen brommers
- edit/delete alleen voor eigen kosten

### Onderhoud

- alleen plannen en events van eigen brommers
- create alleen voor eigen brommers
- gekoppelde kosten blijven binnen dezelfde user-scope

### Overzicht en Home

- aggregaties alleen op eigen dataset
- geen globale totalen over alle gebruikers

## 10. Security- en auth-regels

## 10.1 Sessies

De huidige sessiebenadering blijft de basis:

- httpOnly cookie
- gehashte session token in database
- vervaltijd op sessie

## 10.2 E-mail uniekheid

E-mailadressen moeten uniek zijn per account.

Aanbevolen harde afspraak:

- case-insensitive unieke e-mail
- bijvoorbeeld uniek op `lower(email)`

Waarom:

- `Test@Mail.com` en `test@mail.com` mogen niet twee accounts worden

## 10.3 Wachtwoorden

De huidige wachtwoordhashing met `scrypt` blijft bruikbaar.

Minimaal beleid:

- bestaand minimum van 10 tekens behouden
- geen plaintext opslag
- wachtwoorden nooit teruggeven aan client of logs

## 10.4 Foutgedrag

Bij auth en autorisatie:

- geen lek van andere accountdata
- geen verschil in foutmeldingen dat het bestaan van een e-mailadres onnodig verraadt
- niet-toegankelijke resources eindigen als `not found` of veilige authfout

## 11. Benodigde productwijzigingen

## 11.1 Terminologie

Alle verwijzingen naar `owner` verdwijnen uit productcopy en code waar het concept alleen historisch is.

Voorbeelden:

- `OwnerSetupForm` -> `RegisterForm`
- `createOwnerAction` -> `registerUserAction`
- `loginOwnerAction` -> `loginUserAction`
- `logoutOwnerAction` -> `logoutUserAction`
- copy zoals `eerste eigenaar` verdwijnt

## 11.2 Routewijzigingen

### Nieuw

- `/register`

### Te verwijderen of te herbestemmen

- `/setup`

Voorkeursrichting:

- `/setup` volledig uit de gewone flow halen
- optioneel tijdelijk redirecten naar `/register`

## 11.3 Settings

`Instellingen` blijft persoonlijk:

- naam
- e-mailadres
- sessiestatus
- uitloggen

Maar:

- geen gebruikersbeheer
- geen adminsectie

## 11.4 Lege staten en onboarding

De app moet voor elke nieuwe gebruiker schoon starten:

- geen afhankelijkheid van een al bestaand eerste account
- geen speciale setup-poort
- geen globale app-lock tot eerste owner bestaat

## 12. Technische vertaling naar deze codebase

## 12.1 Auth-serverlaag

Bestanden:

- `src/server/auth.ts`
- `src/server/auth-actions.ts`

Belangrijke wijzigingen:

- `isSetupComplete()` verdwijnt uit normale auth-routing
- `createInitialOwner()` wordt vervangen door generieke accountregistratie
- `requireSetupAccess()` verdwijnt of wordt gedeactiveerd
- `requireAppUser()` redirect nog alleen naar `/login`

## 12.2 Publieke auth-pagina's

Bestanden:

- `src/app/login/page.tsx`
- `src/app/setup/page.tsx`
- nieuwe `src/app/register/page.tsx`
- `src/features/auth/*`

Gewenst:

- loginpagina linkt naar registratie
- registratiepagina vervangt setupgedrag
- app shell behandelt `/register` als publieke route

## 12.3 Database

De basistabellen bestaan al:

- `users`
- `sessions`
- `vehicles.user_id`

Waarschijnlijke extra aanscherping:

- unieke case-insensitive index op e-mail
- review van foreign keys en indexes op user-scoped joins

## 12.4 Query discipline

Alle loaders en mutaties blijven deze regel volgen:

- auth eerst via `requireAppUser()`
- vervolgens data alleen lezen of schrijven binnen de user-scope

Belangrijk:

- elke nieuwe query moet expliciet user-scoped zijn
- geen helper bouwen die per ongeluk globale data kan teruggeven

## 12.5 Uploads

Uploads blijven indirect user-scoped via voertuig of rit.

Belangrijke regel:

- uploadroute of storage-helper mag nooit toegang geven tot bestandspaden van andere gebruikers zonder eigendomscontrole

## 13. Migraties

## 13.1 Vereiste migratie-aanscherpingen

Minimum:

- unieke index op gebruikers-e-mail
- indien nodig normalisatie van bestaande e-mails
- checken dat sessions correct cascade-deleten met users

## 13.2 Geen datafusie

Er is geen migratiepad nodig waarbij meerdere users data delen of opgeschoond moeten worden naar teams.

Dit blijft een eenvoudige account-per-dataset structuur.

## 14. Error codes

Bestaande authcodes blijven grotendeels bruikbaar, maar semantisch aangepast:

- `AUTH_SETUP_ALREADY_COMPLETED`
  - verdwijnt uit de normale productflow
- `AUTH_INVALID_CREDENTIALS`
  - blijft
- `AUTH_SESSION_REQUIRED`
  - blijft
- `AUTH_SESSION_EXPIRED`
  - blijft
- `AUTH_FORBIDDEN`
  - blijft

Aan te vullen:

- `AUTH_EMAIL_ALREADY_IN_USE`
  - registratie op bestaand e-mailadres
- `AUTH_REGISTRATION_DISABLED`
  - alleen nodig als publieke registratie later bewust uitgezet kan worden

## 15. Performance en caching

Multi-user verandert niets aan het hoofddoel dat de app snel moet aanvoelen.

Wel belangrijk:

- geen cache of shared UI-state mag data van gebruiker A tonen aan gebruiker B
- user-specifieke routes en loaders blijven dynamisch of sessiegebonden
- aggregaties op `Home`, `Kosten`, `Ritten`, `Onderhoud` en `Overzicht` blijven per gebruiker geïsoleerd

## 16. Acceptatiecriteria

- meerdere gebruikers kunnen zelfstandig een account registreren
- `/setup` is niet langer nodig als verplichte eerste-account flow
- elke gebruiker kan alleen eigen data zien
- een gebruiker kan geen brommerdetail van een andere gebruiker openen
- een gebruiker kan geen kost, rit of onderhoud van een andere gebruiker bewerken
- `Home` en `Overzicht` tonen alleen persoonlijke totalen
- de UI bevat geen adminpagina
- `Instellingen` toont alleen de eigen accountcontext
- login, registratie en logout werken end-to-end
- nieuwe gebruiker start met een lege eigen dataset

## 17. Handmatige smoke tests

### Scenario 1: eerste gebruiker

1. open `/register`
2. maak gebruiker A aan
3. voeg brommer, rit en kost toe
4. logout

Verwacht:

- alles werkt zonder `/setup`

### Scenario 2: tweede gebruiker

1. open `/register`
2. maak gebruiker B aan
3. login als gebruiker B

Verwacht:

- gebruiker B ziet geen brommer, rit of kost van gebruiker A

### Scenario 3: directe URL naar andermans data

1. kopieer detail-URL van gebruiker A
2. login als gebruiker B
3. open die URL

Verwacht:

- veilige blokkering
- voorkeur: `not found`

### Scenario 4: teruglogin gebruiker A

1. login opnieuw als gebruiker A

Verwacht:

- gebruiker A ziet nog steeds exact eigen dataset

## 18. Definition of done

De migratie is pas klaar als:

- single-owner setup niet meer de producttoegang bepaalt
- registratie en login gewone gebruikersflows zijn
- `owner`-terminologie uit zichtbare productcopy verdwenen is
- data-isolatie handmatig getest is tussen minstens twee accounts
- er geen admin- of users-overzichtspagina zichtbaar is

## 19. Relatie met bestaande v1-spec

Deze spec overschrijft de volgende eerdere v1-aannames:

- `een owner-account te gebruiken`
- `fresh install zonder owner stuurt naar /setup`
- `de app is prive bruikbaar door exact een owner-account`
- `multi-user huishoudens of gedeelde garages` stond buiten scope

Nieuwe interpretatie:

- de app blijft prive per gebruiker
- maar ondersteunt meerdere volledig gescheiden gebruikersaccounts
- gedeelde garages blijven nog steeds buiten scope

## 20. Aanbevolen implementatiefases

### Fase 1

- nieuwe registratieflow
- `/register`
- `owner`-naming vervangen
- `/setup` uitfaseren

### Fase 2

- data-isolatie audit over alle routes, server loaders en actions
- foutcodes en not-found gedrag aanscherpen

### Fase 3

- settings en accountcopy opschonen
- tests en smoke checks met meerdere accounts

### Fase 4

- optionele vervolgstap: wachtwoord reset of accountbeheer

