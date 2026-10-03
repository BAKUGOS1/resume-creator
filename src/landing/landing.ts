/** Progressive enhancement for the static landing page (it works fully without JS). */
const YEAR = document.querySelector('[data-year]');
if (YEAR) YEAR.textContent = String(new Date().getFullYear());

// Returning visitors with saved résumés get a "continue" call to action.
try {
  const ids: unknown = JSON.parse(localStorage.getItem('rc.v2.index') ?? '[]');
  if (Array.isArray(ids) && ids.length) {
    document.querySelectorAll<HTMLAnchorElement>('a[data-cta]').forEach((a) => {
      if (a.classList.contains('btn-sm')) a.textContent = 'My résumés';
      else if (a.closest('.cta')) a.textContent = 'Continue editing my résumé';
    });
  }
} catch {
  /* storage unavailable: keep defaults */
}

/**
 * Infinite template ticker ported from Zybra architecture:
 * - 42.3 px/s smooth continuous glide
 * - Dynamic group width measurement with gap compensation
 * - Instant wrap-around normalization
 * - Mouse & touch drag with pointer capture
 * - Suppresses accidental card navigation on drag
 * - Keyboard navigation (Left/Right arrows)
 * - Honors prefers-reduced-motion
 */
function initTemplateTicker() {
  const ticker = document.getElementById('template-ticker');
  const track = document.getElementById('template-track');
  if (!ticker || !track) return;

  const firstGroup = track.querySelector<HTMLElement>('.template-group');
  if (!firstGroup) return;

  const SCROLL_SPEED = 42.3;
  let groupWidth = 0;
  let currentX = 0;
  let isDragging = false;
  let isPointerDown = false;
  let startX = 0;
  let dragBaseX = 0;
  let dragDistance = 0;
  let wasDragged = false;
  let lastTime = performance.now();

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  function measure() {
    if (!firstGroup) return;
    const computed = window.getComputedStyle(track!);
    const gap = parseFloat(computed.columnGap || computed.gap || '20') || 20;
    groupWidth = firstGroup.offsetWidth + gap;
  }

  measure();
  window.addEventListener('resize', measure, { passive: true });

  firstGroup.querySelectorAll('img').forEach((img) => {
    if (!img.complete) {
      img.addEventListener('load', measure, { once: true });
    }
  });

  function tick(time: number) {
    const delta = Math.min(time - lastTime, 100);
    lastTime = time;

    if (!motionQuery.matches && !isDragging && !isPointerDown && groupWidth > 0) {
      const moveBy = (delta / 1000) * SCROLL_SPEED;
      currentX -= moveBy;

      if (currentX <= -groupWidth) {
        currentX += groupWidth;
      } else if (currentX > 0) {
        currentX -= groupWidth;
      }

      track!.style.transform = `translate3d(${currentX}px, 0, 0)`;
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

  ticker.addEventListener('pointerdown', (e: PointerEvent) => {
    if (e.button !== 0) return;
    isPointerDown = true;
    startX = e.clientX;
    dragBaseX = currentX;
    dragDistance = 0;
    wasDragged = false;
    ticker.classList.add('is-dragging');
    try {
      ticker.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  });

  ticker.addEventListener('pointermove', (e: PointerEvent) => {
    if (!isPointerDown) return;
    const dx = e.clientX - startX;
    dragDistance = Math.max(dragDistance, Math.abs(dx));
    if (dragDistance > 5) {
      isDragging = true;
      wasDragged = true;
    }
    currentX = dragBaseX + dx;

    if (groupWidth > 0) {
      while (currentX <= -groupWidth) {
        currentX += groupWidth;
        dragBaseX += groupWidth;
      }
      while (currentX > 0) {
        currentX -= groupWidth;
        dragBaseX -= groupWidth;
      }
    }

    track.style.transform = `translate3d(${currentX}px, 0, 0)`;
  });

  const endDrag = (e: PointerEvent) => {
    if (!isPointerDown) return;
    isPointerDown = false;
    isDragging = false;
    ticker.classList.remove('is-dragging');
    try {
      if (ticker.hasPointerCapture(e.pointerId)) {
        ticker.releasePointerCapture(e.pointerId);
      }
    } catch {
      /* ignore */
    }
  };

  ticker.addEventListener('pointerup', endDrag);
  ticker.addEventListener('pointercancel', endDrag);

  ticker.addEventListener(
    'click',
    (e: MouseEvent) => {
      if (wasDragged) {
        e.preventDefault();
        e.stopPropagation();
        wasDragged = false;
      }
    },
    true
  );

  ticker.addEventListener('keydown', (e: KeyboardEvent) => {
    if (groupWidth <= 0) return;
    if (e.key === 'ArrowLeft') {
      currentX = currentX + 140 > 0 ? currentX + 140 - groupWidth : currentX + 140;
      track.style.transform = `translate3d(${currentX}px, 0, 0)`;
    } else if (e.key === 'ArrowRight') {
      currentX = currentX - 140 <= -groupWidth ? currentX - 140 + groupWidth : currentX - 140;
      track.style.transform = `translate3d(${currentX}px, 0, 0)`;
    }
  });
}

initTemplateTicker();
