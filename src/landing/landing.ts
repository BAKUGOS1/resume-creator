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
