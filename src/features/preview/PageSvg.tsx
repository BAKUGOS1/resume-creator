import { memo } from 'react';
import type { Page } from '../../engine';
import { LinkGlyphShapes } from '../../components/ui/LinkGlyph';
import { ICON_STROKE } from '../../engine/icons';
import { cssFamily } from './fonts';

export interface PageSvgProps {
  page: Page;
  /** Rendered width in CSS pixels; height follows the page aspect ratio. */
  width?: number | string;
  label: string;
  interactiveLinks?: boolean;
  className?: string;
}

/** One résumé page drawn from layout ops; text stays real, selectable text. */
export const PageSvg = memo(function PageSvg({ page, width = '100%', label, interactiveLinks = true, className }: PageSvgProps) {
  return (
    <svg
      className={`resume-page ${className ?? ''}`}
      viewBox={`0 0 ${page.width} ${page.height}`}
      width={width}
      role="img"
      aria-label={label}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', background: '#fff', aspectRatio: `${page.width} / ${page.height}`, height: 'auto' }}
    >
      <rect width={page.width} height={page.height} fill="#fff" />
      {page.ops.map((op, i) => {
        switch (op.type) {
          case 'text':
            return (
              <text
                key={i}
                x={op.x}
                y={op.y}
                fontFamily={cssFamily(op.face)}
                fontSize={op.size}
                fill={op.color}
                letterSpacing={op.cs || undefined}
                xmlSpace="preserve"
              >
                {op.text}
              </text>
            );
          case 'rect':
            return <rect key={i} x={op.x} y={op.y} width={op.w} height={op.h} fill={op.color} />;
          case 'circle':
            return <circle key={i} cx={op.cx} cy={op.cy} r={op.r} fill={op.color} />;
          case 'icon':
            return (
              <g
                key={i}
                transform={`translate(${op.x} ${op.y}) scale(${op.size / 24})`}
                fill="none"
                stroke={op.color}
                strokeWidth={ICON_STROKE}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <LinkGlyphShapes icon={op.icon} />
              </g>
            );
          case 'line':
            return <line key={i} x1={op.x1} y1={op.y1} x2={op.x2} y2={op.y2} stroke={op.color} strokeWidth={op.width} />;
          case 'link':
            return interactiveLinks ? (
              <a key={i} href={op.url} target="_blank" rel="noopener noreferrer" aria-label={op.url.replace(/^mailto:/, 'Email ').replace(/^tel:/, 'Call ')}>
                <rect x={op.x} y={op.y} width={op.w} height={op.h} fill="transparent" className="hover:fill-[rgb(255_224_102/0.45)]" />
              </a>
            ) : null;
        }
      })}
    </svg>
  );
});
