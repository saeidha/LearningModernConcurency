import React, { useState } from 'react';
import { RichText } from './RichText';
import { Code2, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface PracticalRecipe {
  id: string;
  titleFa: string;
  subtitleEn: string;
  antiPatternTitleFa: string;
  antiPatternCode: string;
  bestPracticeTitleFa: string;
  bestPracticeCode: string;
  architecturalTakeawayFa: string;
}

interface PracticalRecipeGalleryProps {
  chapterBadgeFa: string;
  recipes: PracticalRecipe[];
}

export const PracticalRecipeGallery: React.FC<PracticalRecipeGalleryProps> = ({
  chapterBadgeFa,
  recipes,
}) => {
  const [activeId, setActiveId] = useState<string>(recipes[0]?.id ?? '');
  const [compareMode, setCompareMode] = useState<'side-by-side' | 'best-only'>(
    'side-by-side'
  );

  const activeRecipe =
    recipes.find((r) => r.id === activeId) ?? recipes[0];

  if (!activeRecipe) return null;

  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/60 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 bg-stone-100/90 dark:bg-stone-950/70 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-amber-800 dark:text-amber-400 shrink-0" />
          <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
            مخزن الگوها و مثال‌های واقعی ({chapterBadgeFa})
          </span>
        </div>

        {/* Recipe Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {recipes.map((r, idx) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setActiveId(r.id)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeRecipe.id === r.id
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-200/60'
              }`}
            >
              مثال {idx + 1}: {r.titleFa}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              {activeRecipe.titleFa}
            </h4>
            <span dir="ltr" className="text-[11px] font-mono-tech text-stone-500">
              {activeRecipe.subtitleEn}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              setCompareMode((prev) =>
                prev === 'side-by-side' ? 'best-only' : 'side-by-side'
              )
            }
            className="px-2.5 py-1 text-[11px] font-medium rounded border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-stone-800 cursor-pointer whitespace-nowrap shrink-0"
          >
            {compareMode === 'side-by-side'
              ? 'نمایش فقط کد استاندارد (Focus Best Practice)'
              : 'مقایسه با ضدالگو (Show Anti-Pattern Comparison)'}
          </button>
        </div>

        <div
          className={`grid grid-cols-1 ${
            compareMode === 'side-by-side' ? 'lg:grid-cols-2' : ''
          } gap-4`}
        >
          {compareMode === 'side-by-side' && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>ضدالگو (Anti-Pattern): {activeRecipe.antiPatternTitleFa}</span>
              </div>
              <pre
                dir="ltr"
                className="p-3.5 rounded-lg bg-stone-950 text-stone-200 font-mono-tech text-[11px] leading-5 overflow-x-auto border border-red-900/50"
              >
                {activeRecipe.antiPatternCode}
              </pre>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>الگوی استاندارد (Production Pattern): {activeRecipe.bestPracticeTitleFa}</span>
            </div>
            <pre
              dir="ltr"
              className="p-3.5 rounded-lg bg-stone-950 text-stone-100 font-mono-tech text-[11px] leading-5 overflow-x-auto border border-emerald-900/60"
            >
              {activeRecipe.bestPracticeCode}
            </pre>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs leading-6 text-stone-700 dark:text-stone-300">
          <strong className="text-stone-900 dark:text-stone-100 ml-1">
            تحلیل معماری:
          </strong>
          <RichText text={activeRecipe.architecturalTakeawayFa} />
        </div>
      </div>
    </div>
  );
};
