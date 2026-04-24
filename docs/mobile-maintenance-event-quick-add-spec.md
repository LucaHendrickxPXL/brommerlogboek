# Mobile Quick Add Spec: Onderhoud Registreren

Status: voorstel, nog niet geimplementeerd  
Datum: 24 april 2026  
Scope: mobile-only quick-add flow voor `/maintenance/events/new`

## 1. Samenvatting

Op mobiel krijgt `Onderhoud registreren` een quick-add flow die routineonderhoud sneller maakt. De gebruiker kiest eerst de brommer, kiest daarna een onderhoudsplan of `Los onderhoud`, controleert of vult de titel aan, en bevestigt daarna het event. Datum staat standaard op vandaag, en optionele kost- en werkplaatsgegevens zitten achter secundaire UI.

Desktop en tablet behouden de bestaande `MaintenanceEventForm`.

## 2. Waarom

De huidige maintenance event form is inhoudelijk sterk, maar op mobiel nog vrij zwaar voor een handeling die vaak routineus is:

- brommer
- onderhoudsplan
- titel
- datum
- werkplaats
- notities
- optioneel kostbedrag
- optionele leverancier
- optionele betaalmethode

Voor veel gevallen is de echte kern kleiner:

- voor welke brommer
- welk onderhoud
- wanneer
- eventueel een kost
- bevestigen

## 3. Doelen

- routineonderhoud sneller loggen op mobiel
- actieve onderhoudsplannen benutten als versnellende keuze
- titel slim kunnen voorinvullen op basis van een plan
- kostgegevens optioneel houden
- dezelfde servervalidatie behouden

## 4. Niet-doelen

- geen redesign van onderhoudsplannen
- geen wijziging aan de desktopflow
- geen automatische kilometerstandlogica in deze flow
- geen materiaal- of onderdelenlijst in v1

## 5. Belangrijke productbeslissingen

### 5.1 Alleen mobiel

- onder `md`: quick-add
- `md` en groter: huidige form

### 5.2 Zelfde route

- `/maintenance/events/new`

### 5.3 Onderhoudsplan is een versneller, geen verplichting

`maintenanceRuleId` blijft optioneel.

Daarom krijgt de mobile flow altijd:

- actieve onderhoudsplannen voor de gekozen brommer
- plus een expliciete keuze `Los onderhoud`

### 5.4 Titel blijft verplicht

`title` blijft verplicht volgens de huidige servervalidatie.

Maar:

- als een plan gekozen wordt, mag de titel alvast worden voorgevuld met de plannaam
- de gebruiker mag die titel nog aanpassen

### 5.5 Datum standaard vandaag en aanpasbaar

- default vandaag
- zichtbaar op confirm
- aanpasbaar via secundaire actie

### 5.6 Kost is optioneel en secundair

Onderhoud registreren mag zonder kostbedrag.

Daarom:

- kostvelden zitten niet in de kernflow
- confirm-scherm krijgt een actie `Kost toevoegen`

## 6. Gebruikersverhaal

Als eigenaar wil ik op mijn telefoon snel een onderhoudsbeurt kunnen registreren, zodat mijn planning en historiek juist blijven zonder dat ik meteen een uitgebreid formulier moet invullen.

## 7. Bestaande businessregels die behouden blijven

De quick-add flow blijft de servervalidatie volgen:

- `vehicleId` verplicht
- `title` verplicht, min 2 karakters
- `performedAt` verplicht en geldige datum
- `maintenanceRuleId` optioneel
- `workshopName` optioneel
- `notes` optioneel
- `costAmountEur` optioneel en `>= 0.01` indien ingevuld
- `costVendorName` optioneel
- `costPaymentMethod` optioneel

## 8. Entry points

De flow kan gestart worden vanuit:

- `Home`
- `/new`
- `Garage`
- `Garage detail`
- `/maintenance`

Ondersteunde query params:

- `vehicleId`
  - als geldig: brommer vooraf gekozen

## 9. Flow-overzicht

### 9.1 Preflight

Bij openen van `/maintenance/events/new` op mobiel:

- geen actieve brommers:
  - lege staat met CTA naar `/garage/new`
- geldige `vehicleId`:
  - brommer vooraf gekozen
  - start bij `Onderhoud`
- exact 1 actieve brommer:
  - brommer vooraf gekozen
  - start bij `Onderhoud`
- anders:
  - start bij `Brommer`

### 9.2 Stap 1: Brommer kiezen

Zelfde pattern als andere quick adds:

- grote brommercards
- tik = selecteren
- direct door naar volgende stap

### 9.3 Stap 2: Onderhoud kiezen

Doel:

- aangeven welk onderhoud net is uitgevoerd

UI:

- lijst van actieve onderhoudsplannen voor die brommer
- plus een aparte card `Los onderhoud`

Gedrag:

- keuze van een onderhoudsplan:
  - `maintenanceRuleId` wordt ingevuld
  - `title` wordt voorgevuld met plannaam
  - flow mag direct door naar `Bevestigen`
- keuze `Los onderhoud`:
  - geen rule-id
  - flow gaat naar `Titel`

Als de brommer geen actieve plannen heeft:

- toon meteen `Los onderhoud`
- eventueel met enkele visuele suggesties als helpertekst

### 9.4 Stap 3: Titel invullen of aanpassen

Deze stap is conditioneel.

Nodig wanneer:

- `Los onderhoud` gekozen is
- of gebruiker een voorgestelde titel nog wil aanpassen

UI:

- compact tekstveld
- subtitel: `Welk onderhoud heb je uitgevoerd?`

Voorbeelden:

- `Kettingset vervangen`
- `Grote onderhoudsbeurt`
- `Remblokken vervangen`

### 9.5 Stap 4: Controleren en optioneel aanvullen

Samenvatting:

- brommer
- gekozen plan of `Los onderhoud`
- titel
- datum

Secundaire acties:

- `Datum aanpassen`
- `Werkplaats toevoegen`
- `Notitie toevoegen`
- `Kost toevoegen`

`Kost toevoegen` opent:

- `Kostbedrag`
- en zodra er bedrag is:
  - `Leverancier`
  - `Betaalmethode`

Belangrijke UX-keuze:

- kost mag volledig worden overgeslagen
- werkplaats en notities blijven compact en optioneel

Primary CTA:

- `Onderhoud opslaan`

## 10. Mobile UI-regels

- onderhoudsplannen als grote cards
- `Los onderhoud` visueel even duidelijk als een plan
- confirm-scherm toont alles rustig onder elkaar
- kostsectie blijft dicht tot gebruiker die bewust opent

## 11. Accessibility

- plan- en typekeuzes hebben altijd tekstlabels
- status of selectie niet alleen via kleur
- inline foutmeldingen
- goede focus-volgorde tussen kaarten en formulieren

## 12. Edge cases

### 12.1 Geen brommers

- CTA naar `/garage/new`

### 12.2 Gekozen brommer heeft geen plannen

- alleen `Los onderhoud` pad tonen

### 12.3 Regel gekozen maar titel aangepast

- volledig toegestaan
- rule-link blijft behouden

### 12.4 Kostbedrag ingevuld zonder overige kostdetails

- toegestaan
- leverancier en betaalmethode blijven optioneel

### 12.5 Serverfout

- alle keuzes en ingevulde tekst behouden

## 13. Technische vertaling naar deze codebase

### 13.1 Route

Bestand:

- `src/app/maintenance/events/new/page.tsx`

Gedrag:

- mobiel: nieuwe quick-add component
- desktop/tablet: bestaande `MaintenanceEventForm`

### 13.2 Nieuwe component

Aanbevolen component:

- `src/features/maintenance/maintenance-event-quick-add-flow.tsx`

### 13.3 Server action

Bestaand:

- `createMaintenanceEventAction`

Belangrijk:

- mobile flow gebruikt dezelfde server action
- geen aparte onderhoudsbusinesslogica

## 14. Acceptatiecriteria

- op mobiel toont `/maintenance/events/new` niet standaard het volledige formulier
- brommerselectie werkt via cards
- actieve onderhoudsplannen kunnen direct gekozen worden
- `Los onderhoud` blijft altijd mogelijk
- titel blijft verplicht maar kan vanuit plan worden voorgevuld
- datum staat standaard op vandaag
- werkplaats, notities en kostdetails zitten achter secundaire UI
- desktop/tablet behouden de bestaande form

## 15. Aanbevolen implementatiefases

### Fase 1

- brommer kiezen
- plan of los onderhoud kiezen
- conditionele titelstap
- confirm

### Fase 2

- datum aanpassen
- werkplaats en notitie
- kost toevoegen

### Fase 3

- extra polish
- snellere suggereerlogica voor onderhoudstitels
