export function connectViewer() {
  const dialog = document.querySelector('.lightbox');
  const stage = dialog.querySelector('.viewer-stage');
  const original = stage.querySelector('img');
  const status = stage.querySelector('[role="status"]');
  const title = dialog.querySelector('#image-title');
  const close = dialog.querySelector('.viewer-close');
  let trigger;
  let request = 0;

  document.querySelector('main').addEventListener('click', async (event) => {
    const frame = event.target.closest('.frame');
    if (!frame || dialog.open) return;
    trigger = frame;
    const currentRequest = ++request;
    title.textContent = frame.dataset.title;
    status.textContent = 'Görsel yükleniyor…';
    original.alt = frame.querySelector('img').alt;
    original.hidden = true;
    document.documentElement.classList.add('viewing');
    dialog.showModal();
    close.focus({ preventScroll: true });
    dialog.dispatchEvent(new Event('visibilitychange'));
    original.src = frame.dataset.full;
    try {
      await original.decode();
      if (currentRequest !== request) return;
      status.textContent = '';
      original.hidden = false;
    } catch {
      if (currentRequest !== request) return;
      status.textContent = 'Tam boyutlu görsel yüklenemedi.';
    }
  });

  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === stage || event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    request++;
    original.removeAttribute('src');
    document.documentElement.classList.remove('viewing');
    trigger?.focus({ preventScroll: true });
    dialog.dispatchEvent(new Event('visibilitychange'));
  });
  return dialog;
}
