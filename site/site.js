// Progressive enhancement only: every page works without this file.
const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());

// Returning visitors with saved résumés get a "continue" call to action.
try {
  const ids = JSON.parse(localStorage.getItem('rc.v2.index') || '[]');
  if (Array.isArray(ids) && ids.length) {
    for (const a of document.querySelectorAll('a[data-cta]')) {
      a.textContent = a.dataset.cta === 'nav' ? 'My résumés' : 'Continue my résumé';
    }
  }
} catch {
  /* storage unavailable: keep defaults */
}

// Close the mobile menu after choosing a link (same-page anchors).
const menu = document.querySelector('details.menu');
menu?.addEventListener('click', (e) => {
  if (e.target instanceof HTMLAnchorElement) menu.removeAttribute('open');
});

// Template ticker: endless glide, drag/swipe, arrow keys, pause button.
// Without JS or with reduced motion it stays a plain scrollable row.
const ticker = document.querySelector('[data-ticker]');
if (ticker) initTicker(ticker);

function initTicker(root) {
  const view = root.querySelector('.ticker-viewport');
  const clip = root.querySelector('.ticker-clip');
  const track = root.querySelector('.ticker-track');
  const group = root.querySelector('.ticker-group');
  const toggle = document.querySelector('.ticker-toggle');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  if (!view || !clip || !track || !group || reduce.matches) return;

  // Second copy makes the loop seamless; hidden from assistive tech and tab order.
  const copy = group.cloneNode(true);
  copy.setAttribute('aria-hidden', 'true');
  copy.inert = true;
  track.append(copy);
  root.classList.add('is-live');

  const SPEED = 42.3; // px per second
  let width = 0;
  let x = 0;
  let last = performance.now();
  let paused = false;
  let hovered = false;
  let focused = false;
  let down = false;
  let dragged = false;
  let startX = 0;
  let lastX = 0;

  const measure = () => {
    width = group.offsetWidth + (parseFloat(getComputedStyle(track).columnGap) || 0);
  };
  const paint = () => {
    track.style.transform = `translate3d(${x}px, 0, 0)`;
  };
  const wrap = () => {
    if (width > 0) {
      while (x <= -width) x += width;
      while (x > 0) x -= width;
    }
    paint();
  };

  measure();
  addEventListener('resize', measure, { passive: true });
  for (const img of group.querySelectorAll('img')) if (!img.complete) img.addEventListener('load', measure, { once: true });

  const frame = (t) => {
    const dt = Math.min(t - last, 100);
    last = t;
    if (!paused && !hovered && !focused && !down && !reduce.matches) {
      x -= (dt / 1000) * SPEED;
      wrap();
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  // Drag or swipe. Capture only once it is a real drag so plain clicks still open the card.
  view.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    down = true;
    dragged = false;
    startX = lastX = e.clientX;
  });
  view.addEventListener('pointermove', (e) => {
    if (!down) return;
    if (!dragged && Math.abs(e.clientX - startX) > 5) {
      dragged = true;
      view.classList.add('is-dragging');
      try {
        view.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    if (dragged) {
      x += e.clientX - lastX;
      wrap();
    }
    lastX = e.clientX;
  });
  const end = () => {
    down = false;
    view.classList.remove('is-dragging');
  };
  view.addEventListener('pointerup', end);
  view.addEventListener('pointercancel', end);
  view.addEventListener('dragstart', (e) => e.preventDefault());
  view.addEventListener(
    'click',
    (e) => {
      if (!dragged) return;
      e.preventDefault();
      e.stopPropagation();
      dragged = false;
    },
    true,
  );

  // Pause while a mouse is over it or anything inside has focus.
  view.addEventListener('pointerenter', (e) => (hovered = e.pointerType === 'mouse'));
  view.addEventListener('pointerleave', () => (hovered = false));
  view.addEventListener('focusin', (e) => {
    focused = true;
    clip.scrollLeft = 0;
    const card = e.target instanceof Element ? e.target.closest('li') : null;
    if (!card) return;
    // Bring a tabbed-to card into view (no wrap, so the focused copy stays on screen).
    const v = clip.getBoundingClientRect();
    const c = card.getBoundingClientRect();
    if (c.left < v.left + 24) x += v.left + 24 - c.left;
    else if (c.right > v.right - 24) x -= c.right - (v.right - 24);
    paint();
  });
  view.addEventListener('focusout', (e) => (focused = view.contains(e.relatedTarget)));

  view.addEventListener('keydown', (e) => {
    if (e.target !== view || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault();
    x += e.key === 'ArrowLeft' ? 160 : -160;
    wrap();
  });

  if (toggle) {
    toggle.hidden = false;
    toggle.addEventListener('click', () => {
      paused = !paused;
      toggle.textContent = paused ? 'Play' : 'Pause';
    });
  }
}
