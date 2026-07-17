# stay-forever-migration

CLI-Tool zum Migrieren des Hörstatus von den alten, getrennten Stay-Forever-Feeds (offener Feed + Patreon/Steady-Feed) zum neuen einheitlichen Feed der **Stay Forever Plattform**.

Funktioniert generisch für beliebige PocketCasts-Feeds.

## Features

- Übernimmt "Gehört"- und "Angefangen"-Status inkl. Position
- Archiviert ungehörte+archivierte Episoden im Ziel-Feed
- Intelligentes Matching: exakter Titel, normalisiert, Präfix, Datum+Dauer
- Trockenlauf-Modus (`--dry-run`) zum Testen
- CSV-Export der Matching-Ergebnisse
- Interaktive Podcast-Auswahl

## Installation

```bash
npm install -g stay-forever-migration
```

Oder direkt mit npx:

```bash
npx stay-forever-migration
```

## Verwendung

```bash
# Interaktiver Modus
stay-forever-migration

# Trockenlauf (keine Änderungen)
stay-forever-migration --dry-run

# Mit CSV-Export
stay-forever-migration --dry-run -o report.csv
```

## Optionen

| Option | Beschreibung |
|--------|-------------|
| `--dry-run` | Nur simulieren, keine Änderungen vornehmen |
| `-o, --output <datei>` | Matching-Ergebnisse als CSV exportieren |
| `-h, --help` | Hilfe anzeigen |

## Unterstützte Apps

Aktuell wird nur **PocketCasts** unterstützt. Die Architektur ist aber so aufgebaut, dass weitere Podcast-Apps ergänzt werden können. Pull Requests sind herzlich willkommen!

## Wie funktioniert das Matching?

Episoden werden mit vier Strategien zugeordnet (in dieser Reihenfolge):

1. **Exakter Titel** – Titel stimmen 1:1 überein
2. **Normalisierter Titel** – Nach Entfernen von Sonderzeichen/Whitespace
3. **Präfix** – Alter Titel mit "Stay Forever - " Präfix im neuen Feed
4. **Datum + Dauer** – Gleiches Erscheinungsdatum und ähnliche Episodenlänge

## Voraussetzungen

- Node.js >= 18
- Ein PocketCasts-Account

## Entwicklung

```bash
pnpm install
pnpm build
pnpm dev          # Build + Run
pnpm dry-run      # Build + Run mit --dry-run
pnpm test         # Tests ausführen
```

## Lizenz

GPL-3.0 – siehe [LICENSE](LICENSE)
