import { useEffect, useRef, useState } from 'react';
import { Link, navigate, paths } from '../../app/router';
import { IconButton } from '../../components/ui/Button';
import { CopyIcon, EllipsisVerticalIcon, FileJsonIcon, PencilIcon, Trash2Icon } from '../../components/ui/icons';
import { Menu } from '../../components/ui/Menu';
import type { Resume } from '../../domain/schema';
import { templateOf } from '../../engine';
import { relativeTime } from '../../lib/time';
import { duplicateResume } from '../../store/resumes';
import { toast } from '../../store/ui';
import { exportResume } from '../export/exporters';
import { PageSvg } from '../preview/PageSvg';
import { useLayout } from '../preview/useLayout';

/** Thumbnail renders only once the card scrolls into view. */
function Thumbnail({ resume }: { resume: Resume }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return setVisible(true);
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && (setVisible(true), io.disconnect()), { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const { layout } = useLayout(visible ? resume : undefined);
  const page = layout?.pages[0];
  return (
    <div ref={ref} className="aspect-[595/842] w-full overflow-hidden bg-white">
      {page ? <PageSvg page={page} label={`Preview of ${resume.title}`} interactiveLinks={false} /> : <div className="size-full animate-pulse bg-surface-2" />}
    </div>
  );
}

export function ResumeCard({ resume, onRename, onDelete }: { resume: Resume; onRename: () => void; onDelete: () => void }) {
  const href = paths.editor(resume.id);
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xs transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lg focus-within:border-line-strong">
      <div className="border-b border-line bg-canvas p-4">
        <div className="mx-auto w-[78%] overflow-hidden rounded-[2px] shadow-paper">
          <Thumbnail resume={resume} />
        </div>
      </div>
      <div className="flex items-start gap-2 p-3.5">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[14.5px] font-semibold">
            <Link href={href} className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline">
              {resume.title}
            </Link>
          </h3>
          <p className="truncate text-[12.5px] text-muted">
            {templateOf(resume).name} · Edited {relativeTime(resume.updatedAt)}
          </p>
        </div>
        <div className="relative z-10">
          <Menu
            label={`${resume.title} actions`}
            trigger={(p) => (
              <IconButton size="sm" label={`Actions for ${resume.title}`} {...p}>
                <EllipsisVerticalIcon size={15} />
              </IconButton>
            )}
            items={[
              { label: 'Open', icon: <PencilIcon />, onSelect: () => navigate(href) },
              { label: 'Rename', icon: <PencilIcon />, onSelect: onRename },
              {
                label: 'Duplicate',
                icon: <CopyIcon />,
                onSelect: () => {
                  const copy = duplicateResume(resume.id);
                  if (copy) toast({ kind: 'success', title: 'Duplicated', message: copy.title });
                },
              },
              {
                label: 'Download JSON backup',
                icon: <FileJsonIcon />,
                onSelect: () =>
                  void exportResume('json', resume, null, null).then((name) => toast({ kind: 'success', title: 'Backup downloaded', message: name })),
              },
              { label: 'Delete', icon: <Trash2Icon />, danger: true, separatorBefore: true, onSelect: onDelete },
            ]}
          />
        </div>
      </div>
    </article>
  );
}
