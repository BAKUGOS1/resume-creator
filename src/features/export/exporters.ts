/** Export actions. Heavy libraries (jsPDF, JSZip) load on first use. */
import { toBackup, toExport } from '../../domain/migrate';
import type { Resume } from '../../domain/schema';
import type { LayoutResult } from '../../engine';
import type { FontSet } from '../../engine/fonts/loader';
import { downloadBlob, fileSlug } from '../../lib/download';
import { flushSaves } from '../../store/resumes';

export type ExportFormat = 'pdf' | 'docx' | 'txt' | 'json';

export const fileBase = (r: Resume) => `${fileSlug(r.basics.name || r.title)}_Resume`;

export async function exportResume(format: ExportFormat, resume: Resume, layout: LayoutResult | null, fonts: FontSet | null): Promise<string> {
  flushSaves();
  const base = fileBase(resume);
  switch (format) {
    case 'pdf': {
      if (!layout || !fonts) throw new Error('The preview is still loading. Try again in a moment.');
      const { buildPdfBlob } = await import('../../engine/pdf/buildPdf');
      const name = `${base}.pdf`;
      downloadBlob(await buildPdfBlob(resume, layout, fonts), name);
      return name;
    }
    case 'docx': {
      const { buildDocxBlob } = await import('../../engine/docx/buildDocx');
      const name = `${base}.docx`;
      downloadBlob(await buildDocxBlob(resume), name);
      return name;
    }
    case 'txt': {
      const { toPlainText } = await import('../../engine/text/plainText');
      const name = `${base}.txt`;
      downloadBlob(new Blob([toPlainText(resume)], { type: 'text/plain;charset=utf-8' }), name);
      return name;
    }
    case 'json': {
      const name = `${base}.resume.json`;
      downloadBlob(new Blob([JSON.stringify(toExport(resume), null, 2)], { type: 'application/json' }), name);
      return name;
    }
  }
}

export function exportBackup(resumes: Resume[]): string {
  flushSaves();
  const name = `resume-creator-backup-${new Date().toISOString().slice(0, 10)}.json`;
  downloadBlob(new Blob([JSON.stringify(toBackup(resumes), null, 2)], { type: 'application/json' }), name);
  return name;
}
