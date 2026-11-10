import React from 'react';

interface RichTextProps {
  text: string;
  className?: string;
}

/**
 * Renders Persian technical editorial prose where backtick-enclosed segments
 * (e.g. `Suspension Point` or `async let`) are automatically rendered as
 * isolated LTR monospace technical badges that never break RTL sentence flow.
 */
export const RichText: React.FC<RichTextProps> = ({ text, className = '' }) => {
  const parts = text.split(/(`[^`]+`)/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('`') && part.endsWith('`')) {
          const term = part.slice(1, -1);
          return (
            <code
              key={index}
              dir="ltr"
              className="tech-term bg-stone-200/80 dark:bg-stone-800/90 text-stone-900 dark:text-stone-100 border border-stone-300/70 dark:border-stone-700/80"
            >
              {term}
            </code>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
};

interface EditorialMarginNoteProps {
  indexLabel: string;
  titleFa: string;
  termEn: string;
  bodyFa: string;
}

export const EditorialMarginNote: React.FC<EditorialMarginNoteProps> = ({
  indexLabel,
  titleFa,
  termEn,
  bodyFa,
}) => {
  return (
    <aside className="p-4 rounded-lg bg-stone-100/90 dark:bg-stone-900/70 border border-stone-200/90 dark:border-stone-800 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-stone-200 dark:border-stone-800">
        <span className="font-semibold text-stone-800 dark:text-stone-200">
          {indexLabel} · {titleFa}
        </span>
        <span
          dir="ltr"
          className="font-mono-tech text-[11px] text-amber-800 dark:text-amber-400"
        >
          {termEn}
        </span>
      </div>
      <p className="leading-6">
        <RichText text={bodyFa} />
      </p>
    </aside>
  );
};
