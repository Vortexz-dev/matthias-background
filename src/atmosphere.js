const profiles = {
  intro:    { rgb: '172,157,172', fog: .39, type: 'petal', count: 6, petals: 3, wind: .17 },
  winter:   { rgb: '181,200,217', fog: .47, type: 'rain', count: 72, wind: -.36, depth: .82 },
  hearth:   { rgb: '247,173,114', fog: .3, type: 'ember', count: 41, wind: .15, depth: .91 },
  still:    { rgb: '179,179,189', fog: .04, type: 'dust', count: 0, wind: .02 },
  wind:     { rgb: '190,206,223', fog: .27, type: 'dust', count: 48, wind: .93, depth: .66 },
  arena:    { rgb: '217,203,186', fog: .39, type: 'grit', count: 51, wind: .62, depth: .8 },
  impact:   { rgb: '217,203,186', fog: .39, type: 'grit', count: 65, wind: .95, depth: .96 },
  handover: { rgb: '233,213,224', fog: .16, type: 'petal', count: 5, petals: 3, wind: .13, depth: .27 },
  lotus:    { rgb: '222,176,204', fog: .26, type: 'petal', count: 15, petals: 8, wind: .22, depth: .32 },
  candle:   { rgb: '238,211,181', fog: .16, type: 'ember', count: 26, wind: .09, depth: .52 },
  smoke:    { rgb: '141,134,144', fog: .6, type: 'dust', count: 14, wind: .16, depth: .15 },
  dawn:     { rgb: '235,174,201', fog: .33, type: 'petal', count: 10, petals: 7, wind: .15, depth: .47 },
  after:    { rgb: '217,196,205', fog: .07, type: 'dust', count: 6, wind: .14 },
};

const wrap = (number, period) => ((number % period) + period) % period;

function smokeSprite() {
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = 160;
  const ctx = sprite.getContext('2d');
  for (let i = 0; i < 12; i++) {
    const x = 80 + Math.sin(i * 2.4) * 29;
    const y = 80 + Math.cos(i * 4.4) * 20;
    const gradient = ctx.createRadialGradient(x, y, 1, x, y, 47);
    gradient.addColorStop(0, 'rgba(210,204,217,.16)');
    gradient.addColorStop(.4, 'rgba(170,165,177,.08)');
    gradient.addColorStop(1, 'rgba(170,165,177,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - 47, y - 47, 94, 94);
  }
  return sprite;
}

function drawPetal(ctx, x, y, size, angle, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const color = ctx.createLinearGradient(-size, 0, size, size);
  color.addColorStop(0, '#f2d1dc');
  color.addColorStop(.63, '#de9bb5');
  color.addColorStop(1, '#875168');
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.bezierCurveTo(-size * 1.45, 0, -size * .5, -size * .95, size * .18, -size * 1.34);
  ctx.bezierCurveTo(size, -size * .55, size * .7, size * .48, 0, size);
  ctx.fill();
  ctx.restore();
}

export function createAtmosphere(motion, viewer) {
  const back = document.querySelector('.weather--back');
  const front = document.querySelector('.weather--front');
  const ctx = back.getContext('2d');
  const near = front.getContext('2d');
  if (!ctx || !near) return { setMood() {} };

  const sprite = smokeSprite();
  const weights = Object.fromEntries(Object.keys(profiles).map((mood) => [mood, 0]));
  const seeds = Array.from({ length: 72 }, () => ({
    x: Math.random(), y: Math.random(), scale: .28 + Math.random() * .72, spin: Math.random() * Math.PI * 2,
  }));
  let width, height, compact;
  let mood = 'intro';
  let frame = 0;
  let elapsed = 0;
  let last = 0;
  let petals;
  let tried3d = false;
  const quiet = matchMedia('(max-width: 720px), (update: slow)');

  function maybeLoad3d() {
    if (tried3d || compact || motion.matches) return;
    tried3d = true;
    import('./petals3d.js').then(({ createPetals }) => {
      try {
        petals = createPetals();
        petals.resize(width, height);
      } catch {
        petals = undefined;
      }
    }).catch(() => { petals = undefined; });
  }

  function resize() {
    compact = quiet.matches;
    width = innerWidth;
    height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, compact ? 1 : 1.5);
    for (const [canvas, context] of [[back, ctx], [front, near]]) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    petals?.resize(width, height);
    if (profiles[mood].petals) maybeLoad3d();
  }

  function drawProfile(profile, weight) {
    const { fog, count, type, rgb, wind } = profile;
    const layers = compact ? 3 : 5;
    if (fog * weight > .025) {
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < layers; i++) {
        const x = wrap(i * width * .36 + elapsed * (5 + i * 2), width * 1.5) - width * .52;
        const y = height * (.2 + i * .18) + Math.sin(elapsed * .13 + i) * 42;
        ctx.globalAlpha = fog * weight * (.7 + i * .08);
        ctx.drawImage(sprite, x, y, width * 1.13, height * (.36 + i * .06));
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    const total = Math.ceil(count * (compact ? .4 : 1));
    for (let i = 0; i < total; i++) {
      const { x, y, scale, spin } = seeds[i];
      const px = wrap(x * width + elapsed * wind * 90 * scale + Math.sin(elapsed * .75 + spin) * 19, width + 60) - 30;
      const speed = type === 'rain' ? 173 : type === 'petal' ? 36 : type === 'grit' ? 38 : type === 'ember' ? -47 : -11;
      const py = wrap(y * height + elapsed * speed * scale, height + 80) - 40;
      const alpha = weight * scale * (type === 'petal' ? .57 : type === 'rain' ? .46 : .4);
      if (type === 'petal') {
        drawPetal(ctx, px, py, 2 + scale * 6, spin + elapsed * .3, alpha);
      } else if (type === 'rain') {
        ctx.strokeStyle = `rgba(${rgb},${alpha})`;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + scale * 13, py - scale * 34);
        ctx.stroke();
      } else if (type === 'ember') {
        ctx.shadowBlur = 6;
        ctx.shadowColor = `rgba(${rgb},${alpha})`;
        ctx.fillStyle = `rgba(${rgb},${alpha * (.52 + .48 * Math.sin(elapsed * 3 + spin) ** 2)})`;
        ctx.beginPath();
        ctx.arc(px, py, .6 + scale * 1.65, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = `rgba(${rgb},${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, .4 + scale * (type === 'grit' ? 1.3 : 1.1), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function render(now) {
    frame = 0;
    const dt = last ? Math.min(.05, (now - last) / 1000) : 1 / 60;
    last = now;
    elapsed += dt;
    ctx.clearRect(0, 0, width, height);
    near.clearRect(0, 0, width, height);
    let foreground = 0;
    for (const [name, profile] of Object.entries(profiles)) {
      weights[name] += ((name === mood ? 1 : 0) - weights[name]) * (1 - Math.exp(-dt * 2.5));
      const weight = weights[name];
      if (weight < .012) continue;
      drawProfile(profile, weight);
      foreground += (profile.petals ?? 0) * weight;
    }
    if (petals) petals.draw(elapsed, compact ? 0 : foreground, weights.intro, compact ? null : profiles[mood], weights[mood]);
    if (compact || !petals || petals.lost()) {
      const count = Math.min(compact ? 4 : 8, Math.ceil(foreground));
      for (let i = 0; i < count; i++) {
        const seed = seeds[i + 30];
        const alpha = Math.min(1, foreground - i) * .47;
        const x = wrap((i ? seed.x : .69) * width + Math.sin(elapsed * .42 + i) * 39, width);
        const y = wrap((i ? seed.y : .18) * height + elapsed * (20 + i * 2), height + 40) - 20;
        drawPetal(near, x, y, (compact ? 4 : 7) * seed.scale, seed.spin + elapsed * .4, alpha);
      }
    }
    sync();
  }

  function sync() {
    if (motion.matches || document.hidden || viewer.open) {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      if (motion.matches) {
        ctx.clearRect(0, 0, width, height);
        near.clearRect(0, 0, width, height);
        petals?.draw(elapsed, 0, 0);
      }
      return;
    }
    if (!frame) frame = requestAnimationFrame(render);
  }

  resize();
  sync();
  window.addEventListener('resize', resize, { passive: true });
  viewer.addEventListener('visibilitychange', sync);
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) petals?.dispose();
  });
  return {
    setMood(next) {
      mood = profiles[next] ? next : 'still';
      if (profiles[mood].petals) maybeLoad3d();
    },
  };
}
