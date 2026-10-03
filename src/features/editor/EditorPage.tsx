import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, paths } from '../../app/router';
import { IconButton } from '../../components/ui/Button';
import {
  ChevronLeftIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  CloudOffIcon,
  EyeIcon,
  ListChecksIcon,
  LoaderCircleIcon,
  PaletteIcon,
  PenLineIcon,
  Redo2Icon,
  Undo2Icon,
} from '../../components/ui/icons';
import { Badge } from '../../components/ui/misc';
import { Tabs, tabPanelProps } from '../../components/ui/Tabs';
import { checkResume } from '../../domain/checks';
import type { Resume } from '../../domain/schema';
import { cn } from '../../lib/cn';
import { useStore } from '../../lib/store';
import { flushSaves, redo, renameResume, resumesStore, undo, useHistoryState } from '../../store/resumes';
import { toast, uiStore } from '../../store/ui';
import { ChecksPanel } from '../ats/ChecksPanel';
import { DesignPanel } from '../design/DesignPanel';
import { ExportMenu } from '../export/ExportMenu';
import { PrintRoot } from '../export/PrintRoot';
import { PreviewPane } from '../preview/PreviewPane';
import { useLayout } from '../preview/useLayout';
import { ContentPanel } from './ContentPanel';
import { EditorProvider } from './context';

type Panel = 'content' | 'design' | 'check';

function SaveIndicator() {
  const saveStatus = useStore(resumesStore, (s) => s.saveStatus);
  const storageError = useStore(resumesStore, (s) => s.storageError);
  if (storageError)
    return (
      <span className="inline-flex items-center gap-1.5 text-[12.5px] text-danger" title={storageError}>
        <CloudOffIcon size={14} /> <span className="hidden md:inline">Not saved</span>
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-muted" aria-live="polite">
      {saveStatus === 'saving' ? <LoaderCircleIcon size={13} className="animate-spin" /> : <CircleCheckIcon size={13} />}
      <span className="hidden md:inline">{saveStatus === 'saving' ? 'Saving…' : 'Saved on this device'}</span>
    </span>
  );
}

export function EditorPage({ resume }: { resume: Resume }) {
  const [panel, setPanel] = useState<Panel>('content');
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');
  const [printing, setPrinting] = useState(false);
  const { layout, fonts, loading, error } = useLayout(resume);
  const { canUndo, canRedo } = useHistoryState(resume.id);
  const focusRequest = useStore(uiStore, (s) => s.focusRequest);

  const issues = useMemo(
    () => checkResume(resume, layout ? { pageCount: layout.pages.length, missingGlyphs: layout.missingGlyphs } : undefined),
    [resume, layout],
  );
  const blocking = issues.filter((i) => i.severity === 'error').length;

  useEffect(() => {
    document.title = `${resume.title} · Resume Creator`;
  }, [resume.title]);

  // After the check panel asks for a field, wait for it to render, then focus it.
  useEffect(() => {
    if (!focusRequest) return;
    let tries = 0;
    const tick = () => {
      const el = document.getElementById(focusRequest.field);
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        el.focus({ preventScroll: true });
      } else if (tries++ < 20) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [focusRequest]);

  const startPrint = useCallback(() => {
    if (!layout) return toast({ kind: 'info', title: 'Preview is still loading' });
    flushSaves();
    setPrinting(true);
  }, [layout]);

  const endPrint = useCallback(() => setPrinting(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo(resume.id);
      } else if ((k === 'z' && e.shiftKey) || k === 'y') {
        e.preventDefault();
        redo(resume.id);
      } else if (k === 'p') {
        e.preventDefault();
        startPrint();
      } else if (k === 's') {
        e.preventDefault();
        flushSaves();
        toast({ kind: 'success', title: 'Saved', message: 'Your changes are stored in this browser.', duration: 2000 });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [resume.id, startPrint]);

  const tabs = [
    { id: 'content' as const, label: 'Content', icon: <PenLineIcon size={15} /> },
    { id: 'design' as const, label: 'Design', icon: <PaletteIcon size={15} /> },
    {
      id: 'check' as const,
      label: 'Check',
      icon: <ListChecksIcon size={15} />,
      badge: blocking ? (
        <Badge tone="danger">{blocking}</Badge>
      ) : issues.length ? (
        <Badge tone="warning">{issues.length}</Badge>
      ) : (
        <Badge tone="success">✓</Badge>
      ),
    },
  ];

  return (
    <EditorProvider id={resume.id} issues={issues}>
      <div className="flex h-dvh flex-col">
        <h1 className="sr-only">Editing {resume.title}</h1>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface px-2 sm:px-3">
          <Link
            href={paths.dashboard()}
            className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-[13.5px] text-muted hover:bg-surface-2 hover:text-fg"
            aria-label="Back to all résumés"
          >
            <ChevronLeftIcon />
            <span className="hidden lg:inline">Résumés</span>
          </Link>
          <div className="h-5 w-px bg-line" aria-hidden="true" />
          <input
            aria-label="Résumé name"
            value={resume.title}
            maxLength={160}
            onChange={(e) => renameResume(resume.id, e.target.value)}
            className="h-9 min-w-0 flex-1 truncate rounded-lg border border-transparent bg-transparent px-2 text-[14.5px] font-semibold hover:border-line focus:border-brand focus:outline-none sm:max-w-sm"
          />
          <SaveIndicator />
          <div className="ml-auto flex items-center gap-1">
            <IconButton label="Undo (Ctrl+Z)" disabled={!canUndo} onClick={() => undo(resume.id)}>
              <Undo2Icon />
            </IconButton>
            <IconButton label="Redo (Ctrl+Shift+Z)" disabled={!canRedo} onClick={() => redo(resume.id)} className="max-sm:hidden">
              <Redo2Icon />
            </IconButton>
            <ExportMenu
              resume={resume}
              layout={layout}
              fonts={fonts}
              issues={issues}
              onPrint={startPrint}
              onReview={() => {
                setPanel('check');
                setMobileView('edit');
              }}
            />
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <aside
            aria-label="Editor"
            className={cn('min-h-0 w-full flex-col border-line bg-bg lg:flex lg:w-[min(600px,48%)] lg:border-r', mobileView === 'edit' ? 'flex' : 'hidden')}
          >
            <div className="shrink-0 border-b border-line bg-surface px-3 py-2">
              <Tabs idPrefix="editor" tabs={tabs} value={panel} onChange={setPanel} />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 pb-24 sm:px-4 lg:pb-8" {...tabPanelProps('editor', panel)}>
              {panel === 'content' && <ContentPanel resume={resume} />}
              {panel === 'design' && <DesignPanel resume={resume} layout={layout} />}
              {panel === 'check' && <ChecksPanel issues={issues} onJump={() => setPanel('content')} />}
            </div>
          </aside>
          <main className={cn('min-h-0 min-w-0 flex-1 flex-col lg:flex', mobileView === 'preview' ? 'flex' : 'hidden')}>
            <PreviewPane layout={layout} loading={loading} error={error} name={resume.basics.name} />
          </main>
        </div>

        <nav aria-label="Switch view" className="fixed inset-x-0 bottom-0 z-30 flex justify-center p-3 lg:hidden">
          <div className="flex gap-1 rounded-full border border-line bg-surface p-1 shadow-xl">
            {(['edit', 'preview'] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={mobileView === v}
                onClick={() => setMobileView(v)}
                className={cn(
                  'inline-flex h-10 items-center gap-2 rounded-full px-5 text-[14px] font-medium',
                  mobileView === v ? 'bg-fg text-bg' : 'text-muted',
                )}
              >
                {v === 'edit' ? <PenLineIcon size={15} /> : <EyeIcon size={15} />}
                {v === 'edit' ? 'Edit' : 'Preview'}
                {v === 'edit' && blocking > 0 && <CircleAlertIcon size={14} className="text-danger" />}
              </button>
            ))}
          </div>
        </nav>
      </div>
      {printing && layout && <PrintRoot layout={layout} title={`${resume.basics.name || resume.title} – Résumé`} onDone={endPrint} />}
    </EditorProvider>
  );
}
