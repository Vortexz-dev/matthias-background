import { chapters, cover, manuscript } from './story.mjs';
import { imageDimensions } from './dimensions.mjs';

const escape = (value) => value.replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[c]);

function titleWords(title) {
  return title.split(' ').map((word, i) => `<span class="title-word" style="--word:${i}">${escape(word)}</span>`).join(' ');
}

function image(base, scene, first = false) {
  const path = `${base}frames/${scene.file ?? scene.id}`;
  const [width, height] = scene.dimensions ?? imageDimensions[scene.id];
  const sizes = scene.layout === 'diptych' && !first ? '(max-width: 860px) 100vw, 53vw' : '100vw';
  const original = scene.original ?? `${scene.id}.png`;
  return `<button class="frame" type="button" data-full="${base}originals/${original}" data-title="${escape(scene.title)}" aria-label="${escape(scene.title)} — tam boyut aç">
    <img src="${path}-1440.webp" srcset="${path}-820.webp 820w, ${path}-1440.webp 1440w, ${path}-1920.webp ${width}w"
      sizes="${sizes}" width="${width}" height="${height}" alt="${escape(scene.alt)}"
      ${first ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'} draggable="false">
    <span class="frame-open" aria-hidden="true"><i></i></span>
  </button>`;
}

function composition(base, scene, first = false) {
  const backplate = `${base}frames/${scene.file ?? scene.id}-820.webp`;
  return `<figure class="shot ${scene.focus ? 'shot--depth' : ''}" style="--plate:url('${backplate}');--focus:${scene.focus ?? '50% 54%'}">
    <div class="plate" aria-hidden="true"></div>
    <div class="artwork">
      ${image(base, scene, first)}
      ${scene.focus ? '<span class="depth-plane" aria-hidden="true"></span>' : ''}
      <div class="lighting" aria-hidden="true"><i></i><i></i></div>
      <div class="frame-mark" aria-hidden="true"></div>
    </div>
    ${!first ? `<figcaption>${escape(scene.title)}</figcaption>` : ''}
  </figure>`;
}

const emphasis = new Set([20, 41, 51, 71, 91, 103, 135, 151, 180, 197, 200, 220, 231, 237, 246, 255, 265, 267]);

function paragraph(index, first) {
  const content = manuscript[index];
  if (content === '❦') return `<p class="manuscript-break" aria-hidden="true" data-ms="${index}">${content}</p>`;
  const type = emphasis.has(index) ? 'manuscript-emphasis' : first ? 'manuscript-initial' : '';
  return `<p class="${type} ink" data-ms="${index}">${escape(content)}</p>`;
}

function sceneMarkup(base, scene, opener) {
  let first = opener;
  let prose = '';
  for (let index = scene.start; index < scene.end; index++) {
    prose += paragraph(index, first);
    if (manuscript[index] !== '❦') first = false;
  }
  return `<article class="scene scene--${scene.layout}" id="sahne-${scene.id}" data-mood="${scene.mood}" data-scene="${scene.id}" aria-label="${escape(scene.title)}">
    <div class="scene-image">
      ${composition(base, scene)}
    </div>
    <div class="manuscript">${prose}</div>
  </article>`;
}

function chapterMarkup(base, chapter) {
  return `<section class="chapter" data-track="${chapter.number}" data-theme="${chapter.mood}" aria-labelledby="chapter-${chapter.roman}">
    <header class="chapter-title" data-mood="${chapter.mood}" style="--plate:url('${base}frames/${chapter.scenes[0].id}-820.webp')">
      <div class="chapter-veil" aria-hidden="true"></div>
      <div class="chapter-name">
        <p class="eyebrow chapter-place">${chapter.place}</p>
        <h2 id="chapter-${chapter.roman}" lang="en" data-ms="${chapter.heading}">
          <span class="chapter-roman">${chapter.roman}</span><span class="visually-hidden"> - </span><span class="chapter-words">${titleWords(chapter.title)}</span>
        </h2>
        <span class="chapter-rule" aria-hidden="true"></span>
      </div>
    </header>
    ${chapter.scenes.map((scene, index) => sceneMarkup(base, scene, index === 0)).join('')}
  </section>`;
}

function contents() {
  return `<nav class="contents" aria-labelledby="contents-title">
    <div><span class="lotus-seal" aria-hidden="true">❀</span><h2 id="contents-title" data-ms="6">${manuscript[6]}</h2></div>
    <ol>${chapters.map((chapter, index) => `<li><a href="#chapter-${chapter.roman}" data-ms="${7 + index}" lang="en"><span>${chapter.roman}</span><span class="visually-hidden"> - </span><span>${chapter.title}</span></a></li>`).join('')}</ol>
  </nav>`;
}

const finale = {
  id: 'finale', file: 'finale', original: 'Matthias3.png', title: 'Matthias',
  alt: 'Mavi-gümüş zırhlı Matthias, taş basamaklarda kılıcının üzerine eğiliyor.',
  dimensions: [1913, 822], layout: 'panorama', focus: '42% 52%',
};

export function renderStory(base) {
  return `<div class="reading-progress" aria-hidden="true"><span></span></div>
  <header class="hud">
    <a class="hud-home" href="#baslangic">INORAXIUM</a>
    <span class="current-chapter" aria-hidden="true"></span>
    <nav class="hud-actions" aria-label="Okuma araçları">
      <a class="contents-link" href="#contents-title">İçindekiler</a>
      <button class="sound-toggle" type="button" aria-pressed="false" data-songs="${base}songs/">
        <span class="sound-icon" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="sound-label">Müziği aç</span>
      </button>
      <span class="sound-status visually-hidden" role="status"></span>
    </nav>
  </header>
  <main>
    <canvas class="weather weather--back" aria-hidden="true"></canvas>
    <section class="prologue" id="baslangic" data-mood="intro" data-scene="01" aria-labelledby="main-title">
      <div class="prologue-stage">
        ${composition(base, cover, true)}
        <div class="prologue-shade" aria-hidden="true"></div>
        <div class="prologue-title">
          <p class="imprint" data-ms="0">${manuscript[0]}</p>
          <span class="lotus-seal" data-ms="1" aria-hidden="true">${manuscript[1]}</span>
          <h1 id="main-title" lang="en" data-ms="2">The Pink <em>Lotus</em></h1>
          <p class="prologue-subtitle" data-ms="3">${escape(manuscript[3])}</p>
        </div>
        <div class="prologue-end">
          <blockquote data-ms="4">${escape(manuscript[4])}</blockquote>
          <p class="eyebrow" data-ms="5">${escape(manuscript[5])}</p>
          <a class="scroll-cue" href="#contents-title" aria-label="İçindekilere kaydır"><span aria-hidden="true">↓</span></a>
        </div>
      </div>
    </section>
    ${contents()}
    ${chapters.map((chapter) => chapterMarkup(base, chapter)).join('')}
    <footer class="epilogue" data-mood="lotus">
      ${composition(base, finale)}
      <div class="epilogue-title">
        <span class="lotus-seal" aria-hidden="true">❀</span>
        <p lang="en">The Pink <em>Lotus</em></p>
        <span class="eyebrow">Son</span>
      </div>
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
