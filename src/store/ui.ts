/** App-wide UI state: toasts, colour theme and "jump to field" requests. */
import { createStore } from '../lib/store';
import { createId } from '../lib/id';

export interface Toast {
  id: string;
  kind: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

export type ThemePreference = 'system' | 'light' | 'dark';

interface UiState {
  toasts: Toast[];
  theme: ThemePreference;
  /** Field the editor should reveal and focus (set by the check panel). */
  focusRequest: { field: string; sectionId?: string; nonce: number } | null;
}

const THEME_KEY = 'rc.v2.theme';
const readTheme = (): ThemePreference => {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
};

export const uiStore = createStore<UiState>({ toasts: [], theme: typeof window === 'undefined' ? 'system' : readTheme(), focusRequest: null });

export function toast(t: Omit<Toast, 'id'>): string {
  const id = createId('t_');
  uiStore.setState((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id }] }));
  return id;
}

export function dismissToast(id: string) {
  uiStore.setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
}

export function setTheme(theme: ThemePreference) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* per-device convenience only */
  }
  uiStore.setState({ theme });
  applyTheme(theme);
}

export function applyTheme(theme: ThemePreference = uiStore.getState().theme) {
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

export function requestFocus(field: string, sectionId?: string) {
  uiStore.setState({ focusRequest: { field, sectionId, nonce: Date.now() } });
}
