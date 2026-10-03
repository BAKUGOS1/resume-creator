import type { LinkIcon } from '../../domain/schema';
import { ICON_STROKE, ICONS } from '../../engine/icons';

/** The shapes of a contact icon, for use inside an existing <svg> or <g> (24×24 units). */
export function LinkGlyphShapes({ icon }: { icon: LinkIcon }) {
  return (
    <>
      {ICONS[icon].shapes.map((s, i) =>
        'd' in s ? (
          <path key={i} d={s.d} />
        ) : 'circle' in s ? (
          <circle key={i} cx={s.circle[0]} cy={s.circle[1]} r={s.circle[2]} />
        ) : (
          <rect key={i} x={s.rect[0]} y={s.rect[1]} width={s.rect[2]} height={s.rect[3]} rx={s.rect[4]} />
        ),
      )}
    </>
  );
}

/** A contact icon exactly as it appears on the résumé. Decorative. */
export function LinkGlyph({ icon, size = 16, className }: { icon: LinkIcon; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={ICON_STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <LinkGlyphShapes icon={icon} />
    </svg>
  );
}
