import React, { useState } from 'react';
import {
  calculateThreadPoolMetrics,
  ConcurrencyRuntimeMode,
} from '../utils/concurrencyEngine';
import { RichText } from './RichText';
import { Cpu, Layers, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';

export const ThreadPoolSim: React.FC = () => {
  const [mode, setMode] = useState<ConcurrencyRuntimeMode>('swift-cooperative');
  const [cpuCores, setCpuCores] = useState<number>(4);
  const [incomingTasks, setIncomingTasks] = useState<number>(28);

  const metrics = calculateThreadPoolMetrics(mode, cpuCores, incomingTasks);

  const handleReset = () => {
    setMode('swift-cooperative');
    setCpuCores(4);
    setIncomingTasks(28);
  };

  return (
    <div className="rounded-xl border border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs">
      {/* Top Bar of Simulator */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-stone-100/80 dark:bg-stone-950/60 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2">
            <span>آزمایشگاه تعاملی ۰۱</span>
            <span aria-hidden="true">·</span>
            <span dir="ltr" className="font-mono-tech">
              Cooperative Thread Pool vs GCD
            </span>
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mt-0.5">
            شبیه‌ساز تخصیص <span dir="ltr" className="font-mono-tech">Thread</span> در برابر <span dir="ltr" className="font-mono-tech">Continuation</span>
          </h3>
        </div>

        {/* Mode Segmented Selector */}
        <div
          role="group"
          aria-label="انتخاب مدل اجرای هم‌زمانی"
          className="flex items-center gap-1 p-1 bg-stone-200/80 dark:bg-stone-800 rounded-lg"
        >
          <button
            type="button"
            onClick={() => setMode('swift-cooperative')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'swift-cooperative'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            مدل مدرن Swift (<span dir="ltr" className="font-mono-tech">async/await</span>)
          </button>
          <button
            type="button"
            onClick={() => setMode('gcd-blocking')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'gcd-blocking'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            مدل سنتی GCD (<span dir="ltr" className="font-mono-tech">Blocking Threads</span>)
          </button>
        </div>
      </div>

      {/* Main Two-Zone Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left/Top Stage (8 cols): Visual Core & Thread Allocation */}
        <div className="lg:col-span-8 p-6 border-b lg:border-b-0 lg:border-l border-stone-200 dark:border-stone-800 flex flex-col justify-between gap-6">
          {/* Status Banner with explicit glyph + label (No Hue-Only signaling) */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-200/80 dark:border-stone-800">
            <div className="flex items-center gap-2.5">
              {metrics.statusLevel === 'nominal' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
              )}
              <div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-stone-900 dark:text-stone-100">
                    وضعیت زمان اجرا:
                  </span>
                  <span
                    dir="ltr"
                    className={`font-mono-tech font-semibold ${
                      metrics.statusLevel === 'nominal'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {metrics.statusLevel === 'nominal' ? '● NOMINAL' : '▲ ' + metrics.statusLabelEn}
                  </span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-6">
                  <RichText text={metrics.summaryFa} />
                </p>
              </div>
            </div>
          </div>

          {/* Physical CPU Cores Row */}
          <div>
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-3">
              <span className="flex items-center gap-1.5 font-medium text-stone-800 dark:text-stone-200">
                <Cpu className="w-4 h-4 text-amber-700 dark:text-amber-500" />
                هسته‌های فیزیکی پردازنده (<span dir="ltr" className="font-mono-tech">Hardware CPU Cores: {cpuCores}</span>)
              </span>
              <span dir="ltr" className="font-mono-tech">
                Width == {cpuCores} Cores
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: cpuCores }).map((_, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span dir="ltr" className="font-mono-tech font-semibold text-stone-800 dark:text-stone-200">
                      Core #{idx + 1}
                    </span>
                    <span dir="ltr" className="font-mono-tech text-[11px] text-emerald-700 dark:text-emerald-400">
                      Executing
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-600 dark:text-stone-400 font-mono-tech" dir="ltr">
                    {mode === 'swift-cooperative'
                      ? `Worker Thread #${idx + 1} (Non-blocking)`
                      : `Kernel Thread #${idx + 1} (Active)`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Waiting Tasks Visualization: Kernel Threads vs Lightweight Heap Continuations */}
          <div>
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="flex items-center gap-1.5 font-medium text-stone-800 dark:text-stone-200">
                <Layers className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                {mode === 'swift-cooperative' ? (
                  <>
                    تسک‌های معلق در نقطه <code dir="ltr" className="tech-term bg-stone-200 dark:bg-stone-800">await</code> (ذخیره‌شده به‌صورت <code dir="ltr" className="tech-term bg-stone-200 dark:bg-stone-800">AsyncFrame</code> در <code dir="ltr" className="tech-term bg-stone-200 dark:bg-stone-800">Heap</code>)
                  </>
                ) : (
                  <>
                    رشته‌های کرنل مسدودشده در انتظار I/O (<code dir="ltr" className="tech-term bg-stone-200 dark:bg-stone-800">Blocked OS Threads</code> با پشته <code dir="ltr" className="tech-term bg-stone-200 dark:bg-stone-800">512KB Stack</code>)
                  </>
                )}
              </span>
              <span dir="ltr" className="tabular-nums-ltr text-xs text-stone-500">
                {mode === 'swift-cooperative'
                  ? `${metrics.suspendedContinuationsInHeap} Continuations`
                  : `${metrics.blockedThreads} Blocked Threads`}
              </span>
            </div>

            <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-950/70 border border-stone-200/90 dark:border-stone-800 min-h-[104px]">
              {mode === 'swift-cooperative' ? (
                metrics.suspendedContinuationsInHeap === 0 ? (
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    تمام تسک‌ها مستقیماً روی هسته‌های پردازنده در حال اجرا هستند و هیچ تسکی در صف انتظار <code dir="ltr" className="font-mono-tech">Continuation</code> نیست.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({
                      length: Math.min(36, metrics.suspendedContinuationsInHeap),
                    }).map((_, i) => (
                      <div
                        key={i}
                        dir="ltr"
                        className="px-2 py-1 rounded text-[11px] font-mono-tech bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300/70 dark:border-emerald-800/70"
                      >
                        Cont#{i + 1} (4KB)
                      </div>
                    ))}
                    {metrics.suspendedContinuationsInHeap > 36 && (
                      <span dir="ltr" className="text-xs font-mono-tech text-stone-500 self-center px-2">
                        +{metrics.suspendedContinuationsInHeap - 36} more in Heap
                      </span>
                    )}
                  </div>
                )
              ) : metrics.blockedThreads === 0 ? (
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  تعداد تسک‌ها برابر یا کمتر از هسته‌های CPU است؛ هنوز رشته اضافی مسدود نشده است.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({
                    length: Math.min(36, metrics.blockedThreads),
                  }).map((_, i) => (
                    <div
                      key={i}
                      dir="ltr"
                      className="px-2 py-1 rounded text-[11px] font-mono-tech bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 border border-red-300/70 dark:border-red-800/70"
                    >
                      BlockedThread#{i + cpuCores + 1} (512KB)
                    </div>
                  ))}
                  {metrics.blockedThreads > 36 && (
                    <span dir="ltr" className="text-xs font-mono-tech text-stone-500 self-center px-2">
                      +{metrics.blockedThreads - 36} blocked threads
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right/Bottom Control & Telemetry Deck (4 cols) */}
        <div className="lg:col-span-4 p-6 bg-stone-50/60 dark:bg-stone-950/30 flex flex-col justify-between gap-6">
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <label
                  htmlFor="cpu-cores-slider"
                  className="font-semibold text-stone-800 dark:text-stone-200"
                >
                  تعداد هسته‌های پردازنده (<span dir="ltr" className="font-mono-tech">CPU Cores</span>):
                </label>
                <span dir="ltr" className="tabular-nums-ltr font-bold text-amber-800 dark:text-amber-400">
                  {cpuCores} Cores
                </span>
              </div>
              <input
                id="cpu-cores-slider"
                type="range"
                min={2}
                max={12}
                step={2}
                value={cpuCores}
                onChange={(e) => setCpuCores(Number(e.target.value))}
                className="w-full accent-amber-700 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono-tech text-stone-400 mt-1" dir="ltr">
                <span>2 Cores</span>
                <span>6 Cores</span>
                <span>12 Cores</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <label
                  htmlFor="incoming-tasks-slider"
                  className="font-semibold text-stone-800 dark:text-stone-200"
                >
                  تعداد تسک‌های هم‌زمان (<span dir="ltr" className="font-mono-tech">Concurrent I/O Tasks</span>):
                </label>
                <span dir="ltr" className="tabular-nums-ltr font-bold text-amber-800 dark:text-amber-400">
                  {incomingTasks} Tasks
                </span>
              </div>
              <input
                id="incoming-tasks-slider"
                type="range"
                min={4}
                max={64}
                step={4}
                value={incomingTasks}
                onChange={(e) => setIncomingTasks(Number(e.target.value))}
                className="w-full accent-amber-700 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono-tech text-stone-400 mt-1" dir="ltr">
                <span>4 Tasks</span>
                <span>32 Tasks</span>
                <span>64 Tasks</span>
              </div>
            </div>

            {/* Quantitative Telemetry Table */}
            <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-600 dark:text-stone-400">
                  رشته‌های کرنل ساخته‌شده (<span dir="ltr" className="font-mono-tech">Kernel Threads</span>):
                </span>
                <span dir="ltr" className="tabular-nums-ltr font-semibold text-stone-900 dark:text-stone-100">
                  {metrics.activeThreadsCreated} threads
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-600 dark:text-stone-400">
                  مصرف حافظه پشته/هیپ (<span dir="ltr" className="font-mono-tech">Memory Overhead</span>):
                </span>
                <span dir="ltr" className="tabular-nums-ltr font-semibold text-stone-900 dark:text-stone-100">
                  {(metrics.memoryFootprintKB / 1024).toFixed(2)} MB
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-600 dark:text-stone-400">
                  شاخص سربار <span dir="ltr" className="font-mono-tech">Context Switch</span>:
                </span>
                <span
                  dir="ltr"
                  className={`tabular-nums-ltr font-semibold ${
                    metrics.contextSwitchOverheadScore > 40
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {metrics.contextSwitchOverheadScore}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-200/70 dark:bg-stone-800 rounded-md hover:bg-stone-300/70 dark:hover:bg-stone-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              بازنشانی پارامترها
            </button>
            <span dir="ltr" className="text-[11px] font-mono-tech text-stone-400">
              Forward Progress Contract
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
