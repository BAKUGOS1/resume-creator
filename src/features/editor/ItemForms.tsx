/** Field layouts for each section kind. */
import type { CertificationItem, CustomItem, EducationItem, ExperienceItem, ProjectItem, SkillItem } from '../../domain/schema';
import { BulletsEditor } from './BulletsEditor';
import { useActions, useItemSetter } from './context';
import { DateRangeFields, PartialDateField, TextAreaField, TextField, type DatedValue } from './fields';

const fid = (itemId: string, field: string) => `f-item-${itemId}-${field}`;

function useDates(sectionId: string, itemId: string) {
  const { updateItem } = useActions();
  return (patch: Partial<DatedValue>) => updateItem(sectionId, itemId, (it) => void Object.assign(it, patch), `${itemId}.dates`);
}

export function ExperienceFields({ sectionId, item }: { sectionId: string; item: ExperienceItem }) {
  const set = useItemSetter(sectionId, item);
  const dates = useDates(sectionId, item.id);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField fid={fid(item.id, 'role')} label="Job title" value={item.role} onChange={set('role')} placeholder="Senior Software Engineer" />
        <TextField fid={fid(item.id, 'organization')} label="Company" value={item.organization} onChange={set('organization')} placeholder="Acme Inc." />
        <TextField fid={fid(item.id, 'location')} label="Location" optional value={item.location} onChange={set('location')} placeholder="Remote" />
        <TextField
          fid={fid(item.id, 'url')}
          label="Company website"
          optional
          type="url"
          inputMode="url"
          value={item.url}
          onChange={set('url')}
          placeholder="acme.com"
        />
      </div>
      <DateRangeFields itemId={item.id} value={item} onChange={dates} currentLabel="I currently work here" />
      <BulletsEditor sectionId={sectionId} itemId={item.id} bullets={item.bullets} label="Achievements" />
    </div>
  );
}

export function EducationFields({ sectionId, item }: { sectionId: string; item: EducationItem }) {
  const set = useItemSetter(sectionId, item);
  const dates = useDates(sectionId, item.id);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField fid={fid(item.id, 'degree')} label="Degree or course" value={item.degree} onChange={set('degree')} placeholder="B.Sc. Computer Science" />
        <TextField fid={fid(item.id, 'institution')} label="School" value={item.institution} onChange={set('institution')} placeholder="University name" />
        <TextField fid={fid(item.id, 'location')} label="Location" optional value={item.location} onChange={set('location')} />
        <TextField fid={fid(item.id, 'score')} label="Grade / GPA" optional value={item.score} onChange={set('score')} placeholder="GPA 3.8 / First class" />
      </div>
      <DateRangeFields itemId={item.id} value={item} onChange={dates} currentLabel="Currently studying" />
      <BulletsEditor sectionId={sectionId} itemId={item.id} bullets={item.bullets} label="Details" />
    </div>
  );
}

export function ProjectFields({ sectionId, item }: { sectionId: string; item: ProjectItem }) {
  const set = useItemSetter(sectionId, item);
  const dates = useDates(sectionId, item.id);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField fid={fid(item.id, 'name')} label="Project name" value={item.name} onChange={set('name')} />
        <TextField
          fid={fid(item.id, 'subtitle')}
          label="Short description"
          optional
          value={item.subtitle}
          onChange={set('subtitle')}
          placeholder="Open-source CLI · 2k users"
        />
        <TextField
          fid={fid(item.id, 'url')}
          label="Link"
          optional
          type="url"
          inputMode="url"
          value={item.url}
          onChange={set('url')}
          placeholder="github.com/you/project"
        />
        <TextField
          fid={fid(item.id, 'stack')}
          label="Tech stack"
          optional
          value={item.stack}
          onChange={set('stack')}
          placeholder="React, Node.js, PostgreSQL"
        />
      </div>
      <DateRangeFields itemId={item.id} value={item} onChange={dates} currentLabel="Ongoing" />
      <BulletsEditor sectionId={sectionId} itemId={item.id} bullets={item.bullets} label="Highlights" />
    </div>
  );
}

export function SkillFields({ sectionId, item }: { sectionId: string; item: SkillItem }) {
  const set = useItemSetter(sectionId, item);
  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <TextField fid={fid(item.id, 'label')} label="Group" value={item.label} onChange={set('label')} placeholder="Languages" />
      <TextAreaField
        fid={fid(item.id, 'keywords')}
        label="Skills"
        value={item.keywords}
        onChange={set('keywords')}
        placeholder="TypeScript, Go, SQL"
        minRows={1}
        soft={300}
        hint="Separate with commas. Mirror the wording in the job post."
      />
    </div>
  );
}

export function CertificationFields({ sectionId, item }: { sectionId: string; item: CertificationItem }) {
  const set = useItemSetter(sectionId, item);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <TextField fid={fid(item.id, 'name')} label="Name" value={item.name} onChange={set('name')} placeholder="AWS Solutions Architect" />
      <TextField fid={fid(item.id, 'issuer')} label="Issuer" optional value={item.issuer} onChange={set('issuer')} />
      <PartialDateField fid={fid(item.id, 'date')} label="Date" value={item.date} onChange={set('date')} />
      <TextField fid={fid(item.id, 'url')} label="Credential link" optional type="url" inputMode="url" value={item.url} onChange={set('url')} />
    </div>
  );
}

export function CustomFields({ sectionId, item, compact }: { sectionId: string; item: CustomItem; compact: boolean }) {
  const set = useItemSetter(sectionId, item);
  const dates = useDates(sectionId, item.id);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField fid={fid(item.id, 'title')} label="Title" value={item.title} onChange={set('title')} />
        <TextField
          fid={fid(item.id, 'subtitle')}
          label="Subtitle"
          optional
          value={item.subtitle}
          onChange={set('subtitle')}
          placeholder="Organisation, role or venue"
        />
        {!compact && <TextField fid={fid(item.id, 'location')} label="Location" optional value={item.location} onChange={set('location')} />}
        <TextField fid={fid(item.id, 'url')} label="Link" optional type="url" inputMode="url" value={item.url} onChange={set('url')} />
      </div>
      <DateRangeFields itemId={item.id} value={item} onChange={dates} currentLabel="Ongoing" />
      <TextAreaField
        fid={fid(item.id, 'description')}
        label="Description"
        optional
        value={item.description}
        onChange={set('description')}
        minRows={compact ? 1 : 2}
        soft={compact ? 140 : 500}
      />
      {!compact && <BulletsEditor sectionId={sectionId} itemId={item.id} bullets={item.bullets} />}
    </div>
  );
}
