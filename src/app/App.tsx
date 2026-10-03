import { useEffect } from 'react';
import { Toaster } from '../components/ui/Toaster';
import { Logo } from '../components/ui/misc';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { EditorPage } from '../features/editor/EditorPage';
import { useStore } from '../lib/store';
import { initResumes, resumesStore, useResume } from '../store/resumes';
import { applyTheme } from '../store/ui';
import { ErrorBoundary } from './ErrorBoundary';
import { Link, paths, useRoute } from './router';

function NotFound({ message = 'This page does not exist.' }: { message?: string }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <Logo />
      <h1 className="text-[22px] font-semibold">Not found</h1>
      <p className="text-[14px] text-muted">{message}</p>
      <Link href={paths.dashboard()} className="inline-flex h-9 items-center rounded-lg bg-brand px-3.5 text-sm font-medium text-brand-fg">
        Go to your résumés
      </Link>
    </main>
  );
}

function EditorRoute({ id }: { id: string }) {
  const resume = useResume(id);
  if (!resume) return <NotFound message="This résumé isn’t in this browser. It may have been deleted, or created on another device." />;
  return <EditorPage key={id} resume={resume} />;
}

export function App() {
  const route = useRoute();
  const ready = useStore(resumesStore, (s) => s.ready);

  useEffect(() => {
    initResumes();
    applyTheme();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <ErrorBoundary>
      {!ready ? null : route.name === 'dashboard' ? <DashboardPage /> : route.name === 'editor' ? <EditorRoute id={route.id} /> : <NotFound />}
      <Toaster />
    </ErrorBoundary>
  );
}
