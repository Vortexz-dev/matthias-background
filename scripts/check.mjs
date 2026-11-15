import assert from 'node:assert/strict';
import { access, readdir } from 'node:fs/promises';
import { chapters, manuscript, scenes } from '../src/story.mjs';
import { imageDimensions } from '../src/dimensions.mjs';
import { renderStory } from '../src/render.mjs';

assert.equal(chapters.length, 7);
assert.equal(scenes.length, 38);
assert.equal(manuscript.length, 268);
const html = renderStory('/matthias-background/');
assert.deepEqual([...html.matchAll(/data-ms="(\d+)"/g)].map((match) => Number(match[1])), manuscript.map((_, i) => i));
const references = [...html.matchAll(/data-full="([^"]+)"/g)].map((match) => match[1]);
assert.deepEqual(references, [...scenes.map(({ id }) => `/matthias-background/originals/${id}.png`), '/matthias-background/originals/Matthias3.png']);
const originals = await readdir(new URL('../public/originals/', import.meta.url));
assert.deepEqual(originals, [...scenes.map(({ id }) => `${id}.png`), 'Matthias3.png']);
for (const scene of scenes) {
  assert.ok(scene.alt && scene.title && scene.mood);
  assert.ok(imageDimensions[scene.id].every((dimension) => dimension > 0));
}
for (const filename of [...scenes.map(({ id }) => id), 'finale']) {
  for (const width of [820, 1440, 1920]) {
    await access(new URL(`../public/frames/${filename}-${width}.webp`, import.meta.url));
  }
}
for (const chapter of chapters) {
  await access(new URL(`../public/songs/${chapter.number}.mp3`, import.meta.url));
}
console.log('Verified 268 manuscript paragraphs, 7 chapters and tracks, and every scene and finale asset.');
