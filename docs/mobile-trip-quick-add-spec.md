# Mobile Quick Add Spec: Rit

Status: voorstel, nog niet geimplementeerd  
Datum: 24 april 2026  
Scope: mobile-only quick-add flow voor `/trips/new`

## 1. Samenvatting

Op mobiel krijgt `Rit toevoegen` een snelle, stapsgewijze flow in plaats van een volledig formulier. De gebruiker kiest eerst de brommer, vult daarna de afstand in als kernactie, controleert een compacte samenvatting, past indien nodig de datum aan en voegt alleen extra details toe als dat echt nodig is.

Desktop en tablet behouden de bestaande `TripForm`. De route blijft dus hetzelfde, maar de mobiele presentatie wordt task-first in plaats van form-first.

## 2. Waarom

Een rit registreren is een veelgebruikte mobiele handeling. De huidige form-flow is correct, maar vraagt de gebruiker om direct door alle mogelijke velden te scannen:

- brommer
- titel
- datum
- afstand
- duur
- vertrek
- aankomst
- notities
- optioneel een foto

De echte happy flow is veel kleiner:

- voor welke brommer
- hoeveel kilometer
- op welke datum
- bevestigen

De mobile quick-add moet die kleine kern centraal zetten.

## 3. Doelen

- `Rit toevoegen` voelt op mobiel merkbaar sneller dan het volledige formulier.
- De gebruiker kan in enkele tikken een geldige rit opslaan.
- De standaardflow vraagt alleen naar de noodzakelijke minimumdata.
- Datum staat standaard op vandaag, maar blijft aanpasbaar.
- Optionele ritcontext blijft beschikbaar zonder de flow te vervuilen.
- De bestaande server action en validatie blijven de bron van waarheid.

## 4. Niet-doelen

- Geen redesign van de desktop-flow.
- Geen schemawijziging voor ritten.
- Geen automatische GPS-logging of route-import.
- Geen camera- of foto-flow in v1 van de quick add.
- Geen wijziging aan edit-flows.

## 5. Belangrijke productbeslissingen

### 5.1 Alleen mobiel

Deze flow geldt alleen voor mobiele schermen:

- `base` tot en met onder `md`: quick-add flow
- `md` en groter: bestaande `TripForm`

### 5.2 Zelfde route

De route blijft:

- `/trips/new`

Alle bestaande entry points kunnen dus naar dezelfde route blijven verwijzen.

### 5.3 Titel blijft optioneel

De huidige serverlaag behandelt `title` als optioneel. Dat blijft zo.

Gevolg:

- de titel hoeft niet in de happy flow
- de quick add kan de rit opslaan zonder aparte titelstap
- de gebruiker kan later optioneel toch een titel toevoegen

### 5.4 Afstand blijft verplicht

De afstand blijft verplicht en groter dan `0.1`.

Dat maakt `Afstand` de centrale invoerstap van de mobile flow.

### 5.5 Datum standaard vandaag en aanpasbaar

Zoals bij de tankbeurt:

- standaard vandaag
- zichtbaar in de samenvatting
- via secundaire actie nog aanpasbaar

### 5.6 Foto niet in v1 quick add

De huidige create-flow ondersteunt een ritfoto, maar file-input in een mobiele wizard verhoogt de complexiteit sterk.

Daarom:

- desktop behoudt de bestaande foto-input
- mobile quick add ondersteunt in v1 geen ritfoto
- foto-upload kan later als fase 2 worden toegevoegd

## 6. Gebruikersverhaal

Als eigenaar wil ik op mijn telefoon snel een rit kunnen bewaren met zo weinig mogelijk typing, zodat ik mijn afstand en ritgeschiedenis kan bijhouden zonder telkens door een groot formulier te moeten.

## 7. Bestaande businessregels die behouden blijven

De quick-add flow blijft de huidige servervalidatie volgen:

- `vehicleId` verplicht
- `tripDate` verplicht en geldige datum
- `distanceKm` verplicht en `>= 0.1`
- `title` optioneel
- `durationMinutes` optioneel en `>= 0`
- `startLocationName` optioneel
- `endLocationName` optioneel
- `notes` optioneel

## 8. Entry points

De flow kan gestart worden vanuit:

- `Home`
- `/new`
- `Garage`
- `Garage detail`
- `/trips`

Ondersteunde query params:

- `vehicleId`
  - als geldig: brommer vooraf geselecteerd

## 9. Flow-overzicht

### 9.1 Preflight

Bij openen van `/trips/new` op mobiel:

- als er geen actieve brommers zijn:
  - toon lege staat met CTA naar `/garage/new`
- als `vehicleId` geldig is meegegeven:
  - preselecteer de brommer
  - start bij stap `Afstand`
- als er exact 1 actieve brommer is:
  - preselecteer die brommer
  - start bij stap `Afstand`
- anders:
  - start bij stap `Brommer`

### 9.2 Stap 1: Brommer kiezen

Doel:

- voor welke brommer is deze rit

UI:

- titel: `Rit toevoegen`
- subtitel: `Welke brommer heb je gebruikt?`
- grote, klikbare cards met:
  - naam
  - foto of fallback
  - optioneel merk/model of kenteken

Interactie:

- tik op card selecteert brommer
- flow gaat direct door naar `Afstand`

### 9.3 Stap 2: Afstand invoeren

Doel:

- de enige verplichte invoer buiten brommer en datum

UI:

- subtitel: `Hoeveel kilometer heb je gereden?`
- groot numeriek veld
- duidelijke `km` context
- native decimal keyboard

Validatie:

- leeg: fout
- `<= 0`: fout
- `< 0.1`: fout

CTA:

- `Verder`

### 9.4 Stap 3: Controleren en optioneel aanvullen

Doel:

- snelle confirm zonder de flow zwaar te maken

Samenvatting:

- brommer
- afstand
- datum
- titel indien ingevuld

Secundaire acties:

- `Datum aanpassen`
- `Titel toevoegen`
- `Meer details`

`Meer details` toont:

- `Duur`
- `Vertrek`
- `Aankomst`
- `Notities`

Belangrijke UX-keuze:

- locatievelden horen niet in de standaardflow
- ze zijn nuttig voor sommige ritten, maar niet voor de dagelijkse happy flow

Primary CTA:

- `Rit opslaan`

Secondary CTA:

- `Vorige`

## 10. Mobile UI-regels

- 1 hoofdtaak per scherm
- grote tap targets
- sticky footer met primaire CTA
- numerieke invoer krijgt veel visuele nadruk
- terugnavigatie blijft altijd beschikbaar

## 11. Accessibility

- alle keuze-cards hebben tekstlabels
- kleur is nooit het enige selectie-signaal
- foutmeldingen staan inline
- focus verplaatst logisch na elke stap
- reduced-motion wordt gerespecteerd

## 12. Edge cases

### 12.1 Geen brommers

- lege staat
- CTA naar `/garage/new`

### 12.2 Ongeldige `vehicleId`

- negeren
- normale flow tonen

### 12.3 Serverfout

- toon compacte foutmelding
- behoud gekozen brommer, afstand en ingevulde details

### 12.4 Dubbel submit

- primaire CTA disabled tijdens submit
- loading state zichtbaar

### 12.5 Geen titel

- volledig toegestaan
- server behoudt bestaande fallbacklogica

## 13. Technische vertaling naar deze codebase

### 13.1 Route

Bestand:

- `src/app/trips/new/page.tsx`

Gewenst gedrag:

- mobiel: nieuwe quick-add component
- `md` en groter: bestaande `TripForm`

### 13.2 Nieuwe component

Aanbevolen component:

- `src/features/trips/trip-quick-add-flow.tsx`

Verantwoordelijkheden:

- stapbeheer
- lokale state tussen stappen
- submit naar bestaande `createTripAction`

### 13.3 Server action

Bestaand:

- `createTripAction`

Belangrijk:

- geen aparte businesslogica voor mobile
- quick add gebruikt dezelfde validatie

## 14. Acceptatiecriteria

- op mobiel toont `/trips/new` niet standaard het volledige formulier
- brommerselectie werkt via grote cards
- afstand is de centrale verplichte invoerstap
- datum staat standaard op vandaag
- datum blijft aanpasbaar voor submit
- titel blijft optioneel
- duur, vertrek, aankomst en notities zitten achter secundaire UI
- desktop/tablet behouden de bestaande form-flow
- submit gebruikt bestaande server action

## 15. Aanbevolen implementatiefases

### Fase 1

- brommer kiezen
- afstand invoeren
- bevestigen
- datum aanpassen
- titel toevoegen

### Fase 2

- meer details voor duur, vertrek, aankomst en notities

### Fase 3

- optionele foto-upload in mobile quick add
- extra polish en transities
