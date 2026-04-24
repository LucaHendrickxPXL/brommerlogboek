# Navigation Stability Spec

Status: voorstel, nog niet geimplementeerd  
Datum: 24 april 2026  
Scope: interne navigatie, route-transities, layoutstabiliteit en volledige legacy-cleanup

## 1. Samenvatting

De app moet bij routewissels aanvoelen als een vloeiende, native-achtige webapp en niet als een verzameling losse pagina's die telkens opnieuw worden geladen.

Vandaag voelt navigatie soms alsof resources opnieuw worden geladen, ook zonder witte flash. Dat gevoel komt in deze codebase vooral door:

- interne navigatie via gewone anchors in plaats van App Router links
- het ontbreken van route-level loading states
- dynamische routes die zonder stabiele tussenlaag opnieuw renderen
- layout die tijdens de routewissel even herschikt voordat de definitieve inhoud staat

Deze spec definieert een volledige migratie naar stabiele interne navigatie. De migratie is pas klaar wanneer de oude anchor-gebaseerde interne navigatie ook echt uit de codebase verdwenen is.

## 2. Probleembeeld

De gebruiker ervaart bij klikken naar een nieuwe route:

- geen harde witte pagina
- wel een kort moment waarop inhoud verspringt
- daarna pas opnieuw de juiste opmaak en compositie

Dat voelt alsof de app "toch opnieuw laadt", ook als technisch niet elk onderdeel volledig hard refreshed.

Voor een mobile-first logboekapp is dat ongewenst. Dagelijkse flows zoals `Home -> Kosten`, `Garage -> Tankbeurt`, `Ritten -> Detail` en `Onderhoud -> Bewerken` moeten compact en voorspelbaar blijven.

## 3. Huidige codebase: concrete observaties

### 3.1 Interne navigatie gebruikt anchors

In de huidige codebase worden veel interne routes nog gerenderd als gewone anchors via Mantine-componenten.

Concrete voorbeelden:

- `src/components/layout/app-frame.tsx`
- `src/components/ui/screen-section.tsx`
- `src/components/ui/empty-state-card.tsx`
- `src/features/home/home-screen.tsx`
- meerdere screen-, detail- en formcomponenten in `costs`, `garage`, `maintenance` en `trips`

Typisch patroon:

- `component="a"`
- `href="/..."`

### 3.2 `next/link` wordt momenteel niet gebruikt

In de huidige `src`-boom is geen gebruik van `next/link` gevonden. Daardoor mist de app de standaard soft navigation van Next App Router voor gewone interne links.

### 3.3 Er zijn geen route-level `loading.tsx` bestanden

Onder `src/app` zijn momenteel geen `loading.tsx` bestanden aanwezig. Daardoor ontbreekt een stabiele tussenlaag tijdens servergedreven routewissels.

### 3.4 De globale shell is client-side

`src/components/layout/app-frame.tsx` is een client component met navigatiechrome. Dat hoeft geen probleem te zijn, maar dan moet de navigatie zelf wel consequent soft en voorspelbaar zijn.

### 3.5 Visuele layout heeft glasachtige surfaces en dynamische content

De app gebruikt in `src/app/globals.css` meerdere surface- en sticky-patronen zoals:

- `.surface-card`
- `.page-main-stack`
- `.quick-add-footer`

Dat is visueel prima, maar maakt layout-instabiliteit sneller zichtbaar als route-inhoud laat binnenkomt of opnieuw mount.

## 4. Waarom dit gebeurt

De hoofdreden is geen "mysterie in Next", maar een combinatie van duidelijke oorzaken.

### 4.1 Gewone anchors veroorzaken documentnavigatie-achtig gedrag

Wanneer interne routes via gewone anchors lopen:

- verlaat de browser de huidige documentcontext
- wordt de nieuwe route als documentnavigatie behandeld of benaderd
- remount de app-shell of grote delen ervan
- worden servercomponenten en styles opnieuw opgebouwd

Dat kan zonder witte flash gebeuren, maar voelt toch alsof de app even opnieuw "gezet" wordt.

### 4.2 Zonder `loading.tsx` is er geen stabiele overgangslaag

Bij dynamische routes met serverdata moet de gebruiker nu wachten op de volgende render zonder dat er alvast een skeleton of vaste layout staat.

Gevolg:

- hoogte van secties verschuift
- koppen, cards en knoppen springen
- de pagina voelt onrustig

### 4.3 Dynamische data maakt layoutshift zichtbaarder

De app heeft veel data-afhankelijke schermen. Als de nav niet zacht is en er geen stabiele loading shell staat, voelt elke serverrender zwaarder dan nodig.

## 5. Doelen

- Interne navigatie voelt als een vloeiende app-transition.
- De gebruiker ervaart geen documentnavigatiegevoel meer tussen gewone app-routes.
- Layout verschuift zo weinig mogelijk tijdens routewissels.
- P0-routes krijgen zichtbare, stabiele loading states.
- De codebase eindigt met een eenduidige navigatielaag.
- Na de migratie blijft er geen legacy interne anchor-navigatie achter.

## 6. Niet-doelen

- Geen redesign van de volledige UI.
- Geen omzetting van alle routes naar static rendering.
- Geen introductie van client-side datafetching als hoofdoplossing.
- Geen animatie-heavy page transitions.
- Geen behoud van oude interne anchorpatronen "voor compatibiliteit".

## 7. Productprincipes

### 7.1 Mobile first

Navigatie-optimalisatie wordt eerst beoordeeld op mobiel:

- duimvriendelijke flows
- voorspelbare terugnavigatie
- stabiele content boven de fold
- geen schokkerige overgang tussen dagelijkse schermen

### 7.2 Soft navigation als standaard

Alle gewone app-interne navigatie gebruikt App Router links.

### 7.3 Layout eerst stabiel, dan rijk

De gebruiker moet eerst een stabiele compositie zien en pas daarna de definitieve detailinhoud.

### 7.4 Een navigatiesysteem, niet twee

De app krijgt na migratie geen hybride laag waarin zowel de oude anchor-aanpak als de nieuwe link-aanpak naast elkaar blijven bestaan.

## 8. Harde architectuurregels

### Regel 1

Interne app-routes moeten via `next/link` lopen.

Voorbeelden van intern:

- `/`
- `/garage`
- `/garage/new`
- `/garage/[vehicleId]`
- `/costs/new/fuel?vehicleId=...`

### Regel 2

Gewone anchors blijven alleen toegestaan voor:

- externe urls met protocol
- `mailto:`
- `tel:`
- hash-links op dezelfde pagina
- bestandsdownloads indien echt nodig

### Regel 3

`window.location`, `location.href` en vergelijkbare documentnavigatie zijn verboden voor gewone interne app-routes.

### Regel 4

`router.push()` en `router.replace()` worden niet gebruikt voor standaard klikbare navigatie-elementen die ook declaratief een link kunnen zijn.

Ze blijven alleen toegestaan voor:

- post-submit flows
- toast-URL cleanup
- conditionele programmatische navigatie

### Regel 5

Mantine-componenten mogen niet rechtstreeks `component="a"` + intern `href` gebruiken.

### Regel 6

Er komt een gedeelde navigatieprimitief voor interne links. Nieuwe code mag niet meer ad hoc zijn eigen linkgedrag kiezen.

### Regel 7

P0- en P1-routes krijgen een expliciete loading shell of skeleton met stabiele hoogte.

## 9. Doelarchitectuur

### 9.1 Interne link-primitieven

De app krijgt een kleine, duidelijke set gedeelde primitives voor interne navigatie.

Aanbevolen richting:

- `AppLink`
- `LinkButton`
- `LinkNavLink`

Doel:

- `next/link` centraliseren
- Mantine-integratie uniform maken
- styling en prefetchgedrag op een plek beheersen

### 9.2 Externe link-primitief

Externe links krijgen indien nodig een aparte primitief, bijvoorbeeld:

- `ExternalLink`

Zo wordt intern versus extern ook in de code expliciet.

### 9.3 Expliciete actie-slots in plaats van anchor-branches

Generieke UI-componenten zoals sectieheaders of empty states mogen na migratie niet meer intern kiezen tussen:

- `button`
- `a`

op basis van een `href` prop.

Gewenste richting:

- ofwel een expliciete `action` slot
- ofwel een gedeelde `LinkButton`

Reden:

- dit voorkomt dat de oude anchorlogica "verstopt" in generieke componenten blijft hangen

### 9.4 Route-level loading shells

P0- en P1-routes krijgen `loading.tsx` of een gelijkwaardige route-shell.

Minstens voor:

- `/`
- `/garage`
- `/garage/[vehicleId]`
- `/costs`
- `/costs/new/fuel`
- `/trips`
- `/maintenance`

### 9.5 Layout-stabiele skeletons

Loading states moeten niet alleen "iets tonen", maar ongeveer dezelfde compositie reserveren als de uiteindelijke pagina.

Dus:

- titelruimte blijft staan
- hero-hoogte blijft voorspelbaar
- kaartgrids reserveren hun blokhoogte
- sticky footers behouden hun footprint

## 10. Legacy-vrije migratie

Dit onderdeel is verplicht. De migratie is niet klaar als alleen de zichtbare bugs weg zijn.

### 10.1 Verboden legacy-patronen na migratie

Na oplevering mogen deze patronen niet meer voorkomen voor interne navigatie:

- `component="a"` met intern `href`
- `<a href="/...">`
- Mantine `Button` met intern `href`
- Mantine `NavLink` met intern `href`
- generieke componenten die intern nog anchors renderen op basis van `actionHref`
- utility helpers die intern raw `href` doorgeven aan anchor-rendering

### 10.2 Geen dual path

We laten geen "oude route" en "nieuwe route" naast elkaar bestaan, bijvoorbeeld:

- intern soms `Link`
- intern soms `a`

Dat is precies de soort legacy die later opnieuw regressies veroorzaakt.

### 10.3 Geen stilliggende compatibiliteitslaag

Als een wrapper of helper puur bestaat om oude anchor-aanroepen te blijven ondersteunen, hoort die niet in de eindtoestand.

De eindtoestand moet schoon zijn:

- een intern linkpad
- een extern linkpad
- geen ambiguiteit

## 11. Routeprioriteit

### P0

- globale hoofdnav in `AppFrame`
- `Home` quick actions
- `Garage`
- `Tankbeurt toevoegen`
- `Kosten`

### P1

- `Ritten`
- `Onderhoud`
- detailschermen
- lege staten en sectie-acties

### P2

- error- en not-found routes
- minder frequente editflows

## 12. Migratieplan

### Fase 0: Audit

Doel:

- alle interne navigatie-entry points inventariseren
- intern versus extern classificeren
- huidige anchor-afhankelijkheden vastleggen

Output:

- lijst van bestanden die interne anchors renderen
- lijst van generieke componenten die oude navigatielogica verbergen

### Fase 1: Gedeelde primitives

Doel:

- introduceer gedeelde interne en externe linkprimitives
- maak Mantine-compatibele wrappers

Belangrijke regel:

- vanaf deze fase mag nieuwe code geen interne anchors meer toevoegen

### Fase 2: Shell en primaire navigatie

Doel:

- converteer `AppFrame`
- converteer bottom nav
- converteer hoofd-CTA's en primary route entry points

Verwachte winst:

- grootste merkbare verbetering in dagelijks routegevoel

### Fase 3: Screens en generieke componenten

Doel:

- converteer `ScreenSection`
- converteer `EmptyStateCard`
- converteer screen- en detailbuttons

Belangrijke cleanup:

- verwijder anchor-branches uit generieke componenten

### Fase 4: Loading architecture

Doel:

- voeg `loading.tsx` toe aan P0- en P1-routes
- bouw skeletons die lijken op definitieve layouts

### Fase 5: Legacy kill

Doel:

- verwijder resterende interne anchorpatronen
- verwijder tijdelijke compatibiliteitscode
- voeg repo-brede guardrails toe

## 13. Guardrails tegen nieuwe legacy

### 13.1 Repo-brede grepcheck

Er moet een expliciete repo-check komen die interne anchorpatronen zichtbaar maakt.

Voorbeelden van te controleren patronen:

- `component="a"`
- `<a href="/`
- `href="/`

De check mag geen false sense of safety geven; de resultaten moeten handmatig beoordeeld worden op intern versus extern.

### 13.2 Lintregel of CI-regel

Na de migratie hoort er een blijvende guardrail te zijn in lint of CI die voorkomt dat interne anchors terugkomen.

Minimaal doel:

- een build of check faalt wanneer verboden interne anchorpatronen opnieuw worden ingevoerd

### 13.3 Documenteer uitzonderingen

Toegestane uitzonderingen moeten expliciet en klein zijn.

Bijvoorbeeld:

- `mailto:`
- `tel:`
- externe supportlink

Niet:

- "soms nog makkelijker in Mantine"

## 14. Loading en layout-stabiliteit

### 14.1 Paginastructuur moet tijdens laden herkenbaar blijven

Elke belangrijke route moet tijdens laden minstens tonen:

- paginatitelruimte
- hoofdsecties of cards op vaste hoogte
- plaats van primaire CTA

### 14.2 Geen springende footers

Sticky mobiele elementen zoals actievoeters moeten een vaste footprint houden tussen loading en loaded state.

### 14.3 Afbeeldingen en avatars reserveren hun ruimte

Avatar- en beeldblokken mogen niet pas na inhoudsbepaling hun maat krijgen.

Doel:

- geen verticale shift doordat media later "verschijnt"

### 14.4 Lists en grids laden in hun definitieve ritme

Skeletons voor lijsten moeten hetzelfde kolom- en kaartritme volgen als de echte inhoud.

## 15. Prestatie-intentie

Deze spec is geen pure styling-oefening. Ze ondersteunt ook performancegevoel.

Na migratie moet interne navigatie:

- minder zwaar aanvoelen
- sneller reageren op klik
- minder remount-achtig gedrag tonen
- beter gebruikmaken van App Router soft navigation en prefetch

## 16. Acceptatiecriteria

De migratie is pas geslaagd als al het volgende waar is:

- gewone interne app-navigatie gebruikt `next/link`
- de hoofdnav in `AppFrame` gebruikt geen interne anchors meer
- generieke componenten zoals sectie-acties en empty states renderen geen interne anchors meer
- `src` bevat geen hybride mix meer van oude en nieuwe interne navigatiepatronen
- P0-routes hebben stabiele loading states
- routewissels tussen hoofdschermen voelen visueel stabieler dan vandaag
- er is een controlemechanisme dat regressies tegenhoudt

## 17. Definition of done: geen legacy blijft plakken

De migratie is expliciet niet klaar zolang een van deze zaken nog bestaat:

- een intern `component="a"` patroon in `src`
- een intern `<a href="/...">` patroon in `src`
- een helper die nog de oude anchor-renderweg ondersteunt voor interne routes
- een component-API die intern nog op anchorbranches leunt
- geen guardrail in lint, CI of repo-check

Pas als deze lijst leeg is, is de navigatiemigratie afgerond.

## 18. Verificatieprotocol

### 18.1 Code-audit

Controleer repo-breed op:

- interne anchorpatronen
- direct `href="/..."`
- oude Mantine anchorcombinaties

### 18.2 UX-audit op mobiel

Test minstens:

- `Home -> Garage`
- `Garage -> Tankbeurt toevoegen`
- `Kosten -> Tankbeurt toevoegen`
- `Ritten -> Detail`
- `Onderhoud -> Nieuw`

Let op:

- voelt de klik direct?
- blijft de layout stabiel?
- is er nog zichtbaar verspringen?

### 18.3 Browser-audit

Controleer in devtools of een gewone interne klik niet meer als klassieke documentnavigatie voelt.

Doel:

- App Router transition
- geen onnodige full document reload voor gewone interne routes

## 19. Beslisregel voor toekomstige features

Elke nieuwe klikbare route-entry moet vooraf deze vraag beantwoorden:

1. Is dit intern of extern?
2. Welk gedeeld linkprimitief hoort hierbij?
3. Heeft de doelscherm-route een loading shell nodig?
4. Blijft de layout stabiel als data traag is?

Als dat niet duidelijk is, is de navigatie nog niet productierijp.
