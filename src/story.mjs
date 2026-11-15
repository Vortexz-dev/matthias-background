import { readFileSync } from 'node:fs';
import { illustrations } from './illustrations.mjs';

export const manuscript = JSON.parse(readFileSync(new URL('./manuscript.json', import.meta.url), 'utf8'));

const sections = [
  { heading: 14, place: 'Priestella', mood: 'winter', starts: [15, 21, 27, 28, 34, 39] },
  { heading: 42, place: 'Priestella · Southmarch · Guildcross', mood: 'wind', starts: [43, 47, 52, 54, 56, 67, 70] },
  { heading: 72, place: 'Guildcross · Valemont Turnuvası', mood: 'arena', starts: [73, 83, 90, 95, 108, 114] },
  { heading: 119, place: 'Valemont Malikânesi', mood: 'lotus', starts: [120, 136, 143, 146, 154, 164] },
  { heading: 174, place: 'Valemont Malikânesi', mood: 'candle', starts: [175, 181, 189, 196, 199, 203] },
  { heading: 209, place: 'Guildcross · Batık Fener', mood: 'smoke', starts: [210, 218] },
  { heading: 229, place: 'Guildcross', mood: 'dawn', starts: [230, 249, 256, 257] },
];
const expansive = new Set([2, 9, 16, 19, 23, 25, 29, 31, 34, 35, 38]);
const focalPoints = { 1: '50% 72%', 9: '43% 55%', 16: '47% 36%', 23: '62% 66%', 35: '54% 64%', 37: '47% 55%' };

function getIllustration(number) {
  const [title, alt, mood] = illustrations[number - 1];
  return {
    title, alt, mood, number, id: String(number).padStart(2, '0'),
    layout: expansive.has(number) ? 'panorama' : 'diptych',
    focus: focalPoints[number],
  };
}

export const cover = getIllustration(1);
let number = 2;

export const chapters = sections.map((section, index) => {
  const { heading, place, mood, starts } = section;
  const [roman, title] = manuscript[heading].split(' - ');
  const end = sections[index + 1]?.heading ?? manuscript.length;
  const scenes = starts.map((start, i) => ({
    ...getIllustration(number++),
    start,
    end: starts[i + 1] ?? end,
  }));
  return { number: index + 1, heading, roman, title, place, mood, scenes };
});

export const scenes = [cover, ...chapters.flatMap((chapter) => chapter.scenes)];
