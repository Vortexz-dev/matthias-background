import assert from 'node:assert/strict';
import { access, readdir } from 'node:fs/promises';
import { chapters, scenes } from '../src/story.mjs';
import { imageDimensions } from '../src/dimensions.mjs';
import { renderStory } from '../src/render.mjs';

assert.equal(chapters.length, 7);
assert.equal(scenes.length, 38);
const html = renderStory('/the-pink-lotus/');
const references = [...html.matchAll(/data-full="([^"]+)"/g)].map((match) => match[1]);
assert.deepEqual(references, scenes.map(({ id }) => `/the-pink-lotus/originals/${id}.png`));
const originals = await readdir(new URL('../public/originals/', import.meta.url));
assert.deepEqual(originals, scenes.map(({ id }) => `${id}.png`));
for (const scene of scenes) {
  assert.ok(scene.alt && scene.title);
  assert.ok(scene.number === 1 || scene.chapter >= 0 && scene.prose);
  assert.ok(imageDimensions[scene.id].every((dimension) => dimension > 0));
  for (const width of [820, 1440, 1920]) {
    await access(new URL(`../public/frames/${scene.id}-${width}.webp`, import.meta.url));
  }
}
console.log('Verified seven chapters, 38 original images in sequence, and 114 optimized images.');
