/** Bound form fields used by every section editor. */
import { useEffect, useId, useState } from 'react';
import { LIMITS } from '../../domain/schema';
import { CharCount, Field, Input, Select, Textarea } from '../../components/ui/Field';
import { Checkbox } from '../../components/ui/Switch';
import { useFieldError } from './context';

interface TextProps {
  fid: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  optional?: boolean;
  type?: 'text' | 'email' | 'tel' | 'url';
  autoComplete?: string;
  maxLength?: number;
  className?: string;
  inputMode?: 'text' | 'email' | 'tel' | 'url' | 'numeric';
}

export function TextField({ fid, label, value, onChange, hint, optional, className, maxLength = LIMITS.shortText, type = 'text', ...rest }: TextProps) {
  const error = useFieldError(fid);
  return (
    <Field id={fid} label={label} hint={hint} error={error} optional={optional} className={className}>
      {(a11y) => (
        <Input {...a11y} type={type} value={value} maxLength={maxLength} spellCheck={type === 'text'} onChange={(e) => onChange(e.target.value)} {...rest} />
      )}
    </Field>
  );
}

export function TextAreaField({
  fid,
  label,
  value,
  onChange,
  hint,
  optional,
  className,
  placeholder,
  soft = 600,
  max = LIMITS.longText,
  minRows = 3,
}: Omit<TextProps, 'type'> & { soft?: number; max?: number; minRows?: number }) {
  const error = useFieldError(fid);
  return (
    <Field id={fid} label={label} hint={hint} error={error} optional={optional} className={className} aside={<CharCount value={value} soft={soft} max={max} />}>
      {(a11y) => <Textarea {...a11y} value={value} maxLength={max} minRows={minRows} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
    </Field>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Month (optional) + year picker producing "YYYY" or "YYYY-MM". Works everywhere, unlike <input type="month">. */
export function PartialDateField({
  fid,
  label,
  value,
  onChange,
  disabled,
}: {
  fid: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const error = useFieldError(fid);
  const [year, month = ''] = value.split('-');
  const [yearText, setYearText] = useState(year ?? '');
  const groupId = useId();

  // Re-sync when the value changes from outside (undo, import).
  useEffect(() => setYearText(year ?? ''), [year]);

  const commit = (y: string, m: string) => {
    if (!y) return onChange('');
    if (/^\d{4}$/.test(y)) onChange(m ? `${y}-${m}` : y);
  };

  return (
    <div role="group" aria-labelledby={groupId} className="flex min-w-0 flex-col gap-1.5">
      <span id={groupId} className="text-[13px] font-medium">
        {label}
      </span>
      <div className="flex gap-2">
        <Select
          aria-label={`${label} month`}
          value={month}
          disabled={disabled || !/^\d{4}$/.test(yearText)}
          onChange={(e) => commit(yearText, e.target.value)}
          className="w-[5.5rem]! shrink-0"
        >
          <option value="">Month</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={String(i + 1).padStart(2, '0')}>
              {m}
            </option>
          ))}
        </Select>
        <Input
          id={fid}
          aria-label={`${label} year`}
          aria-invalid={error || (yearText && !/^\d{4}$/.test(yearText)) ? true : undefined}
          aria-describedby={error ? `${fid}-error` : undefined}
          inputMode="numeric"
          placeholder="Year"
          maxLength={4}
          disabled={disabled}
          value={disabled ? '' : yearText}
          onChange={(e) => {
            const y = e.target.value.replace(/\D/g, '').slice(0, 4);
            setYearText(y);
            commit(y, month);
          }}
          onBlur={() => !/^\d{4}$/.test(yearText) && yearText && setYearText(year ?? '')}
          className="min-w-0 flex-1"
        />
      </div>
      {error && (
        <p id={`${fid}-error`} role="alert" className="text-[12.5px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export interface DatedValue {
  start: string;
  end: string;
  current: boolean;
}

export function DateRangeFields({
  itemId,
  value,
  onChange,
  currentLabel = 'Present',
}: {
  itemId: string;
  value: DatedValue;
  onChange: (patch: Partial<DatedValue>) => void;
  currentLabel?: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <PartialDateField fid={`f-item-${itemId}-start`} label="Start" value={value.start} onChange={(start) => onChange({ start })} />
      <div className="flex flex-col gap-2">
        <PartialDateField fid={`f-item-${itemId}-end`} label="End" value={value.end} disabled={value.current} onChange={(end) => onChange({ end })} />
        <Checkbox
          id={`f-item-${itemId}-current`}
          checked={value.current}
          onChange={(current) => onChange({ current, ...(current ? { end: '' } : {}) })}
          label={currentLabel}
        />
      </div>
    </div>
  );
}
