import { useEffect, useState } from 'react';
import { navigate, paths } from '../../app/router';
import { Button, IconButton } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Field';
import { FilePlus2Icon, HardDriveIcon, MonitorIcon, MoonIcon, PlusIcon, ShieldCheckIcon, SparklesIcon, SunIcon, UploadIcon } from '../../components/ui/icons';
import { Menu } from '../../components/ui/Menu';
import { Logo } from '../../components/ui/misc';
import { createBlankResume } from '../../domain/defaults';
import { createSampleResume } from '../../domain/sample';
import { TEMPLATE_IDS, type Resume, type TemplateId } from '../../domain/schema';
import { useStore } from '../../lib/store';
import { addResume, deleteResume, renameResume, useResumeList } from '../../store/resumes';
import { setTheme, toast, uiStore } from '../../store/ui';
import { exportBackup } from '../export/exporters';
import { ResumeCard } from './ResumeCard';
import { useImport } from './useImport';

function ThemeMenu() {
  const theme = useStore(uiStore, (s) => s.theme);
  const Icon = theme === 'dark' ? MoonIcon : theme === 'light' ? SunIcon : MonitorIcon;
  return (
    <Menu
      label="Colour theme"
      trigger={(p) => (
        <IconButton label={`Theme: ${theme}`} {...p}>
          <Icon />
        </IconButton>
      )}
      items={[
        { label: 'System', icon: <MonitorIcon />, onSelect: () => setTheme('system') },
        { label: 'Light', icon: <SunIcon />, onSelect: () => setTheme('light') },
        { label: 'Dark', icon: <MoonIcon />, onSelect: () => setTheme('dark') },
      ]}
    />
  );
}

function NewResumeDialog({ open, onClose, onImport }: { open: boolean; onClose: () => void; onImport: () => void }) {
  const create = (r: Resume) => {
    const added = addResume(r);
    onClose();
    navigate(paths.editor(added.id));
  };
  const options = [
    { icon: <FilePlus2Icon size={20} />, title: 'Blank résumé', text: 'Start from empty sections.', onClick: () => create(createBlankResume()) },
    {
      icon: <SparklesIcon size={20} />,
      title: 'From an example',
      text: 'Edit a complete sample résumé.',
      onClick: () => create({ ...createSampleResume(), title: 'Untitled résumé' }),
    },
    {
      icon: <UploadIcon size={20} />,
      title: 'Import a file',
      text: 'A .json export or backup.',
      onClick: () => {
        onClose();
        onImport();
      },
    },
  ];
  return (
    <Dialog open={open} onClose={onClose} title="Create a résumé" description="You can change the template and every section later.">
      <div className="grid gap-2 pb-4 sm:grid-cols-3">
        {options.map((o) => (
          <button
            key={o.title}
            type="button"
            onClick={o.onClick}
            className="flex flex-col items-start gap-2 rounded-xl border border-line p-4 text-left transition-colors hover:border-brand hover:bg-brand-soft/40"
          >
            <span className="grid size-9 place-items-center rounded-lg bg-brand-soft text-brand">{o.icon}</span>
            <span className="text-[14px] font-semibold">{o.title}</span>
            <span className="text-[12.5px] text-muted">{o.text}</span>
          </button>
        ))}
      </div>
    </Dialog>
  );
}

export function DashboardPage() {
  const resumes = useResumeList();
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<Resume | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleting, setDeleting] = useState<Resume | null>(null);
  const importer = useImport();

  useEffect(() => {
    document.title = 'Your résumés · Resume Creator';
  }, []);

  // "/resumes?template=timeline" (from the template pages) starts an example in that design.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('template');
    if (!id) return;
    navigate(paths.dashboard(), { replace: true }); // consume the param first (StrictMode runs effects twice)
    if (!(TEMPLATE_IDS as readonly string[]).includes(id)) return;
    const added = addResume({ ...createSampleResume(), title: 'Untitled résumé', templateId: id as TemplateId });
    navigate(paths.editor(added.id), { replace: true });
  }, []);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
          <a href="/" aria-label="Resume Creator home" className="rounded-md">
            <Logo className="text-[15px]" />
          </a>
          <div className="ml-auto flex items-center gap-1.5">
            <ThemeMenu />
            <Button variant="ghost" icon={<UploadIcon />} onClick={importer.open} className="max-sm:hidden">
              Import
            </Button>
            <Button variant="primary" icon={<PlusIcon />} onClick={() => setCreating(true)}>
              New résumé
            </Button>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[26px] font-semibold tracking-tight">Your résumés</h1>
            <p className="text-[14px] text-muted">ATS-friendly résumés with pixel-exact PDF, Word and text export.</p>
          </div>
          {resumes.length > 0 && (
            <Button variant="ghost" size="sm" icon={<UploadIcon />} onClick={importer.open} className="sm:hidden">
              Import
            </Button>
          )}
        </div>

        {resumes.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-line-strong px-6 py-16 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">
              <FilePlus2Icon size={24} />
            </span>
            <div>
              <h2 className="text-[18px] font-semibold">Create your first résumé</h2>
              <p className="mt-1 max-w-sm text-[14px] text-muted">Start blank, from an example or import a JSON backup. Everything stays in this browser.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" icon={<PlusIcon />} onClick={() => setCreating(true)}>
                New résumé
              </Button>
              <Button icon={<UploadIcon />} onClick={importer.open}>
                Import
              </Button>
            </div>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {resumes.map((r) => (
              <li key={r.id}>
                <ResumeCard
                  resume={r}
                  onRename={() => {
                    setRenameValue(r.title);
                    setRenaming(r);
                  }}
                  onDelete={() => setDeleting(r)}
                />
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex size-full min-h-56 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong text-muted transition-colors hover:border-brand hover:text-brand"
              >
                <PlusIcon size={22} />
                <span className="text-[14px] font-medium">New résumé</span>
              </button>
            </li>
          </ul>
        )}
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-[12.5px] text-muted">
          <p className="inline-flex items-center gap-2">
            <ShieldCheckIcon size={15} className="text-success" />
            Private by design: your data is stored only in this browser and never uploaded.
          </p>
          <a href="/blog/" className="hover:text-fg hover:underline">
            Résumé writing guides
          </a>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              icon={<HardDriveIcon size={14} />}
              disabled={!resumes.length}
              onClick={() => toast({ kind: 'success', title: 'Backup downloaded', message: exportBackup(resumes) })}
            >
              Back up all
            </Button>
            <Button variant="ghost" size="sm" icon={<UploadIcon size={14} />} onClick={importer.open}>
              Restore
            </Button>
          </div>
        </div>
      </footer>

      <input {...importer.inputProps} />
      <NewResumeDialog open={creating} onClose={() => setCreating(false)} onImport={importer.open} />

      <Dialog
        open={renaming !== null}
        onClose={() => setRenaming(null)}
        size="sm"
        title="Rename résumé"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="rename-form">
              Save
            </Button>
          </>
        }
      >
        <form
          id="rename-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (renaming) renameResume(renaming.id, renameValue);
            setRenaming(null);
          }}
        >
          <label htmlFor="rename-input" className="sr-only">
            Résumé name
          </label>
          <Input id="rename-input" data-autofocus value={renameValue} maxLength={160} onChange={(e) => setRenameValue(e.target.value)} />
        </form>
      </Dialog>

      <Dialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        size="sm"
        title="Delete this résumé?"
        description={deleting ? `“${deleting.title}” will be removed from this browser.` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!deleting) return;
                const removed = deleteResume(deleting.id);
                setDeleting(null);
                if (removed)
                  toast({ kind: 'info', title: 'Résumé deleted', message: removed.title, action: { label: 'Undo', onClick: () => addResume(removed) } });
              }}
            >
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}
