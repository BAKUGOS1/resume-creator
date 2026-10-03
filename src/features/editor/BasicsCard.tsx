import { useId, useRef, type KeyboardEvent } from 'react';
import { IconButton } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { ArrowDownIcon, ArrowUpIcon, ChevronDownIcon, LinkIcon, PlusIcon, Trash2Icon, UploadIcon } from '../../components/ui/icons';
import { toast } from '../../store/ui';
import { LinkGlyph } from '../../components/ui/LinkGlyph';
import { Menu } from '../../components/ui/Menu';
import { fieldId } from '../../domain/checks';
import { detectLink, linkIcon, linkText, LINK_STYLE_LABELS } from '../../domain/links';
import { LIMITS, LINK_ICONS, LINK_STYLES, type Basics, type Link, type LinkStyle } from '../../domain/schema';
import { ICONS } from '../../engine/icons';
import { cn } from '../../lib/cn';
import { createId } from '../../lib/id';
import { move, useActions, useFieldError } from './context';
import { TextField } from './fields';

const STYLE_HINTS: Record<LinkStyle, string> = {
  url: 'Shows each full address. The safest choice for strict ATS portals.',
  text: 'Shows the label. The address stays clickable in the PDF, Word and web versions.',
  'icon-text': 'Adds a matching icon before each label and contact detail. Links stay clickable.',
  icon: 'Shows only the icon for links. Your email and phone always keep their text.',
};

/** A tiny rendering of how a link looks in each style. */
function StyleSample({ link, style }: { link: Link; style: LinkStyle }) {
  const text = linkText(link, style);
  return (
    <span className="flex h-6 max-w-full min-w-0 items-center gap-1 text-[12.5px] text-brand">
      {(style === 'icon-text' || style === 'icon') &&
        (link.icon === 'custom' && link.iconImage ? (
          <img src={link.iconImage} alt="" className={cn('shrink-0 object-contain', style === 'icon' ? 'size-4' : 'size-3.5')} />
        ) : (
          <LinkGlyph icon={linkIcon(link)} size={style === 'icon' ? 16 : 14} className="shrink-0" />
        ))}
      {style !== 'icon' && <span className="truncate">{text}</span>}
    </span>
  );
}

function LinkStylePicker({ value, sample }: { value: LinkStyle; sample: Link }) {
  const { update } = useActions();
  const labelId = useId();
  const hintId = useId();
  const set = (v: LinkStyle) => update((d) => void (d.design.linkStyle = v));
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = LINK_STYLES[(LINK_STYLES.indexOf(value) + d + LINK_STYLES.length) % LINK_STYLES.length]!;
    set(next);
    requestAnimationFrame(() => e.currentTarget.querySelector<HTMLElement>(`[data-value="${next}"]`)?.focus());
  };
  return (
    <div className="flex flex-col gap-1.5">
      <span id={labelId} className="text-[12.5px] text-muted">
        Show links as
      </span>
      <div role="radiogroup" aria-labelledby={labelId} aria-describedby={hintId} onKeyDown={onKey} className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {LINK_STYLES.map((style) => {
          const active = style === value;
          return (
            <button
              key={style}
              id={active ? fieldId('basics', 'linkStyle') : undefined}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              data-value={style}
              onClick={() => set(style)}
              className={cn(
                'flex min-w-0 flex-col items-start gap-1 rounded-lg border px-2.5 py-2 text-left transition-colors',
                active ? 'border-brand bg-brand-soft/60 ring-1 ring-brand' : 'border-line bg-surface hover:border-subtle',
              )}
            >
              <StyleSample link={sample} style={style} />
              <span className={cn('text-[12.5px]', active ? 'font-medium text-fg' : 'text-muted')}>{LINK_STYLE_LABELS[style]}</span>
            </button>
          );
        })}
      </div>
      <p id={hintId} aria-live="polite" className="text-[12.5px] text-subtle">
        {STYLE_HINTS[value]}
      </p>
    </div>
  );
}

/** Re-encodes an uploaded image as a small square PNG (also neutralises SVG scripts). */
async function toIconPng(file: File): Promise<string> {
  if (!file.type.startsWith('image/') || file.size > 2_000_000) throw new Error('Use a PNG, JPG, SVG or WebP image under 2 MB.');
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    for (const px of [96, 64, 40]) {
      const c = document.createElement('canvas');
      c.width = c.height = px;
      const ctx = c.getContext('2d')!;
      const k = Math.min(px / (img.naturalWidth || px), px / (img.naturalHeight || px));
      const w = (img.naturalWidth || px) * k;
      const h = (img.naturalHeight || px) * k;
      ctx.drawImage(img, (px - w) / 2, (px - h) / 2, w, h);
      const data = c.toDataURL('image/png');
      if (data.length <= 60_000) return data;
    }
    throw new Error('That image is too detailed. Try a simpler logo.');
  } catch (e) {
    throw e instanceof Error && e.message.includes('.') ? e : new Error('That file could not be read as an image.');
  } finally {
    URL.revokeObjectURL(url);
  }
}

function IconPicker({ link, name, onPick }: { link: Link; name: string; onPick: (icon: Link['icon'], image?: string) => void }) {
  const detected = detectLink(link.url, link.label).icon;
  const current = linkIcon(link);
  const file = useRef<HTMLInputElement>(null);
  const custom = link.icon === 'custom' && link.iconImage;
  return (
    <>
      <input
        ref={file}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          try {
            onPick('custom', await toIconPng(f));
          } catch (err) {
            toast({ kind: 'error', title: 'Icon not added', message: (err as Error).message });
          }
        }}
      />
      <Menu
        label={`Icon for ${name}`}
        align="start"
        items={[
          {
            label: `Automatic (${ICONS[detected].name})`,
            icon: <LinkGlyph icon={detected} />,
            checked: link.icon === 'auto',
            onSelect: () => onPick('auto'),
          },
          {
            label: link.iconImage ? 'Upload a different icon…' : 'Upload your own icon…',
            icon: <UploadIcon size={16} />,
            onSelect: () => file.current?.click(),
          },
          !!link.iconImage && {
            label: 'Uploaded icon',
            icon: <img src={link.iconImage} alt="" width={16} height={16} className="size-4 object-contain" />,
            checked: link.icon === 'custom',
            onSelect: () => onPick('custom', link.iconImage),
          },
          ...LINK_ICONS.map((id, i) => ({
            label: ICONS[id].name,
            icon: <LinkGlyph icon={id} />,
            checked: link.icon === id,
            separatorBefore: i === 0,
            onSelect: () => onPick(id),
          })),
        ]}
        trigger={(props) => (
          <button
            type="button"
            {...props}
            aria-label={`Icon for ${name}: ${custom ? 'uploaded image' : ICONS[current].name}${link.icon === 'auto' ? ', automatic' : ''}`}
            title="Change icon"
            className="inline-flex h-9 shrink-0 items-center gap-0.5 rounded-lg border border-line bg-surface pr-1 pl-2 text-brand transition-colors hover:border-subtle focus-visible:outline-2 focus-visible:outline-brand"
          >
            {custom ? <img src={link.iconImage} alt="" width={16} height={16} className="size-4 object-contain" /> : <LinkGlyph icon={current} size={16} />}
            <ChevronDownIcon size={12} className="text-subtle" />
          </button>
        )}
      />
    </>
  );
}

function LinkRow({ link, index, count, showIcon }: { link: Link; index: number; count: number; showIcon: boolean }) {
  const { update } = useActions();
  const urlId = fieldId('link', link.id, 'url');
  const error = useFieldError(urlId);
  const edit = (fn: (links: Basics['links']) => void, key?: string) => update((d) => fn(d.basics.links), key);
  const auto = link.url.trim() ? linkText({ ...link, label: '' }, 'text') : '';
  const name = link.label.trim() || auto || `link ${index + 1}`;
  return (
    <li className="flex flex-col gap-1">
      {/* Phones: icon, label and actions on one line, the address full-width below. */}
      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
        {showIcon && (
          <IconPicker
            link={link}
            name={name}
            onPick={(icon, image) =>
              edit((l) => {
                l[index]!.icon = icon;
                if (image) l[index]!.iconImage = image;
              })
            }
          />
        )}
        <Input
          aria-label={`Link ${index + 1} label`}
          list="link-label-suggestions"
          value={link.label}
          maxLength={40}
          placeholder={auto || 'Label'}
          onChange={(e) => edit((l) => void (l[index]!.label = e.target.value), `${link.id}.label`)}
          className="min-w-0 flex-1 sm:w-36! sm:flex-none"
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
          placeholder="github.com/you"
          onChange={(e) => edit((l) => void (l[index]!.url = e.target.value), `${link.id}.url`)}
          className="order-last min-w-0 basis-full sm:order-none sm:basis-0 sm:flex-1"
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

const SAMPLE_LINK: Link = { id: 'sample', label: '', url: 'github.com/you', icon: 'auto' };

export function BasicsCard({ basics, linkStyle }: { basics: Basics; linkStyle: LinkStyle }) {
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
            <>
              <LinkStylePicker value={linkStyle} sample={basics.links.find((l) => l.url.trim()) ?? SAMPLE_LINK} />
              <ul className="flex flex-col gap-3.5 sm:gap-2">
                {basics.links.map((l, i) => (
                  <LinkRow key={l.id} link={l} index={i} count={basics.links.length} showIcon={linkStyle === 'icon-text' || linkStyle === 'icon'} />
                ))}
              </ul>
            </>
          )}
          <datalist id="link-label-suggestions">
            {['LinkedIn', 'GitHub', 'Portfolio', 'Website', 'Blog', 'Email', 'GitLab', 'Dribbble', 'Behance', 'Google Scholar'].map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <button
            type="button"
            disabled={basics.links.length >= LIMITS.links}
            onClick={() => {
              const id = createId('l_');
              update((d) => void d.basics.links.push({ id, label: '', url: '', icon: 'auto' }));
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
