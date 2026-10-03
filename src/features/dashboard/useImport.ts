import { useCallback, useRef, type ChangeEvent } from 'react';
import { navigate, paths } from '../../app/router';
import { parseImportText } from '../../domain/migrate';
import { LIMITS } from '../../domain/schema';
import { readTextFile } from '../../lib/download';
import { addResume } from '../../store/resumes';
import { toast } from '../../store/ui';

/** Hidden file input + validated import of JSON exports, backups and legacy files. */
export function useImport() {
  const input = useRef<HTMLInputElement | null>(null);

  const onFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await readTextFile(file, LIMITS.importBytes);
      const res = parseImportText(text);
      if (!res.ok) return toast({ kind: 'error', title: 'Import failed', message: res.error });
      const added = res.resumes.map((r) => addResume(r));
      toast({
        kind: 'success',
        title: added.length === 1 ? 'Résumé imported' : `${added.length} résumés imported`,
        message: res.source === 'legacy' ? 'Converted from the previous app format.' : undefined,
      });
      if (added.length === 1) navigate(paths.editor(added[0]!.id));
    } catch (e) {
      toast({ kind: 'error', title: 'Import failed', message: e instanceof Error ? e.message : 'Could not read the file.' });
    } finally {
      if (input.current) input.current.value = '';
    }
  }, []);

  const open = useCallback(() => input.current?.click(), []);
  const inputProps = {
    ref: input,
    type: 'file' as const,
    accept: 'application/json,.json',
    className: 'sr-only',
    tabIndex: -1,
    'aria-hidden': true,
    onChange: (e: ChangeEvent<HTMLInputElement>) => void onFile(e.target.files?.[0]),
  };
  return { open, inputProps };
}
