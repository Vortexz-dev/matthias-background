const clamp = (number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, number));

const movement = {
  winter: [29, 16, .081], hearth: [20, -12, .058], still: [5, 2, .014],
  wind: [17, 34, .088], arena: [19, -32, .092], impact: [19, 30, .10],
  handover: [13, -7, .022], lotus: [23, 19, .069], candle: [11, -12, .044],
  smoke: [10, 8, .044], dawn: [25, -15, .065], after: [10, 3, .02],
};

export function connectScroll(motion, onMood, onChapter) {
  const progress = document.querySelector('.reading-progress span');
  const intro = document.querySelector('.prologue');
  const chapterLabel = document.querySelector('.current-chapter');
  const chapters = [...document.querySelectorAll('.chapter')].map((section) => ({
    section, roman: section.querySelector('.chapter-roman').textContent,
    title: section.querySelector('.chapter-words').textContent,
  }));
  const nearby = new Set([intro]);
  let waiting = false;
  let lastMood;
  let lastChapter;
  let transitionTrack = 1;

  function render() {
    waiting = false;
    const viewport = innerHeight;
    const position = scrollY;
    const readingLine = viewport * .39;
    const reduced = motion.matches;
    const amplitude = innerWidth > 860 ? 1 : .47;
    const metrics = [];
    for (const element of nearby) {
      metrics.push({
        element, bounds: element.getBoundingClientRect(),
        shot: element.querySelector('.artwork')?.getBoundingClientRect(),
      });
    }
    // The reading line belongs to exactly one chapter, even when scrolling up.
    let chapterIndex = chapters.length - 1;
    while (chapterIndex >= 0 && chapters[chapterIndex].section.getBoundingClientRect().top > readingLine) chapterIndex--;
    progress.style.transform = `scaleX(${clamp(position / Math.max(1, document.documentElement.scrollHeight - viewport))})`;
    intro.style.setProperty('--opening', reduced ? '0' : clamp(position / (viewport * .72)).toFixed(3));
    let mood = 'still';
    let nearest = Infinity;

    for (const { element, bounds, shot } of metrics) {
      const containsReader = bounds.top <= readingLine && bounds.bottom > readingLine;
      const distance = containsReader ? -1 : Math.min(Math.abs(bounds.top - readingLine), Math.abs(bounds.bottom - readingLine));
      const mode = element.dataset.mood;
      if (bounds.bottom > 0 && bounds.top < viewport && distance < nearest) {
        nearest = distance;
        mood = mode;
      }
      const frame = shot ?? bounds;
      const center = frame.top + frame.height / 2;
      const offset = reduced ? 0 : clamp((readingLine - center) / viewport, -.72, .72);
      const [y, x, scale] = movement[mode] ?? movement.lotus;
      const jolt = mode === 'impact' ? 4 * Math.sin(offset * 65) * Math.exp(-65 * (offset - .1) ** 2) : 0;
      const strength = reduced ? 1 : clamp(1 - Math.abs(offset) * .79, .36);
      element.style.setProperty('--scene-offset', offset.toFixed(3));
      element.style.setProperty('--scene-progress', clamp(.52 + offset).toFixed(3));
      element.style.setProperty('--scene-bright', strength.toFixed(3));
      element.style.setProperty('--lens-y', `${(offset * y * amplitude).toFixed(2)}px`);
      element.style.setProperty('--lens-x', `${((offset * x + jolt * Number(!reduced)) * amplitude).toFixed(2)}px`);
      element.style.setProperty('--camera-scale', reduced ? '1' : (1 + (.8 + offset) * scale * amplitude).toFixed(3));
    }
    if (mood !== lastMood) {
      lastMood = mood;
      onMood(mood);
    }
    if (chapterIndex !== lastChapter) {
      lastChapter = chapterIndex;
      const active = chapters[chapterIndex];
      chapterLabel.textContent = active ? `${active.roman}  ·  ${active.title}` : '';
      chapterLabel.lang = 'en';
      const track = chapterIndex < 0 ? 1 : chapterIndex + 1;
      if (track !== transitionTrack) {
        transitionTrack = track;
        onChapter(track);
      }
    }
  }

  function schedule() {
    if (waiting) return;
    waiting = true;
    requestAnimationFrame(render);
  }
  const observer = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      target.classList.toggle('is-near', isIntersecting);
      if (isIntersecting) nearby.add(target);
      else nearby.delete(target);
    }
    schedule();
  }, { rootMargin: '25% 0px' });
  document.querySelectorAll('[data-mood]').forEach((element) => observer.observe(element));

  const textObserver = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      target.classList.add('arrived');
      textObserver.unobserve(target);
    }
  }, { threshold: .18 });
  document.querySelectorAll('.chapter-title, .scene .artwork, .ink, .epilogue-title').forEach((element) => textObserver.observe(element));
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  motion.addEventListener('change', schedule);
  schedule();
}
