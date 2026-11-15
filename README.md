# The Pink Lotus

A Turkish-language Inoraxium story about Matthias. All 268 paragraphs of the Word manuscript are rendered in their original order, including the title page, contents, chapter headings, and scene breaks. The scene data places the 38 numbered illustrations beside the matching manuscript passages. The finale uses the supplied Matthias3 artwork.

## Run locally

Use Node.js 22 and run:

```sh
npm ci
npm run check
npm run dev
```

`npm run build` produces the static site in `dist`. Use `npm run preview` to preview that build. The default relative Vite base supports GitHub Pages repository subpaths as well as root domains. For an explicit base, set `PAGES_BASE` to the leading- and trailing-slash path before building.

## Publish on GitHub Pages

1. Push the project to a repository with `main` as its default branch.
2. Open the repository’s **Settings → Pages** and select **GitHub Actions** under **Source**.
3. In **Actions**, run **Deploy The Pink Lotus**. Future pushes to `main` run it automatically.
4. Open the deployment’s `github-pages` environment URL.

The website’s WebP variants are in `public/frames`. The full-resolution lightbox loads the supplied PNG from `public/originals` on demand. The site reads the imported paragraphs from `src/manuscript.json`. The chapter soundtracks are in `public/songs`.

The HTML is generated at build time. Native scrolling drives camera movement, image layering, light, text entrances, and chapter tracking. Canvas handles weather, embers, mist, and distant petals. Three.js adds foreground petals and particles in depth on capable desktops, with a Canvas fallback. The site respects the visitor’s reduced-motion setting.

Music begins when the reader enables it. Each chapter track loops and crossfades to the next or previous track at the chapter boundary. The Web Audio mix applies a short, quiet room response and subtle high-frequency roll-off.
