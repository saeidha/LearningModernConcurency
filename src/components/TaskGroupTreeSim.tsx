import React, { useState } from 'react';
import { simulateTaskGroupExecution } from '../utils/concurrencyEngine';
import { RichText } from './RichText';
import {
  GitBranch,
  CheckCircle2,
  XCircle,
  Ban,
  RotateCcw,
} from 'lucide-react';

export const TaskGroupTreeSim: React.FC = () => {
  const [injectAuthError, setInjectAuthError] = useState<boolean>(false);
  const [manualCancelMs, setManualCancelMs] = useState<number | null>(null);

  const specs = [
    {
      id: 'child-1',
      title: 'دریافت تصویر کاور (CDN Image #1)',
      durationMs: 300,
      willThrowError: false,
    },
    {
      id: 'child-2',
      title: 'اعتبارسنجی نشست (Token Verify)',
      durationMs: 400,
      willThrowError: injectAuthError,
    },
    {
      id: 'child-3',
      title: 'پردازش سنگین گراف (Graph Index)',
      durationMs: 650,
      willThrowError: false,
    },
  ];

  const outcome = simulateTaskGroupExecution(specs, manualCancelMs);

  const handleReset = () => {
    setInjectAuthError(false);
    setManualCancelMs(null);
  };

  return (
    <div className="rounded-xl border border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-stone-100/80 dark:bg-stone-950/60 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2">
            <span>آزمایشگاه تعاملی ۰۳</span>
            <span aria-hidden="true">·</span>
            <span dir="ltr" className="font-mono-tech">
              Structured Concurrency & TaskGroup Tree
            </span>
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mt-0.5">
            درخت حیات وظایف (<span dir="ltr" className="font-mono-tech">Task Hierarchy</span>) و لغو مشارکتی (<span dir="ltr" className="font-mono-tech">Cooperative Cancellation</span>)
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setInjectAuthError((prev) => !prev);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              injectAuthError
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            {injectAuthError
              ? 'حذف خطای پرتاب‌شده (Normal Execution)'
              : 'تزریق خطا در فرزند دوم (Throw Error at 200ms)'}
          </button>
          <button
            type="button"
            onClick={() =>
              setManualCancelMs((prev) => (prev === 350 ? null : 350))
            }
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              manualCancelMs != null
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            {manualCancelMs != null
              ? 'لغو دستی فعال در 350ms'
              : 'فراخوانی parentTask.cancel() در 350ms'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left Stage (8 cols): Hierarchical Tree Visualization */}
        <div className="lg:col-span-8 p-6 border-b lg:border-b-0 lg:border-l border-stone-200 dark:border-stone-800 space-y-6">
          {/* Root Parent Scope Node */}
          <div className="p-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950/80">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span dir="ltr" className="font-mono-tech font-bold text-sm text-stone-900 dark:text-stone-100">
                  withThrowingTaskGroup(of: Data.self) {'{ group in ... }'}
                </span>
              </div>
              <span
                dir="ltr"
                className={`font-mono-tech text-xs font-semibold ${
                  outcome.parentStatus === 'completed'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : outcome.parentStatus === 'thrown-error'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-amber-700 dark:text-amber-400'
                }`}
              >
                {outcome.parentStatus === 'completed'
                  ? '● SCOPE COMPLETED (650ms)'
                  : outcome.parentStatus === 'thrown-error'
                  ? `▲ RETHROWN ERROR (${outcome.totalElapsedMs}ms)`
                  : `■ CANCELLED (${outcome.totalElapsedMs}ms)`}
              </span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 leading-6">
              <RichText text={outcome.structuredGuaranteeFa} />
            </p>
          </div>

          {/* Child Task Nodes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {outcome.children.map((child, idx) => {
              const isCompleted = child.status === 'completed';
              const isFailed = child.status === 'failed';
              return (
                <div
                  key={child.id}
                  className={`p-4 rounded-lg border transition-colors flex flex-col justify-between gap-3 ${
                    isCompleted
                      ? 'border-emerald-300/80 dark:border-emerald-800/70 bg-emerald-50/40 dark:bg-emerald-950/20'
                      : isFailed
                      ? 'border-red-300/90 dark:border-red-800/80 bg-red-50/50 dark:bg-red-950/30'
                      : 'border-amber-300/80 dark:border-amber-800/70 bg-amber-50/40 dark:bg-amber-950/20'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span dir="ltr" className="font-mono-tech font-semibold text-stone-700 dark:text-stone-300">
                        Child Task #{idx + 1}
                      </span>
                      <span
                        dir="ltr"
                        className={`inline-flex items-center gap-1 font-mono-tech text-[11px] font-semibold ${
                          isCompleted
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : isFailed
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            COMPLETED
                          </>
                        ) : isFailed ? (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            THREW ERROR
                          </>
                        ) : (
                          <>
                            <Ban className="w-3.5 h-3.5" />
                            CANCELLED
                          </>
                        )}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      {child.title}
                    </h4>
                  </div>

                  <div className="pt-2 border-t border-stone-200/70 dark:border-stone-800 text-[11px] text-stone-600 dark:text-stone-400 space-y-1">
                    <div className="flex justify-between">
                      <span>زمان اسمی:</span>
                      <span dir="ltr" className="tabular-nums-ltr font-mono-tech">
                        {child.durationMs} ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>خروج از درخت:</span>
                      <span dir="ltr" className="tabular-nums-ltr font-mono-tech font-semibold">
                        {child.completedAtMs} ms
                      </span>
                    </div>
                    <p className="text-[11px] leading-5 pt-1 text-stone-700 dark:text-stone-300">
                      <RichText text={child.statusNoteFa} />
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Concept & Code Deck (4 cols) */}
        <div className="lg:col-span-4 p-6 bg-stone-50/60 dark:bg-stone-950/30 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">
              الگوی استاندارد بررسی لغو (<span dir="ltr" className="font-mono-tech">Cooperative Cancellation</span>)
            </h4>
            <p className="text-xs leading-6 text-stone-600 dark:text-stone-400">
              در سوئیفت، لغو شدن یک تسک به‌معنای قطع ناگهانی و غیرایمن رشته در میانه کار نیست؛ بلکه پرچم <code dir="ltr" className="tech-term bg-stone-200 dark:bg-stone-800">Task.isCancelled</code> روشن می‌شود و فراخوانی <code dir="ltr" className="tech-term bg-stone-200 dark:bg-stone-800">try Task.checkCancellation()</code> خطای <code dir="ltr" className="tech-term bg-stone-200 dark:bg-stone-800">CancellationError</code> پرتاب می‌کند:
            </p>
            <pre
              dir="ltr"
              className="p-3 rounded-lg bg-stone-950 text-stone-200 font-mono-tech text-[11px] leading-5 overflow-x-auto border border-stone-800"
            >
{`group.addTask {
    // 1. Automatically checks cancellation
    try Task.checkCancellation()
    
    // 2. URLSession & Task.sleep respect
    //    cancellation automatically:
    let (data, _) = try await session.data(from: url)
    return data
}`}
            </pre>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-200/70 dark:bg-stone-800 rounded-md hover:bg-stone-300/70 dark:hover:bg-stone-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              بازنشانی به حالت عادی
            </button>
            <span dir="ltr" className="text-[11px] font-mono-tech text-stone-400">
              SE-0304 Structured Concurrency
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
