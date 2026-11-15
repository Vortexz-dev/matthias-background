import '@fontsource-variable/cormorant-garamond';
import '@fontsource-variable/cormorant-garamond/wght-italic.css';
import '@fontsource-variable/source-sans-3';
import './style.css';
import { connectViewer } from './viewer.js';
import { connectScroll } from './scroll.js';
import { connectSoundtrack } from './soundtrack.js';

const viewer = connectViewer();
const soundtrack = connectSoundtrack(document.querySelector('.sound-toggle'));
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let activeMood = 'intro';
let atmosphere;

async function activateAtmosphere() {
  if (motion.matches || atmosphere) return;
  const { createAtmosphere } = await import('./atmosphere.js');
  if (motion.matches || atmosphere) return;
  atmosphere = createAtmosphere(motion, viewer);
  atmosphere.setMood(activeMood);
}

connectScroll(motion, (mood) => {
  activeMood = mood;
  atmosphere?.setMood(mood);
}, soundtrack.setChapter);

motion.addEventListener('change', activateAtmosphere);
activateAtmosphere();
