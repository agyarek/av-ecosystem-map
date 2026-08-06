# Self-hosted fonts

All three families are licensed under the SIL Open Font License 1.1.

| File | Family | What it carries |
|---|---|---|
| `archivo-var.woff2` | Archivo (Omnibus-Type) | variable, wght 400-900, wdth 100-118 |
| `source-serif-4-var.woff2` | Source Serif 4 (Adobe) | variable, wght 400-700, roman |
| `source-serif-4-var-italic.woff2` | Source Serif 4 (Adobe) | variable, wght 400-700, italic |
| `plex-mono-400.woff2` | IBM Plex Mono | static 400 |
| `plex-mono-500.woff2` | IBM Plex Mono | static 500 |
| `plex-mono-600.woff2` | IBM Plex Mono | static 600 |

Total: 112KB. Budget: 160KB.

## Provenance

Extracted from the Fontsource npm packages (`@fontsource-variable/archivo` 5.3.0,
`@fontsource-variable/source-serif-4` 5.3.0, `@fontsource/ibm-plex-mono` 5.3.0),
latin subsets, then processed with fontTools:

1. Variable axes limited to the ranges the stylesheets and the poster's SVG
   text actually use (`varLib.instancer`): Archivo wght 400:900 + wdth 100:118,
   Source Serif 4 wght 400:700. Source Serif's opsz axis is dropped; nothing
   sets it and the default optical size is the text size.
2. Glyphs subset to the site's own character inventory: every codepoint found
   in the repo's HTML, JSON data and JS, plus all printable ASCII as a floor.

## The one gotcha

The glyph set is frozen. If a future data edit introduces a character outside
it (say a company name in Chinese, or a Turkish dotless i), that character
falls back to the system font rather than disappearing. If that starts
happening visibly, regenerate with the same recipe above and a refreshed
inventory.
