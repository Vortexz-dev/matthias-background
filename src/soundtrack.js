const fadeTime = 1.65;

function roomResponse(context) {
  const duration = .65;
  const buffer = context.createBuffer(2, Math.round(context.sampleRate * duration), context.sampleRate);
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const impulse = buffer.getChannelData(channel);
    const preDelay = Math.round(context.sampleRate * (.026 + channel * .007));
    let smooth = 0;
    for (let i = preDelay; i < impulse.length; i++) {
      smooth = smooth * .68 + (Math.random() * 2 - 1) * .32;
      const t = (i - preDelay) / (impulse.length - preDelay);
      impulse[i] = smooth * (1 - t) ** 3.7;
    }
  }
  return buffer;
}

function makeRoom() {
  const AudioEngine = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioEngine) return null;
  let context;
  try {
    context = new AudioEngine();
    const air = context.createBiquadFilter();
    air.type = 'lowpass';
    air.frequency.value = 5800;
    air.Q.value = .32;

    const dry = context.createGain();
    dry.gain.value = .85;
    const wet = context.createGain();
    wet.gain.value = .12;
    const hall = context.createConvolver();
    hall.buffer = roomResponse(context);
    const master = context.createGain();
    master.gain.value = .66;
    air.connect(dry).connect(master);
    air.connect(hall).connect(wet).connect(master);
    master.connect(context.destination);
    return { context, air };
  } catch {
    context?.close().catch(() => {});
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
  let room;
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
    if (room) {
      gain = room.context.createGain();
      gain.gain.value = 0;
      room.context.createMediaElementSource(element).connect(gain).connect(room.air);
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
    if (deck.gain) {
      const parameter = deck.gain.gain;
      const now = room.context.currentTime;
      const previous = deck.fade;
      const current = previous
        ? previous.target + (previous.start - previous.target) * Math.exp(-(now - previous.time) / previous.constant)
        : parameter.value;
      const constant = fadeTime / 5;
      parameter.cancelScheduledValues(now);
      parameter.setValueAtTime(current, now);
      parameter.setTargetAtTime(target, now, constant);
      deck.fade = { start: current, target, time: now, constant };
    } else {
      const element = deck.element;
      const start = element.volume;
      const end = target * .58;
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
      const ready = room?.context.state !== 'running' ? room?.context.resume() : undefined;
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
      if (room === undefined) room = makeRoom();
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
