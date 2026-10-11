# Self-hosted fonts

Served from this folder (and precached by the service worker) so the app looks
the same offline and makes no request to a font CDN.

| File | Font | Licence |
| --- | --- | --- |
| `inter-latin.woff2`, `inter-latin-ext.woff2` | Inter (variable, weights 100-900), by Rasmus Andersson; body and headings | SIL Open Font License 1.1 |
| `jetbrains-mono-latin.woff2` | JetBrains Mono (variable, weights 100-800), by JetBrains; labels, numbers and status chips | SIL Open Font License 1.1 |
| `opendyslexic-400.woff2`, `opendyslexic-700.woff2` | OpenDyslexic (Regular, Bold), by Abelardo Gonzalez; opt-in reading font | SIL Open Font License 1.1, see `OpenDyslexic-LICENSE.txt` |

Inter and JetBrains Mono come from the `@fontsource-variable/inter` and
`@fontsource-variable/jetbrains-mono` npm packages (5.3.0). OpenDyslexic came
from `@fontsource/opendyslexic` 5.3.0. All licences allow bundling and
redistribution with the app. (Nunito, used before the Console redesign, was
removed.)
