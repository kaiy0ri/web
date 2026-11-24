---
title: Open-source licences
description: The open-source software this site is built on, and the licence status of the site's own code.
order: 13
status: in-effect
updated: 2026-11-24
---

## Built on open source

This site exists because of other people's open-source work. The main pieces:

| Software | Used for | Licence |
| --- | --- | --- |
| [Astro](https://github.com/withastro/astro) | Building the site into static files | MIT |
| [TypeScript](https://github.com/microsoft/TypeScript) | The language the site and API are written in | Apache-2.0 |
| [Upptime](https://github.com/upptime/upptime) | The status page | MIT |
| [Newman](https://github.com/postmanlabs/newman) | Running the hourly API tests | Apache-2.0 |
| [Schibsted Grotesk](https://github.com/schibsted/schibsted-grotesk) | The font for headings and reading text | SIL Open Font License 1.1 |
| [Spline Sans Mono](https://github.com/SorkinType/SplineSansMono) | The monospace font for labels and the ASCII sky | SIL Open Font License 1.1 |

Astro brings in many smaller packages. The complete, exact list is in the repository's [`package-lock.json`](https://github.com/kaiy0ri/web/blob/main/package-lock.json), and each package carries its own licence file. These licences ask that their copyright notices be kept, and they are.

No fonts or images are loaded from third parties. The two fonts above are copied from the [Google Fonts repository](https://github.com/google/fonts/tree/main/ofl), cut down to Latin characters, and served from this site (`/fonts/`). The Open Font License allows that, including commercial use, as long as the fonts are not sold on their own and keep their copyright notice and licence. Both are inside each font file and next to it in `/fonts/`.

## This site's own code

The code is public but **not open source**: no licence file has been added, so it's all rights reserved by default. You're welcome to read it and learn from it. If that changes, a `LICENSE` file will be added to the repository and this page updated.

## If this changes

Before adding any dependency or bundled asset:

1. **Check its licence.** MIT, BSD, ISC and Apache-2.0 are fine. Copyleft licences (GPL, AGPL) carry sharing obligations. Read them before using, especially AGPL for anything run as a service.
2. **No licence means no permission.** Don't copy code that has none.
3. **Keep notices** and credit where the licence asks for it.
4. **Fonts, icons and images have licences too.** Check they allow commercial use.
5. **AI-generated code** can reproduce licensed code. Review it like any other contribution.
