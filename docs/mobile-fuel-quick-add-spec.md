# Mobile Quick Add Spec: Tankbeurt

Status: voorstel, nog niet geimplementeerd  
Datum: 23 april 2026  
Scope: mobile-only quick-add flow voor `/costs/new/fuel`

## 1. Samenvatting

Op mobiel krijgt `Tankbeurt toevoegen` geen klassiek formulier met veel velden meer, maar een snelle, visuele flow met grote cards en iconen. De gebruiker kiest eerst de brommer, daarna het brandstoftype, vult het bedrag in op een groot enkel-taakscherm, controleert een compacte samenvatting, voegt indien nodig een notitie toe of past de datum aan, en bevestigt daarna de tankbeurt.

Desktop en tablet behouden de bestaande formulierervaring. De route blijft dus hetzelfde, maar de presentatie splitst op breakpoint.

## 2. Waarom

De tankbeurt-flow is een dagelijkse handeling en hoort sneller te voelen dan een algemene kost. Op mobiel is het huidige formulier correct, maar nog te veel een data-entry scherm. De gebruiker moet nu meerdere standaardvelden scannen, terwijl de kerntaak eigenlijk heel klein is:

- welke brommer
- welke brandstof
- hoeveel heb ik betaald
- eventueel een notitie of datumcorrectie
- bevestigen

De nieuwe flow moet aanvoelen als een snelle assistent en niet als een spreadsheet in het klein.

## 3. Doelen

- De mobile tankbeurt-flow voelt merkbaar sneller dan de algemene kost-flow.
- De gebruiker kan met een duim door de belangrijkste stappen.
- De flow gebruikt grote tap-targets, duidelijke iconen en weinig tekstinvoer.
- De standaardflow vraagt alleen wat echt nodig is om een geldige tankbeurt op te slaan.
- De datum staat standaard op vandaag, maar blijft aanpasbaar.
- Bestaande businessregels en servervalidatie blijven intact.

## 4. Niet-doelen

- Geen redesign van de desktop-flow.
- Geen nieuwe aparte route voor desktop.
- Geen schemawijziging voor een exact tijdstip van tanken in v1 van deze flow.
- Geen receipt scanning, OCR of camera-flow.
- Geen wijziging aan de algemene kost-flow.

## 5. Belangrijke productbeslissingen

### 5.1 Alleen mobiel

Deze flow geldt alleen voor mobiele schermen. Concreet:

- `base` tot en met onder `md`: nieuwe quick-add flow
- `md` en groter: bestaande `FuelEntryForm`

Hiermee blijft de app mobile first zonder de desktop-ervaring te forceren in een wizard.

### 5.2 Zelfde route, andere render

De route blijft:

- `/costs/new/fuel`

Alle bestaande ingangen zoals `Home`, `Nieuw`, `Garage` en `Kosten` kunnen dus blijven verwijzen naar dezelfde route.

### 5.3 Bedrag blijft verplicht

Ook al wil de mobile UX minder als formulier voelen, het bedrag blijft verplicht. Zonder bedrag is de tankbeurt niet bruikbaar in kostenoverzichten en wijkt de flow af van de bestaande spec en datastructuur.

Daarom wordt `bedrag` niet geschrapt, maar omgezet naar een enkel, groot, mobiel scherm dat veel lichter aanvoelt dan een traditioneel formulier.

### 5.4 Datum is standaard vandaag en aanpasbaar

De gebruiker vroeg expliciet dat de datum indien nodig nog aangepast kan worden. Dat wordt daarom onderdeel van de spec:

- standaard staat de datum op vandaag
- de datum is zichtbaar in de samenvatting
- de datum kan via een secundaire actie aangepast worden

Belangrijke nuance: de huidige opslag gebruikt `entry_date` als `date`, niet als volledig tijdstip. In deze v1 betekent `nu` dus feitelijk `vandaag in lokale tijd`. Als later echt een tijdstip nodig is, vraagt dat een schema-uitbreiding.

### 5.5 Geen klassiek formulier als basis

De mobile quick-add flow toont niet standaard alle velden onder elkaar. De flow is stapsgewijs en taakgericht:

- kiezen
- kiezen
- bedrag invoeren
- optioneel verfijnen
- bevestigen

Optionele velden blijven beschikbaar, maar zitten achter secundaire UI.

## 6. Gebruikersverhaal

Als eigenaar van een brommer wil ik op mijn telefoon in enkele tikken een tankbeurt kunnen registreren, zodat ik mijn kosten snel kan bijhouden zonder door een volledig formulier te moeten.

## 7. Bestaande businessregels die behouden blijven

De quick-add flow moet dezelfde serverregels volgen als de huidige flow:

- `vehicle_id` verplicht en moet bij de ingelogde gebruiker horen
- `fuel_type` verplicht en moet een geldige keuze zijn: `95`, `98`, `diesel`
- `amount` verplicht en groter dan `0`
- `entry_date` verplicht
- `odometer_km` optioneel en indien ingevuld `>= 0`

Optionele velden blijven mogelijk:

- `notes`
- `fuel_station`
- `payment_method`
- `is_full_tank`
- `odometer_km`

## 8. Entry points

De quick-add flow kan gestart worden vanuit:

- `Home`
- `/new`
- `Garage`
- `/costs`

Ondersteunde query params:

- `vehicleId`
  - als geldig, start de flow met die brommer voorgeselecteerd
- `returnTo`
  - optioneel, bepaalt waarheen na succes teruggekeerd wordt
  - fallback blijft `/costs`

## 9. Flow-overzicht

### 9.1 Preflight

Bij openen van `/costs/new/fuel` op mobiel:

- als er geen actieve brommers zijn:
  - toon lege staat met CTA naar `/garage/new`
- als `vehicleId` geldig is meegegeven:
  - preselecteer die brommer
  - start direct bij stap `Brandstof`
- als er exact 1 actieve brommer is:
  - preselecteer die brommer
  - start direct bij stap `Brandstof`
- anders:
  - start bij stap `Brommer`

Deze keuze houdt de flow snel zonder de gebruiker onnodig te laten tikken.

### 9.2 Stap 1: Brommer kiezen

Doel:

- de gebruiker kiest voor welke brommer de tankbeurt is

UI:

- paginatitel: `Tankbeurt toevoegen`
- subtitel: `Welke brommer heb je getankt?`
- lijst of grid met grote selecteerbare cards
- elke card toont:
  - foto indien beschikbaar
  - anders een sterk fallback-icoon of initial
  - naam van de brommer
  - optioneel secundaire info zoals merk/model of kenteken als die al beschikbaar is

Interacties:

- tik op een card selecteert de brommer
- de flow gaat meteen door naar stap `Brandstof`
- geselecteerde state is visueel heel duidelijk

UX-regels:

- cards hebben comfortabele verticale ruimte
- geen kleine radio buttons
- gehele card is klikbaar

### 9.3 Stap 2: Brandstof kiezen

Doel:

- de gebruiker kiest `95`, `98` of `diesel`

UI:

- subtitel: `Welke brandstof heb je getankt?`
- 3 grote cards met icoon, label en korte helpertekst

Aanbevolen kaartinhoud:

- `95`
  - label: `Euro 95`
- `98`
  - label: `Euro 98`
- `diesel`
  - label: `Diesel`

Interacties:

- tik op een card selecteert meteen het type
- de flow gaat direct door naar stap `Bedrag`

UX-regels:

- iconen ondersteunen de keuze, maar zijn niet het enige onderscheid
- geselecteerde card gebruikt duidelijke contrast- en randstatus

### 9.4 Stap 3: Bedrag invoeren

Doel:

- het verplichte bedrag invoeren zonder het gevoel van een volledig formulier

UI:

- subtitel: `Wat heb je betaald?`
- groot bedragveld met prominente typografie
- `EUR`-context visueel duidelijk
- invoer opent het native numerieke toetsenbord

Aanbevolen implementatie in v1:

- geen custom keypad bouwen
- wel een groot enkel focusveld met `inputMode="decimal"` en duidelijke formattering

Reden:

- native toetsenbord is sneller, toegankelijker en betrouwbaarder
- een custom keypad in web-mobile voegt veel complexiteit toe voor beperkte winst

Validatie:

- leeg bedrag: inline fout
- bedrag `<= 0`: inline fout

CTA:

- primaire knop: `Verder`
- pas actief als bedrag geldig is

### 9.5 Stap 4: Controleren en optioneel aanvullen

Doel:

- snelle bevestiging zonder de flow te vervuilen

UI:

- samenvattingskaart met:
  - gekozen brommer
  - gekozen brandstof
  - bedrag
  - datum

Secundaire acties:

- `Datum aanpassen`
- `Notitie toevoegen`
- `Meer details`

Gedrag van deze acties:

- `Datum aanpassen`
  - opent een compact mobiel datumscherm of bottom sheet
  - default staat op vandaag
  - na aanpassen keert gebruiker terug naar samenvatting
- `Notitie toevoegen`
  - opent inline textarea of compact invoerblok
  - notitie is optioneel
- `Meer details`
  - toont extra optionele velden:
    - `Full tank`
    - `Tankstation`
    - `Betaalmethode`
    - `Kilometerstand`

Belangrijke UX-keuze:

- de standaardflow blijft compact
- extra velden zijn mogelijk, maar niet dominant

Primary CTA:

- `Tankbeurt opslaan`

Secondary CTA:

- `Vorige`

### 9.6 Succes

Na succesvol opslaan:

- toon succesfeedback
- hergebruik bestaande server action
- hergebruik bestaande revalidatie van `Home`, `Garage`, `Kosten` en `Overzicht`

Redirect-gedrag:

- als `returnTo` geldig en veilig is meegegeven: ga daarheen
- anders: ga naar `/costs`

Aanbevolen succescopy:

- `De tankbeurt is opgeslagen.`

## 10. Mobile UI-regels

### 10.1 Layout

- 1 primaire taak per scherm
- veel witruimte
- geen dense veldstapeling
- sticky footer met primaire CTA
- voldoende bottom padding voor mobiele safe area

### 10.2 Touch targets

- alle primaire cards en knoppen zijn royaal klikbaar
- minimale targetgrootte: 56px
- voorkeur: 64px of groter voor keuze-cards

### 10.3 Visual language

- grote kaarten
- duidelijke iconen
- niet meer dan 1 primaire accentkleur tegelijk
- geselecteerde states zijn meteen zichtbaar
- samenvatting voelt rustig en bevestigend

### 10.4 Interactie

- tik op card gaat direct door waar logisch
- geen extra `Volgende` knop na voertuig- en brandstofselectie nodig
- terugnavigatie blijft altijd beschikbaar

### 10.5 Motion

- subtiele schermtransities of content-switches
- geen zware animaties
- reduced-motion respecteren

## 11. Accessibility

De flow moet toegankelijk blijven ondanks de visuele vereenvoudiging:

- alle stappen zijn bruikbaar met screen readers
- iconen hebben altijd tekstlabels
- kleur is nooit het enige selectie-signaal
- focus wordt na elke stap logisch verplaatst
- foutmeldingen zijn inline en programmatisch gekoppeld
- de flow blijft bruikbaar in portrait met een hand

## 12. Edge cases

### 12.1 Geen brommers

Gedrag:

- toon een lege staat
- tekst: `Voeg eerst een brommer toe`
- CTA naar `/garage/new`

### 12.2 Ongeldige voorgeselecteerde brommer

Gedrag:

- negeer de ongeldige `vehicleId`
- val terug op normale selectieflow

### 12.3 Serverfout

Gedrag:

- toon compacte foutmelding boven de bevestig-CTA of in het actieve scherm
- behoud alle reeds gekozen waarden
- gebruiker hoeft niets opnieuw te kiezen tenzij de fout dat vereist

### 12.4 Dubbel tappen op opslaan

Gedrag:

- disable primaire CTA tijdens submit
- toon loading state

### 12.5 Datumcorrectie

Gedrag:

- de gebruiker kan datum aanpassen voor oudere tankbeurten
- in v1 wordt alleen datum aangepast, geen tijdstip

## 13. Informatiearchitectuur van de mobiele flow

De flow heeft in de praktijk maximaal 4 hoofdschermen:

1. `Brommer`  
2. `Brandstof`  
3. `Bedrag`  
4. `Bevestigen`

Varianten:

- met voorgeselecteerde brommer: 3 hoofdschermen
- met extra details geopend: bevestigscherm wordt langer, maar geen extra verplichte stap

Dit is bewust compacter dan een klassieke wizard met 6 of 7 stappen.

## 14. Voorgestelde copy

### Scherm 1

- titel: `Tankbeurt toevoegen`
- subtitel: `Welke brommer heb je getankt?`

### Scherm 2

- subtitel: `Welke brandstof heb je getankt?`

### Scherm 3

- subtitel: `Wat heb je betaald?`
- placeholder: `0,00`

### Scherm 4

- subtitel: `Controleer je tankbeurt`
- actie: `Datum aanpassen`
- actie: `Notitie toevoegen`
- actie: `Meer details`
- CTA: `Tankbeurt opslaan`

## 15. Technische vertaling naar deze codebase

### 15.1 Routegedrag

Bestand:

- `src/app/costs/new/fuel/page.tsx`

Gewenst gedrag:

- mobiel: render nieuwe quick-add component
- `md` en groter: render bestaande `FuelEntryForm`

### 15.2 Nieuwe component

Aanbevolen nieuwe component:

- `src/features/costs/fuel-quick-add-flow.tsx`

Verantwoordelijkheden:

- client-side stapbeheer
- lokale keuzes vasthouden tussen stappen
- tonen van mobiel-specifieke UI
- submit naar bestaande server action

### 15.3 Server action

Serverkant blijft in essentie hetzelfde:

- `createFuelEntryAction`

Belangrijk:

- dezelfde validatie blijft de bron van waarheid
- mobile quick-add mag geen aparte businesslogica krijgen

### 15.4 Form submission model

Ook al voelt de flow niet als een formulier, de uiteindelijke submit kan nog steeds op een gewone `form` uitkomen met hidden inputs voor:

- `vehicleId`
- `fuelType`
- `amountEur`
- `entryDate`
- `notes`
- `fuelStation`
- `paymentMethod`
- `isFullTank`
- `odometerKm`
- eventueel `returnTo`

Dit houdt de implementatie simpel en consistent met de bestaande actions.

### 15.5 Breakpoint-aanpak

Aanbevolen patroon:

- `hiddenFrom="md"` voor mobile quick-add
- `visibleFrom="md"` voor bestaande desktop/tablet form

Dit sluit aan op bestaande code in de app.

## 16. Acceptatiecriteria

De feature is pas geslaagd als al het volgende waar is:

- op mobiel ziet `/costs/new/fuel` standaard geen volledig klassiek formulier
- op mobiel kan de gebruiker met grote cards eerst een brommer kiezen
- op mobiel kan de gebruiker met grote cards een brandstoftype kiezen
- op mobiel blijft `bedrag` verplicht, maar voelt de invoer als een enkel-taakscherm
- de datum staat standaard op vandaag
- de datum kan voor submit aangepast worden
- notities blijven optioneel
- geavanceerde velden blijven beschikbaar achter `Meer details`
- de flow gebruikt dezelfde server action en dezelfde businessregels als nu
- op desktop en tablet blijft de bestaande `FuelEntryForm` beschikbaar
- na succes zijn de relevante schermen direct bijgewerkt

## 17. Aanbevolen implementatiefase

### Fase 1

- mobile-only step flow
- voertuigselectie
- brandstofselectie
- bedragscherm
- bevestigscherm
- datum aanpassen
- notitie toevoegen

### Fase 2

- `Meer details` voor:
  - `Full tank`
  - `Tankstation`
  - `Betaalmethode`
  - `Kilometerstand`
- `returnTo` gedrag vanaf verschillende entry points

### Fase 3

- extra polish
- subtiele transities
- meer context in brommercards
- eventuele slim gekozen defaults op basis van laatste tankbeurt

## 18. Expliciete open grens van deze spec

Deze spec ondersteunt in v1 alleen een datum, geen exact tijdstip. Dat is geen UX-keuze alleen, maar ook een datastructuurkeuze. Als later nodig blijkt dat een tankbeurt op mobiel echt `nu` met uur en minuten moet opslaan, dan hoort daar een aparte schema- en productbeslissing bij.
