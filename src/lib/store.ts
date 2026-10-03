/**
 * Minimal external store (zustand-style) on top of useSyncExternalStore.
 * Components subscribe to slices via selectors and re-render only when the
 * selected value changes.
 */
import { useCallback, useRef, useSyncExternalStore } from 'react';

export interface Store<T> {
  getState(): T;
  setState(next: Partial<T> | ((prev: T) => Partial<T>)): void;
  subscribe(listener: () => void): () => void;
}

export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    setState(next) {
      const patch = typeof next === 'function' ? next(state) : next;
      if (Object.keys(patch).every((k) => Object.is(state[k as keyof T], patch[k as keyof T]))) return;
      state = { ...state, ...patch };
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function useStore<T, S>(store: Store<T>, selector: (state: T) => S, equal: (a: S, b: S) => boolean = Object.is): S {
  const cache = useRef<{ state: T; selector: (state: T) => S; value: S } | null>(null);
  const getSnapshot = useCallback(() => {
    const state = store.getState();
    const prev = cache.current;
    // Cache per (state, selector): a new selector (e.g. different id) must re-select.
    if (prev && prev.state === state && prev.selector === selector) return prev.value;
    const value = selector(state);
    if (prev && equal(prev.value, value)) {
      cache.current = { state, selector, value: prev.value };
      return prev.value;
    }
    cache.current = { state, selector, value };
    return value;
  }, [store, selector, equal]);
  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

export const shallowEqual = <S>(a: S, b: S): boolean => {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  const ka = Object.keys(a);
  return ka.length === Object.keys(b).length && ka.every((k) => Object.is((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
};
