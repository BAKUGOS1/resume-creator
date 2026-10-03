import { beforeAll, describe, expect, it } from 'vitest';
import { createSampleResume } from '../../src/domain/sample';

class MemoryStorage {
  private m = new Map<string, string>();
  get length() {
    return this.m.size;
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
}

const storage = new MemoryStorage();
beforeAll(() => {
  (globalThis as Record<string, unknown>).window = { localStorage: storage, addEventListener() {}, removeEventListener() {} };
});

describe('résumé store', () => {
  it('updates immutably with undo/redo and coalesced typing', async () => {
    const { addResume, getResume, updateResume, undo, redo, flushSaves } = await import('../../src/store/resumes');
    const r = addResume(createSampleResume());
    const before = getResume(r.id)!;
    updateResume(r.id, (d) => void (d.basics.name = 'J'), { coalesceKey: 'name' });
    updateResume(r.id, (d) => void (d.basics.name = 'Jo'), { coalesceKey: 'name' });
    updateResume(r.id, (d) => void (d.basics.name = 'Joe'), { coalesceKey: 'name' });
    expect(before.basics.name).toBe('Jordan Ellis');
    expect(getResume(r.id)!.basics.name).toBe('Joe');
    undo(r.id);
    expect(getResume(r.id)!.basics.name).toBe('Jordan Ellis');
    redo(r.id);
    expect(getResume(r.id)!.basics.name).toBe('Joe');

    flushSaves();
    const saved = JSON.parse(storage.getItem(`rc.v2.r.${r.id}`)!);
    expect(saved.basics.name).toBe('Joe');
    expect(JSON.parse(storage.getItem('rc.v2.index')!)).toContain(r.id);
  });

  it('duplicates with fresh ids and deletes from storage', async () => {
    const { addResume, duplicateResume, deleteResume, getResume } = await import('../../src/store/resumes');
    const r = addResume(createSampleResume());
    const copy = duplicateResume(r.id)!;
    expect(copy.id).not.toBe(r.id);
    expect(copy.sections[0]!.id).not.toBe(r.sections[0]!.id);
    deleteResume(r.id);
    expect(getResume(r.id)).toBeUndefined();
    expect(storage.getItem(`rc.v2.r.${r.id}`)).toBeNull();
  });

  it('skips corrupted entries when loading', async () => {
    const { persistence } = await import('../../src/store/persistence');
    storage.setItem('rc.v2.r.broken', '{not json');
    storage.setItem('rc.v2.r.evil', JSON.stringify({ schemaVersion: 2, id: 'other-id' }));
    const { corrupted } = persistence.loadAll();
    expect(corrupted).toBe(2);
  });
});
