/**
 * Tiny History-API router. Two screens don't justify a routing dependency;
 * the API mirrors react-router closely enough to swap later if needed.
 */
import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react';

export type Route = { name: 'dashboard' } | { name: 'editor'; id: string } | { name: 'notFound' };

const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') window.addEventListener('popstate', notify);

export function parseRoute(pathname: string): Route {
  const path = pathname.startsWith(base) ? pathname.slice(base.length) || '/' : pathname;
  // The static landing page owns "/"; the app lives under /resumes.
  if (path === '/resumes' || path === '/resumes/' || path === '/' || path === '') return { name: 'dashboard' };
  const m = /^\/resume\/([A-Za-z0-9_-]{1,64})\/?$/.exec(path);
  if (m) return { name: 'editor', id: m[1]! };
  return { name: 'notFound' };
}

export const paths = {
  home: () => `${base}/`,
  dashboard: () => `${base}/resumes`,
  editor: (id: string) => `${base}/resume/${encodeURIComponent(id)}`,
};

export function navigate(to: string, opts: { replace?: boolean } = {}) {
  if (to === window.location.pathname) return;
  if (opts.replace) window.history.replaceState(null, '', to);
  else window.history.pushState(null, '', to);
  window.scrollTo(0, 0);
  notify();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useRoute(): Route {
  const pathname = useSyncExternalStore(
    subscribe,
    () => window.location.pathname,
    () => '/',
  );
  return parseRoute(pathname);
}

export function Link({ href, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(href);
  };
  return <a href={href} onClick={handle} {...rest} />;
}
