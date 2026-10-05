# Self-hosted fonts

Served from this folder (and precached by the service worker) so the app looks
the same offline and makes no request to a font CDN.

| File | Font | Licence |
| --- | --- | --- |
| `nunito-latin.woff2`, `nunito-latin-ext.woff2` | Nunito (variable, weights 500-900), by Vernon Adams, Jacques Le Bailly, Manvel Shmavonyan, Alexei Vanyashin | SIL Open Font License 1.1 |
| `opendyslexic-400.woff2`, `opendyslexic-700.woff2` | OpenDyslexic (Regular, Bold), by Abelardo Gonzalez | SIL Open Font License 1.1, see `OpenDyslexic-LICENSE.txt` |

Nunito was fetched from Google Fonts (v32); OpenDyslexic from the
`@fontsource/opendyslexic` 5.3.0 npm package. Both licences allow bundling and
redistribution with the app.
