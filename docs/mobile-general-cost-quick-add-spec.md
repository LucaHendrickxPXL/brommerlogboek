# Mobile Quick Add Spec: Algemene Kost

Status: voorstel, nog niet geimplementeerd  
Datum: 24 april 2026  
Scope: mobile-only quick-add flow voor `/costs/new`

## 1. Samenvatting

Op mobiel krijgt `Kost toevoegen` een stapsgewijze quick-add flow die de verplichte kern terugbrengt tot:

- brommer
- categorie
- bedrag
- titel
- bevestigen

Datum staat standaard op vandaag en kan later aangepast worden. Leverancier, locatie, betaalmethode en notities blijven beschikbaar, maar verdwijnen uit de standaardflow.

Desktop en tablet behouden de bestaande `GeneralCostForm`.

## 2. Waarom

De huidige general cost flow is correct, maar op mobiel direct vrij dicht:

- voertuigkeuze
- datum
- categorie
- titel
- bedrag
- leverancier
- locatie
- betaalmethode
- notities

De gebruiker wil vaak alleen snel een kost loggen, niet meteen alle metadata invullen.

## 3. Doelen

- algemene kosten op mobiel sneller registreren
- categoriekeuze visueel en direct maken
- verplichte kern compact houden
- optionele administratie achter secundaire UI plaatsen
- bestaande validatie volledig behouden

## 4. Niet-doelen

- geen redesign van desktop
- geen wijziging aan de categorieenstructuur
- geen OCR, factuurfoto of scanflow
- geen aanpassing van edit-routes

## 5. Belangrijke productbeslissingen

### 5.1 Alleen mobiel

- onder `md`: quick-add
- `md` en groter: huidige form

### 5.2 Zelfde route

- `/costs/new`

### 5.3 Titel blijft verplicht

Anders dan bij ritten en tankbeurten blijft `title` hier verplicht.

Dat betekent:

- er komt een eigen korte titelstap
- de quick add mag titel niet overslaan

### 5.4 Categorie is de visuele hoofdkeuze

De categorie is het beste eerste semantische anker van deze flow.

Daarom krijgt die een eigen stap met icon/cards.

### 5.5 Datum standaard vandaag en aanpasbaar

- default vandaag
- zichtbaar op confirm
- aanpasbaar via secundaire actie

## 6. Gebruikersverhaal

Als eigenaar wil ik op mijn telefoon snel een losse kost bewaren zonder een volledig administratief formulier te moeten invullen, zodat mijn historiek up to date blijft terwijl ik weinig hoef te typen.

## 7. Bestaande businessregels die behouden blijven

De quick-add flow blijft de servervalidatie volgen:

- `vehicleId` verplicht
- `category` verplicht en moet een geldige general cost category zijn
- `title` verplicht, min 2 karakters
- `amountEur` verplicht en `>= 0.01`
- `entryDate` verplicht
- `vendorName` optioneel
- `locationName` optioneel
- `paymentMethod` optioneel
- `notes` optioneel

Toegestane categorieen:

- verzekering
- onderhoud
- belastingen
- parking
- uitrusting
- herstelling
- overig

## 8. Entry points

De flow kan gestart worden vanuit:

- `Home`
- `/new`
- `Garage`
- `Garage detail`
- `/costs`

Ondersteunde query params:

- `vehicleId`
  - als geldig: brommer vooraf geselecteerd

## 9. Flow-overzicht

### 9.1 Preflight

Bij openen van `/costs/new` op mobiel:

- geen actieve brommers:
  - lege staat met CTA naar `/garage/new`
- geldige `vehicleId`:
  - brommer vooraf gekozen
  - start bij `Categorie`
- exact 1 actieve brommer:
  - vooraf gekozen
  - start bij `Categorie`
- anders:
  - start bij `Brommer`

### 9.2 Stap 1: Brommer kiezen

Zelfde patroon als de tankbeurt:

- grote cards
- naam + foto/fallback
- direct door naar `Categorie`

### 9.3 Stap 2: Categorie kiezen

Doel:

- visueel duidelijk maken wat voor soort kost dit is

UI:

- subtitel: `Wat voor kost is dit?`
- grid met categorie-cards
- elke card toont:
  - icoon
  - label
  - korte helpertekst

Selectie gaat direct door naar `Bedrag`.

### 9.4 Stap 3: Bedrag invoeren

Doel:

- het bedrag registreren met een groot enkeltaakscherm

UI:

- groot bedragveld
- `EUR` context
- native decimal keyboard

CTA:

- `Verder`

### 9.5 Stap 4: Titel invoeren

Doel:

- korte verplichte omschrijving toevoegen

UI:

- subtitel: `Waar gaat deze kost over?`
- compact tekstveld
- categorieafhankelijke placeholder

Voorbeeld placeholders:

- verzekering: `Maandpremie scooterverzekering`
- onderhoud: `Onderhoudsbeurt voorjaar`
- parking: `Parkeerkost centrum`
- herstelling: `Nieuwe achterrem`

Belangrijke UX-keuze:

- geen lange textarea
- titel moet kort en scanbaar blijven

### 9.6 Stap 5: Controleren en optioneel aanvullen

Samenvatting:

- brommer
- categorie
- bedrag
- titel
- datum

Secundaire acties:

- `Datum aanpassen`
- `Meer details`

`Meer details` toont:

- `Leverancier`
- `Locatie`
- `Betaalmethode`
- `Notities`

Primary CTA:

- `Kost opslaan`

## 10. Mobile UI-regels

- categorie-cards moeten royaal klikbaar zijn
- bedrag en titel zijn elk een eigen focusmoment
- confirm-scherm blijft kort
- sticky footer op mobiel

## 11. Accessibility

- categorieen hebben altijd tekst, niet alleen iconen
- foutmeldingen inline
- toetsvolgorde logisch
- focus springt naar eerste foutveld indien nodig

## 12. Edge cases

### 12.1 Geen brommers

- CTA naar `/garage/new`

### 12.2 Ongeldige `vehicleId`

- fallback naar gewone selectieflow

### 12.3 Titel te kort

- inline fout
- gebruiker blijft in titelstap

### 12.4 Categorie niet gekozen

- gebruiker blijft in categoriestap

## 13. Technische vertaling naar deze codebase

### 13.1 Route

Bestand:

- `src/app/costs/new/page.tsx`

Gedrag:

- mobiel: nieuwe quick-add component
- desktop/tablet: bestaande `GeneralCostForm`

### 13.2 Nieuwe component

Aanbevolen component:

- `src/features/costs/general-cost-quick-add-flow.tsx`

### 13.3 Server action

Bestaand:

- `createGeneralCostAction`

Geen aparte mobile businesslogica.

## 14. Acceptatiecriteria

- op mobiel toont `/costs/new` geen dicht formulier als standaard
- brommerselectie werkt met cards
- categorie is een aparte visuele stap
- bedrag is een aparte stap
- titel blijft verplicht
- datum staat standaard op vandaag
- datum blijft aanpasbaar
- leverancier, locatie, betaalmethode en notities zitten achter `Meer details`
- desktop/tablet behouden bestaande form

## 15. Aanbevolen implementatiefases

### Fase 1

- brommer
- categorie
- bedrag
- titel
- confirm

### Fase 2

- datum aanpassen
- meer details

### Fase 3

- slimme placeholders of suggesties per categorie
- subtiele transities en polish
