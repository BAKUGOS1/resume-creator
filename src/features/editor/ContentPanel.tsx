import { Button } from '../../components/ui/Button';
import { PlusIcon } from '../../components/ui/icons';
import { Menu } from '../../components/ui/Menu';
import { ADDABLE_SECTIONS, createSection, SECTION_META } from '../../domain/defaults';
import { LIMITS, type Resume } from '../../domain/schema';
import { BasicsCard } from './BasicsCard';
import { useActions } from './context';
import { SectionCard } from './SectionCard';

export function ContentPanel({ resume }: { resume: Resume }) {
  const { update } = useActions();
  const hasSummary = resume.sections.some((s) => s.kind === 'summary');

  return (
    <div className="flex flex-col gap-3">
      <BasicsCard basics={resume.basics} linkStyle={resume.design.linkStyle} />
      {resume.sections.map((s, i) => (
        <SectionCard key={s.id} section={s} index={i} count={resume.sections.length} />
      ))}
      <Menu
        align="start"
        label="Add a section"
        trigger={(p) => (
          <Button {...p} variant="secondary" icon={<PlusIcon />} className="self-start" disabled={resume.sections.length >= LIMITS.sections}>
            Add section
          </Button>
        )}
        items={ADDABLE_SECTIONS.filter((k) => k !== 'summary' || !hasSummary).map((kind) => ({
          label: SECTION_META[kind].label,
          onSelect: () => {
            const section = createSection(kind);
            update((d) => void (kind === 'summary' ? d.sections.unshift(section) : d.sections.push(section)));
            requestAnimationFrame(() =>
              document.getElementById(`section-title-${section.id}`)?.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
            );
          },
        }))}
      />
    </div>
  );
}
