import { chapters, scenes } from './story.mjs';
import { imageDimensions } from './dimensions.mjs';

const escape = (value) => value.replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[c]);

function image(base, scene, first = false) {
  const path = `${base}frames/${scene.id}`;
  const [width, height] = imageDimensions[scene.id];
  const sizes = scene.layout === 'cover' || ['wide', 'monument'].includes(scene.layout)
    ? '100vw' : '(max-width: 720px) 100vw, 72vw';
  return `<button class="frame" type="button" data-full="${base}originals/${scene.id}.png" data-title="${escape(scene.title)}" aria-label="${escape(scene.title)} — tam boyut aç">
    <img src="${path}-1440.webp" srcset="${path}-820.webp 820w, ${path}-1440.webp 1440w, ${path}-1920.webp ${width}w"
      sizes="${sizes}" width="${width}" height="${height}" alt="${escape(scene.alt)}"
      ${first ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'} draggable="false">
    <span class="frame-open" aria-hidden="true"><i></i></span>
  </button>`;
}

function sceneMarkup(base, scene) {
  return `<article class="scene scene--${scene.layout}" id="sahne-${scene.id}" data-mood="${scene.mood}" data-scene="${scene.id}" aria-labelledby="title-${scene.id}">
    <div class="shot">
      ${image(base, scene)}
      <div class="light" aria-hidden="true"></div>
    </div>
    <div class="caption">
      <h3 id="title-${scene.id}">${escape(scene.title)}</h3>
      <p>${escape(scene.prose)}</p>
      ${scene.quote ? `<blockquote>“${escape(scene.quote)}”</blockquote>` : ''}
    </div>
  </article>`;
}

function chapterMarkup(base, chapter, index) {
  return `<section class="chapter chapter--${chapter.mood}" aria-labelledby="chapter-${chapter.roman}">
    <header class="chapter-title" data-mood="${chapter.mood}" data-chapter="${index + 1}">
      <div class="chapter-seal" aria-hidden="true">${chapter.roman}</div>
      <p class="eyebrow">${chapter.place}</p>
      <h2 id="chapter-${chapter.roman}" lang="en">${chapter.title}</h2>
      <span class="chapter-rule" aria-hidden="true"></span>
    </header>
    ${scenes.filter((scene) => scene.chapter === index).map((scene) => sceneMarkup(base, scene)).join('')}
  </section>`;
}

export function renderStory(base) {
  return `<div class="reading-progress" aria-hidden="true"><span></span></div>
  <main>
    <canvas class="weather weather--back" aria-hidden="true"></canvas>
    <section class="prologue" data-mood="intro" data-scene="01" aria-labelledby="main-title">
      <div class="prologue-stage">
        ${image(base, scenes[0], true)}
        <div class="prologue-shade" aria-hidden="true"></div>
        <div class="masthead">
          <span class="imprint"><span aria-hidden="true" class="diamond"></span> INORAXIUM</span>
          <span lang="en">MATTHIAS’ STORY</span>
        </div>
        <div class="prologue-title">
          <div class="ornament" aria-hidden="true"><i></i><span>✧</span><i></i></div>
          <h1 id="main-title" lang="en">The Pink <em>Lotus</em></h1>
        </div>
        <div class="prologue-end">
          <blockquote>“Lotus çamurdan doğar ama çamura bulanmaz.”</blockquote>
          <a class="scroll-cue" href="#chapter-I">Aşağı kaydır <span aria-hidden="true">↓</span></a>
        </div>
      </div>
    </section>
    ${chapters.map((chapter, index) => chapterMarkup(base, chapter, index)).join('')}
    <footer class="epilogue" data-mood="after">
      <div class="ornament" aria-hidden="true"><i></i><span>✧</span><i></i></div>
      <p class="eyebrow">INORAXIUM</p>
      <p lang="en">The Pink Lotus</p>
      <p class="eyebrow">Son</p>
    </footer>
  </main>
  <canvas class="weather weather--front" aria-hidden="true"></canvas>
  <dialog class="lightbox" aria-labelledby="image-title">
    <div class="viewer-head">
      <p id="image-title"></p>
      <button type="button" class="viewer-close" aria-label="Görseli kapat" autofocus>×</button>
    </div>
    <div class="viewer-stage"><img alt="" hidden><p role="status"></p></div>
  </dialog>`;
}
