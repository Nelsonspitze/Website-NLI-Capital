# Website NLI Capital

Statische website van NLI Capital (nlicapital.nl). Handgeschreven HTML, CSS en
vanilla JavaScript. **Geen build step, geen templating, geen dependencies.**
Wat in de repo staat is wat de browser krijgt.

## Deploy

GitHub Pages, branch `main`, custom domain via `CNAME`. **Elke push naar `main`
staat binnen een minuut of twee live.** Er is geen staging en geen preview.
Controleer wijzigingen lokaal voordat je pusht:

```bash
python -m http.server 8000
# open http://localhost:8000
```

Assets worden geserveerd met `Cache-Control: max-age=600`. Na een wijziging aan
`css/style.css` of `js/main.js` zien terugkerende bezoekers de oude versie nog
tot tien minuten. Test daarom altijd met een harde herlaad.

## De belangrijkste valkuil: geen templating

Nav en footer staan letterlijk in elk HTML-bestand. Een wijziging aan de footer
raakt **41 bestanden** in drie varianten van relatief pad (`privacy.html`,
`../privacy.html`, `../../privacy.html`). Doe dat met een script, nooit met de
hand, en controleer de uitkomst met `git diff --stat`.

Let daarbij op:

- **Drie nieuwsartikelen hebben een afwijkende footer** met verouderde gegevens
  (`info@nlicapital.nl` in plaats van `nli-capital@nlinvesteert.nl`, en een oude
  LinkedIn-URL): `nieuws/fonds-1-final-close.html`,
  `nieuws/quinnect-participatie.html`, `nieuws/incompanymedia-add-on.html`.
- **Drie bestanden hebben helemaal geen sitefooter**: de redirect-stubs
  `nieuws/hetraco-participatie.html`, `nieuws/team-update.html` en
  `nieuws/turner-platform-participatie.html`.
- **Drie bestanden hebben een `<footer>` binnen een `<blockquote>`** (bronvermelding
  bij een citaat), hoger in het document dan de sitefooter: `compagnon.html`,
  `nieuws/steenkamp-automatisering-add-on.html`,
  `nieuws/buy-and-build-uitgelegd.html`. Een script dat "de eerste `<footer>`"
  pakt, pakt daar het verkeerde blok.
- **`nli-capital-design-guide.html` heeft CRLF-regeleindes en een BOM**, als enige
  van de 45 HTML-bestanden. Een zoekstring met `\n` matcht daar niet. Gebruik
  `\r?\n` in je patroon en behoud de BOM bij het terugschrijven.

## Een nieuwsbericht of blog toevoegen

Raakt altijd dezelfde bestanden:

1. `nieuws/<slug>.html` — kopieer een bestaand artikel als template. Voor een blog
   is `nieuws/buy-and-build-uitgelegd.html` de beste basis. Werk `<title>`,
   description, alle `og:`-tags, `canonical` en het JSON-LD-blok bij.
2. `nieuws.html` — kaart bovenaan de `.news-grid`, nieuwste eerst. De
   `data-category` bepaalt het filter en moet een van de bestaande waarden zijn:
   `participatie`, `add-on`, `fonds`, `team`, `blog`.
3. De portfoliopagina van de betrokken deelneming, als het bericht daarover gaat
   (nieuwskaart en eventuele tellers).
4. `sitemap.xml` — nieuwe `<url>`-entry met `lastmod`.

## Beeld

Nooit camerabestanden rechtstreeks committen. Haal elke nieuwe foto door
`tools/optimize-images.py`; de doelbreedtes staan in het script. Richtlijn: 2x de
CSS-weergavebreedte. Elke `<img>` krijgt `loading="lazy"`, `decoding="async"` en
een `width`/`height` die klopt met het echte bestand.

Portfoliofoto's bestaan in twee maten: `<naam>-photo.jpg` (kaart, 1200px) en
`<naam>-hero.jpg` (paginabreed, 1920px).

## CSS

`css/style.css` is één bestand met genummerde secties. De nummering is niet
consistent (28 en 30 komen twee keer voor) en de laatste secties zijn ongenummerd.
Hernummer niet, dat geeft alleen ruis in de diff. Voeg nieuwe secties onderaan toe
in dezelfde commentaarvorm.

Designtokens staan in `:root`. Gebruik ze in plaats van losse waarden:
`--color-primary` (#007880), `--color-secondary` (#E73331), `--color-text`,
`--color-text-light`, `--space-1` t/m `--space-16`, `--radius`, `--font-size-*`.
Font is Manrope, geladen via een `<link>` in de `<head>` van elke pagina.

Hoogste z-index-waarden: `.cookie-banner` 1100, `.nav` 1000, mobiele menu-overlay
999. Blijf daaronder tenzij je een goede reden hebt.

Knopklassen bestaan al: `.btn` plus `.btn-primary`, `.btn-secondary`,
`.btn-white` en `.btn-outline-light` (de laatste twee voor donkere achtergronden).

## JavaScript

`js/main.js` is vanilla JS zonder dependencies, geladen met `defer`. Het grootste
deel zit in één `DOMContentLoaded`-handler met genummerde secties. **Een uncaught
exception daarin stopt alles wat erna komt**, en er zitten al een paar plekken
zonder null-check. Zet nieuwe, op zichzelf staande functionaliteit daarom als
losse IIFE onder die handler, zoals de cookiebanner in sectie 11.

Commentaar in `main.js` is Engels, in de nieuwere CSS deels Nederlands. Volg wat
er in het bestand staat dat je aanpast.

## Analytics en cookies

Google Analytics 4 (`G-JBQ6S0Z5GM`) staat in de `<head>` van 42 van de 45
HTML-bestanden, met Consent Mode v2 en alles standaard op `denied`. Het blok is
**byte-identiek** in alle 42 bestanden; houd dat zo, anders wordt een volgende
bulkwijziging onmogelijk.

De banner staat in `js/main.js` en `css/style.css`, de keuze in
`localStorage['nlic-cookieconsent']` met een geldigheid van twaalf maanden. De
verlooptermijn staat op twee plekken (het inline `<head>`-blok en `main.js`) en
moet gelijk blijven.

Wie iets toevoegt dat cookies zet of data naar derden stuurt, past **ook**
`privacy.html` aan. Die verklaring moet blijven kloppen; dat is een AVG-verplichting
en het was eerder al een keer misgegaan.

## Tekstconventies

- Zakelijke toon, u-vorm in publieksteksten.
- **Geen gedachtestreepjes** in lopende tekst.
- Geen financieringsdetails uit investeerdersbrieven op de publieke site
  (bijvoorbeeld namen van debt funds).
- Bedrijfsnamen voluit: Interparts Online, ITUM Solutions, Holland ICT Groep.
  Assets van Holland ICT Groep gebruiken de slug `hig-`, de pagina heet
  `portfolio/holland-ict-groep.html`.
- Controleer data en cijfers tegen wat er al op de site staat voordat je ze
  overneemt uit aangeleverde tekst.

## Commits

Berichten in het Nederlands, in de gebiedende of voltooide vorm, met een korte
toelichting op het waarom als dat niet vanzelf spreekt. Splits ongerelateerd werk
in aparte commits.
