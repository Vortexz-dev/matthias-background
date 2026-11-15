# The Pink Lotus

A Turkish-language Inoraxium story about Matthias. The seven English chapter titles come from the manuscript. The scene data follows the revised visual book from the cover through the Cold Deck notice. The on-page text is a condensed adaptation with selected manuscript quotations.

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

The website’s WebP variants are in `public/frames`. The full-resolution lightbox loads the supplied PNG from `public/originals` on demand. Character reference sheets and manuscript files are excluded from the repository.

The HTML is generated at build time. Native scrolling drives the camera cues and progress line. Canvas handles rain, mist, dust, and distant petals. Three.js adds foreground petals on capable desktops, with a Canvas fallback. The site respects the visitor’s reduced-motion setting.
