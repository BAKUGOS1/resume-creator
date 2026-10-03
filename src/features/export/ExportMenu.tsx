import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { DownloadIcon, FileJsonIcon, FileTextIcon, FileTypeIcon, MonitorSmartphoneIcon, PrinterIcon } from '../../components/ui/icons';
import { Menu } from '../../components/ui/Menu';
import type { Issue } from '../../domain/checks';
import type { Resume } from '../../domain/schema';
import type { LayoutResult } from '../../engine';
import type { FontSet } from '../../engine/fonts/loader';
import { toast } from '../../store/ui';
import { exportResume, type ExportFormat } from './exporters';

const LABEL: Record<ExportFormat, string> = { pdf: 'PDF', docx: 'Word document', txt: 'Plain text', json: 'JSON backup', html: 'Web page' };

export interface ExportMenuProps {
  resume: Resume;
  layout: LayoutResult | null;
  fonts: FontSet | null;
  issues: Issue[];
  onPrint: () => void;
  onReview: () => void;
}

export function ExportMenu({ resume, layout, fonts, issues, onPrint, onReview }: ExportMenuProps) {
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const [confirm, setConfirm] = useState<ExportFormat | 'print' | null>(null);
  const errors = issues.filter((i) => i.severity === 'error');

  const run = async (format: ExportFormat) => {
    setBusy(format);
    try {
      const name = await exportResume(format, resume, layout, fonts);
      toast({ kind: 'success', title: `${LABEL[format]} downloaded`, message: name });
    } catch (e) {
      console.error(e);
      toast({ kind: 'error', title: `${LABEL[format]} export failed`, message: e instanceof Error ? e.message : 'Please try again.' });
    } finally {
      setBusy(null);
    }
  };

  /** JSON is a backup, so it never needs a content check. */
  const request = (f: ExportFormat | 'print') => {
    if (errors.length && f !== 'json') return setConfirm(f);
    if (f === 'print') onPrint();
    else void run(f);
  };

  return (
    <>
      <div className="flex">
        <Button variant="primary" icon={<DownloadIcon />} loading={busy === 'pdf'} disabled={!layout} onClick={() => request('pdf')} className="rounded-r-none">
          <span className="hidden sm:inline">Download PDF</span>
          <span className="sm:hidden">PDF</span>
        </Button>
        <Menu
          label="More export options"
          trigger={(p) => (
            <Button
              {...p}
              variant="primary"
              aria-label="More export options"
              className="rounded-l-none border-l border-white/25 px-2!"
              loading={busy !== null && busy !== 'pdf'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </Button>
          )}
          items={[
            { label: 'PDF (vector, ATS-ready)', icon: <DownloadIcon />, onSelect: () => request('pdf'), disabled: !layout },
            { label: 'Word (.docx)', icon: <FileTypeIcon />, onSelect: () => request('docx') },
            { label: 'Plain text (.txt)', icon: <FileTextIcon />, onSelect: () => request('txt') },
            { label: 'Web page (.html, responsive)', icon: <MonitorSmartphoneIcon />, onSelect: () => request('html') },
            { label: 'Print…', icon: <PrinterIcon />, hint: 'Ctrl P', onSelect: () => request('print'), disabled: !layout },
            { label: 'JSON backup', icon: <FileJsonIcon />, separatorBefore: true, onSelect: () => request('json') },
          ]}
        />
      </div>
      <Dialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        size="sm"
        title={`${errors.length} issue${errors.length === 1 ? '' : 's'} to fix`}
        description="Recruiters or ATS may reject a résumé with these problems."
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                const f = confirm;
                setConfirm(null);
                if (f === 'print') onPrint();
                else if (f) void run(f);
              }}
            >
              Export anyway
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setConfirm(null);
                onReview();
              }}
            >
              Review issues
            </Button>
          </>
        }
      >
        <ul className="mb-2 list-disc pl-5 text-[13.5px] text-muted">
          {errors.slice(0, 5).map((e) => (
            <li key={e.id}>{e.message}</li>
          ))}
        </ul>
      </Dialog>
    </>
  );
}
