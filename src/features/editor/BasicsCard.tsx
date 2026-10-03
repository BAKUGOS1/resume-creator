import { IconButton } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { ArrowDownIcon, ArrowUpIcon, LinkIcon, PlusIcon, Trash2Icon } from '../../components/ui/icons';
import { fieldId } from '../../domain/checks';
import { LIMITS, type Basics } from '../../domain/schema';
import { createId } from '../../lib/id';
import { move, useActions, useFieldError } from './context';
import { TextField } from './fields';

function LinkRow({ link, index, count }: { link: Basics['links'][number]; index: number; count: number }) {
  const { update } = useActions();
  const urlId = fieldId('link', link.id, 'url');
  const error = useFieldError(urlId);
  const edit = (fn: (links: Basics['links']) => void, key?: string) => update((d) => fn(d.basics.links), key);
  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Input
          aria-label={`Link ${index + 1} label`}
          list="link-label-suggestions"
          value={link.label}
          maxLength={40}
          placeholder="LinkedIn"
          onChange={(e) => edit((l) => void (l[index]!.label = e.target.value), `${link.id}.label`)}
          className="w-28! shrink-0 sm:w-36!"
        />
        <Input
          id={urlId}
          aria-label={`Link ${index + 1} URL`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${urlId}-error` : undefined}
          type="url"
          inputMode="url"
          value={link.url}
          maxLength={LIMITS.shortText}
          placeholder="linkedin.com/in/you"
          onChange={(e) => edit((l) => void (l[index]!.url = e.target.value), `${link.id}.url`)}
          className="min-w-0 flex-1"
        />
        <div className="flex shrink-0">
          <IconButton size="sm" label="Move link up" disabled={index === 0} onClick={() => edit((l) => move(l, index, index - 1))} className="max-sm:hidden">
            <ArrowUpIcon size={14} />
          </IconButton>
          <IconButton
            size="sm"
            label="Move link down"
            disabled={index === count - 1}
            onClick={() => edit((l) => move(l, index, index + 1))}
            className="max-sm:hidden"
          >
            <ArrowDownIcon size={14} />
          </IconButton>
          <IconButton size="sm" label={`Remove link ${link.label || index + 1}`} onClick={() => edit((l) => void l.splice(index, 1))}>
            <Trash2Icon size={14} />
          </IconButton>
        </div>
      </div>
      {error && (
        <p id={`${urlId}-error`} role="alert" className="text-[12.5px] text-danger">
          {error}
        </p>
      )}
    </li>
  );
}

export function BasicsCard({ basics }: { basics: Basics }) {
  const { update } = useActions();
  const set =
    <K extends Exclude<keyof Basics, 'links'>>(key: K) =>
    (value: string) =>
      update((d) => void (d.basics[key] = value), `basics.${key}`);

  return (
    <section aria-labelledby="basics-title" className="rounded-2xl border border-line bg-surface-2/50 p-3">
      <h3 id="basics-title" className="px-1 pt-1 pb-3 text-[14.5px] font-semibold">
        Personal details
      </h3>
      <div className="grid gap-3 rounded-xl border border-line bg-surface p-3.5 sm:grid-cols-2">
        <TextField
          fid={fieldId('basics', 'name')}
          label="Full name"
          value={basics.name}
          onChange={set('name')}
          autoComplete="name"
          placeholder="Jordan Ellis"
          className="sm:col-span-2"
        />
        <TextField
          fid={fieldId('basics', 'headline')}
          label="Headline"
          value={basics.headline}
          onChange={set('headline')}
          placeholder="Senior Software Engineer"
          hint="Your target role."
        />
        <TextField
          fid={fieldId('basics', 'tagline')}
          label="Tagline"
          optional
          value={basics.tagline}
          onChange={set('tagline')}
          placeholder="Payments and platform"
        />
        <TextField
          fid={fieldId('basics', 'email')}
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={basics.email}
          onChange={set('email')}
          placeholder="you@example.com"
        />
        <TextField
          fid={fieldId('basics', 'phone')}
          label="Phone"
          optional
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={basics.phone}
          onChange={set('phone')}
          placeholder="+1 555 010 2030"
        />
        <TextField
          fid={fieldId('basics', 'location')}
          label="Location"
          value={basics.location}
          onChange={set('location')}
          autoComplete="address-level2"
          placeholder="City, Country"
          className="sm:col-span-2"
        />
        <div className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-[13px] font-medium">Links</span>
          {basics.links.length > 0 && (
            <ul className="flex flex-col gap-2">
              {basics.links.map((l, i) => (
                <LinkRow key={l.id} link={l} index={i} count={basics.links.length} />
              ))}
            </ul>
          )}
          <datalist id="link-label-suggestions">
            {['LinkedIn', 'GitHub', 'Portfolio', 'Website', 'GitLab', 'Dribbble', 'Behance'].map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <button
            type="button"
            disabled={basics.links.length >= LIMITS.links}
            onClick={() => {
              const id = createId('l_');
              update((d) => void d.basics.links.push({ id, label: '', url: '' }));
              requestAnimationFrame(() => document.getElementById(fieldId('link', id, 'url'))?.focus());
            }}
            className="inline-flex w-fit items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] font-medium text-brand hover:bg-brand-soft disabled:opacity-50"
          >
            {basics.links.length ? <PlusIcon size={15} /> : <LinkIcon size={15} />} Add link
          </button>
        </div>
      </div>
    </section>
  );
}
