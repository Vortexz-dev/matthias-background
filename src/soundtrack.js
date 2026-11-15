const fadeTime = 1.65;
const playbackVolume = .56;

function createPlaybackContext() {
  const AudioEngine = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioEngine) return null;
  try {
    return new AudioEngine();
  } catch {
    return null;
  }
}

export function connectSoundtrack(button) {
  const label = button.querySelector('.sound-label');
  const message = document.querySelector('.sound-status');
  const decks = new Map();
  let active = 1;
  let requested = 1;
  let enabled = false;
  let context;
  let requestVersion = 0;
  let settle;

  function setButton(on) {
    button.setAttribute('aria-pressed', String(on));
    label.textContent = on ? 'Müziği kapat' : 'Müziği aç';
  }

  function prepare(number) {
    if (decks.has(number)) return decks.get(number);
    const element = new Audio();
    element.loop = true;
    element.preload = 'auto';
    element.src = `${button.dataset.songs}${number}.mp3`;
    let gain;
    if (context) {
      gain = context.createGain();
      gain.gain.value = 0;
      context.createMediaElementSource(element).connect(gain).connect(context.destination);
    } else {
      element.volume = 0;
    }
    const deck = { element, gain, timer: 0, animation: 0, fade: null };
    decks.set(number, deck);
    return deck;
  }

  function ramp(deck, target) {
    clearTimeout(deck.timer);
    cancelAnimationFrame(deck.animation);
    const end = target * playbackVolume;
    if (deck.gain) {
      const parameter = deck.gain.gain;
      const now = context.currentTime;
      const previous = deck.fade;
      const current = previous
        ? previous.target + (previous.start - previous.target) * Math.exp(-(now - previous.time) / previous.constant)
        : parameter.value;
      const constant = fadeTime / 5;
      parameter.cancelScheduledValues(now);
      parameter.setValueAtTime(current, now);
      parameter.setTargetAtTime(end, now, constant);
      deck.fade = { start: current, target: end, time: now, constant };
    } else {
      const element = deck.element;
      const start = element.volume;
      const time = performance.now();
      const frame = (now) => {
        const t = Math.min(1, (now - time) / (fadeTime * 1000));
        element.volume = start + (end - start) * (.5 - .5 * Math.cos(Math.PI * t));
        if (t < 1) deck.animation = requestAnimationFrame(frame);
      };
      deck.animation = requestAnimationFrame(frame);
    }
    if (!target) deck.timer = setTimeout(() => deck.element.pause(), fadeTime * 1000 + 75);
  }

  async function transition(number) {
    const version = ++requestVersion;
    const deck = prepare(number);
    clearTimeout(deck.timer);
    try {
      const ready = context?.state !== 'running' ? context?.resume() : undefined;
      await Promise.all([deck.element.play(), ready]);
      if (version !== requestVersion || !enabled) {
        if (!enabled || (number !== requested && number !== active)) ramp(deck, 0);
        return;
      }
      active = number;
      for (const [track, playback] of decks) ramp(playback, Number(track === number));
      message.textContent = '';
    } catch {
      if (version !== requestVersion || !enabled) return;
      message.textContent = 'Bölüm müziği çalınamadı. Yeniden deneyebilirsiniz.';
      if (decks.get(active)?.element.paused !== false) {
        enabled = false;
        setButton(false);
      }
    }
  }

  button.addEventListener('click', () => {
    enabled = !enabled;
    setButton(enabled);
    clearTimeout(settle);
    if (enabled) {
      if (context === undefined) context = createPlaybackContext();
      transition(requested);
    } else {
      requestVersion++;
      for (const deck of decks.values()) ramp(deck, 0);
      message.textContent = '';
    }
  });

  addEventListener('pagehide', () => {
    for (const deck of decks.values()) deck.element.pause();
  });
  addEventListener('pageshow', (event) => {
    if (event.persisted && enabled) transition(requested);
  });

  return {
    setChapter(number) {
      if (requested === number) return;
      requested = number;
      clearTimeout(settle);
      if (!enabled) return;
      // Ignore chapters crossed in a single fast scroll or anchor jump.
      settle = setTimeout(() => transition(requested), 165);
    },
  };
}
