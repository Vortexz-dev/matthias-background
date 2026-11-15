const limit = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const camera = {
  winter: [13, 2, .034],
  hearth: [9, 1, .024],
  still: [0, 0, 0],
  wind: [8, 7, .028],
  arena: [12, -8, .036],
  impact: [8, 9, .042],
  lotus: [13, -5, .04],
  handover: [0, 0, 0],
  candle: [7, 3, .021],
  smoke: [5, 0, .017],
  dawn: [8, -2, .032],
  after: [4, 0, .014],
};

export function connectScroll(motion, onMood) {
  const scrollProgress = document.querySelector('.reading-progress span');
  const intro = document.querySelector('.prologue');
  const elements = document.querySelectorAll('[data-mood]');
  const nearby = new Set([intro]);
  let scheduled = false;
  let previousMood;

  function paint() {
    scheduled = false;
    const viewport = window.innerHeight;
    const doc = document.documentElement;
    scrollProgress.style.transform = `scaleX(${limit(window.scrollY / Math.max(1, doc.scrollHeight - viewport))})`;
    const opening = motion.matches ? 0 : limit(window.scrollY / (viewport * .74));
    intro.style.setProperty('--opening', opening.toFixed(3));
    let nearest;
    let distance = Infinity;
    for (const element of nearby) {
      const bounds = element.getBoundingClientRect();
      if (bounds.bottom < 0 || bounds.top > viewport) continue;
      const shot = element.querySelector('.shot');
      const focus = shot?.getBoundingClientRect() ?? bounds;
      const center = focus.top + focus.height * .5;
      const proximity = Math.abs(center - viewport * .45);
      if (proximity < distance) {
        nearest = element;
        distance = proximity;
      }
      if (!shot) continue;
      const mood = element.dataset.mood;
      const [y, x, zoom] = camera[mood] ?? camera.still;
      const phase = motion.matches ? 0 : limit((viewport * .55 - center) / viewport, -.62, .62);
      const amplitude = viewport >= 720 ? 1 : .45;
      const shake = mood === 'impact' && !motion.matches ? Math.sin(phase * 83) * Math.exp(-55 * (phase - .1) ** 2) * 2 : 0;
      element.style.setProperty('--camera-y', `${(phase * y * amplitude).toFixed(2)}px`);
      element.style.setProperty('--camera-x', `${((phase * x + shake) * amplitude).toFixed(2)}px`);
      element.style.setProperty('--camera-scale', motion.matches || !zoom ? '1' : (1 + zoom * amplitude * (1 + phase)).toFixed(4));
      element.style.setProperty('--exposure', motion.matches ? '1' : String(.84 + limit(1 - Math.abs(phase) * 2.5) * .16));
      element.style.setProperty('--bloom', motion.matches ? '.15' : String(limit(.17 + phase * .48, .04, .44)));
    }
    const mood = nearest?.dataset.mood ?? 'still';
    if (mood !== previousMood) {
      previousMood = mood;
      onMood(mood);
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(paint);
  }
  const observer = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      if (isIntersecting) nearby.add(target);
      else nearby.delete(target);
    }
    schedule();
  }, { rootMargin: '15% 0px', threshold: 0 });
  for (const element of elements) observer.observe(element);

  const textObserver = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      if (!motion.matches) target.animate(
        [{ opacity: .55, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 680, easing: 'cubic-bezier(.2,.6,.35,1)' },
      );
      textObserver.unobserve(target);
    }
  }, { threshold: .14 });
  document.querySelectorAll('.chapter-title h2, .caption').forEach((element) => textObserver.observe(element));
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  motion.addEventListener('change', schedule);
  schedule();
}
