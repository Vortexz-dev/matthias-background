import '@fontsource-variable/cormorant-garamond';
import '@fontsource-variable/cormorant-garamond/wght-italic.css';
import '@fontsource-variable/source-sans-3';
import './style.css';
import { connectViewer } from './viewer.js';
import { connectScroll } from './scroll.js';

const viewer = connectViewer();
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
});

motion.addEventListener('change', activateAtmosphere);
activateAtmosphere();
