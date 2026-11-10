import React, { useState } from 'react';
import {
  computeTimelineSchedule,
  AsyncEndpointSpec,
} from '../utils/concurrencyEngine';
import { RichText } from './RichText';
import { Clock, Zap, StepForward, RotateCcw } from 'lucide-react';

export const TimelineComparisonSim: React.FC = () => {
  const [executionMode, setExecutionMode] = useState<
    'sequential-await' | 'parallel-async-let'
  >('parallel-async-let');
  const [profileMs, setProfileMs] = useState<number>(300);
  const [feedMs, setFeedMs] = useState<number>(500);
  const [statsMs, setStatsMs] = useState<number>(400);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  const endpoints: AsyncEndpointSpec[] = [
    {
      id: 'profile',
      name: 'پروفایل کاربر',
      swiftCall: 'fetchProfile()',
      durationMs: profileMs,
      colorClass: 'bg-amber-700 dark:bg-amber-500',
    },
    {
      id: 'feed',
      name: 'فید پست‌ها',
      swiftCall: 'fetchFeed()',
      durationMs: feedMs,
      colorClass: 'bg-sky-700 dark:bg-sky-500',
    },
    {
      id: 'stats',
      name: 'آمار تحلیل‌ها',
      swiftCall: 'fetchAnalytics()',
      durationMs: statsMs,
      colorClass: 'bg-emerald-700 dark:bg-emerald-500',
    },
  ];

  const schedule = computeTimelineSchedule(executionMode, endpoints);
  const sequentialTotalMs = profileMs + feedMs + statsMs;
  const maxAxisMs = Math.max(1200, sequentialTotalMs);

  const safeStepIdx = Math.min(activeStepIndex, schedule.codeSteps.length - 1);
  const currentStep = schedule.codeSteps[safeStepIdx];

  const handleNextStep = () => {
    setActiveStepIndex((prev) => (prev + 1) % schedule.codeSteps.length);
  };

  const handleReset = () => {
    setProfileMs(300);
    setFeedMs(500);
    setStatsMs(400);
    setActiveStepIndex(0);
  };

  const sequentialCodeLines = [
    'func loadDashboard() async throws -> Dashboard {',
    '    let profile = try await fetchProfile()   // Suspends #1',
    '    let feed    = try await fetchFeed()      // Suspends #2',
    '    let stats   = try await fetchAnalytics() // Suspends #3',
    '    return Dashboard(profile, feed, stats)',
    '}',
  ];

  const parallelCodeLines = [
    'func loadDashboard() async throws -> Dashboard {',
    '    async let profile = fetchProfile()       // Spawns Child Task #1',
    '    async let feed    = fetchFeed()          // Spawns Child Task #2',
    '    async let stats   = fetchAnalytics()     // Spawns Child Task #3',
    '    // Single Suspension Point waiting for all 3 in parallel:',
    '    return try await Dashboard(profile, feed, stats)',
    '}',
  ];

  const codeLines =
    executionMode === 'sequential-await' ? sequentialCodeLines : parallelCodeLines;

  return (
    <div className="rounded-xl border border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-stone-100/80 dark:bg-stone-950/60 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2">
            <span>آزمایشگاه تعاملی ۰۲</span>
            <span aria-hidden="true">·</span>
            <span dir="ltr" className="font-mono-tech">
              Sequential await vs Parallel async let
            </span>
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mt-0.5">
            مقایسه خط زمانی اجرای ترتیبی (<span dir="ltr" className="font-mono-tech">await</span>) و موازی (<span dir="ltr" className="font-mono-tech">async let</span>)
          </h3>
        </div>

        <div
          role="group"
          aria-label="حالت زمان‌بندی درخواست‌ها"
          className="flex items-center gap-1 p-1 bg-stone-200/80 dark:bg-stone-800 rounded-lg"
        >
          <button
            type="button"
            onClick={() => {
              setExecutionMode('parallel-async-let');
              setActiveStepIndex(0);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              executionMode === 'parallel-async-let'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            اجرای موازی (<span dir="ltr" className="font-mono-tech">async let</span>)
          </button>
          <button
            type="button"
            onClick={() => {
              setExecutionMode('sequential-await');
              setActiveStepIndex(0);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              executionMode === 'sequential-await'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            اجرای ترتیبی (<span dir="ltr" className="font-mono-tech">Sequential await</span>)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left/Top Stage (8 cols): Gantt Chart + Live Swift Code */}
        <div className="lg:col-span-8 p-6 border-b lg:border-b-0 lg:border-l border-stone-200 dark:border-stone-800 space-y-6">
          {/* Metrics summary row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-200/80 dark:border-stone-800 text-xs">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-stone-500" />
                <span className="text-stone-600 dark:text-stone-400">زمان کل پاسخ:</span>
                <span dir="ltr" className="tabular-nums-ltr font-bold text-sm text-stone-900 dark:text-stone-100">
                  {schedule.totalDurationMs} ms
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span className="text-stone-600 dark:text-stone-400">ضریب شتاب (<span dir="ltr" className="font-mono-tech">Speedup</span>):</span>
                <span dir="ltr" className="tabular-nums-ltr font-bold text-sm text-emerald-700 dark:text-emerald-400">
                  {schedule.speedupFactor}x
                </span>
              </div>
            </div>
            <div dir="ltr" className="font-mono-tech text-stone-500">
              {executionMode === 'parallel-async-let'
                ? `max(${profileMs}, ${feedMs}, ${statsMs}) = ${schedule.totalDurationMs}ms`
                : `${profileMs} + ${feedMs} + ${statsMs} = ${schedule.totalDurationMs}ms`}
            </div>
          </div>

          {/* Visual Timeline Bars (LTR coordinate axis for time progression) */}
          <div className="space-y-3" dir="ltr">
            <div className="flex justify-between text-[11px] font-mono-tech text-stone-400 border-b border-stone-200 dark:border-stone-800 pb-1">
              <span>0 ms</span>
              <span>{Math.round(maxAxisMs * 0.25)} ms</span>
              <span>{Math.round(maxAxisMs * 0.5)} ms</span>
              <span>{Math.round(maxAxisMs * 0.75)} ms</span>
              <span>{maxAxisMs} ms</span>
            </div>

            {schedule.bars.map((bar) => {
              const leftPercent = Math.min(100, (bar.startMs / maxAxisMs) * 100);
              const widthPercent = Math.max(
                6,
                Math.min(100 - leftPercent, (bar.durationMs / maxAxisMs) * 100)
              );

              return (
                <div key={bar.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono-tech font-medium text-stone-800 dark:text-stone-200">
                      {bar.swiftCall}
                    </span>
                    <span className="font-mono-tech text-stone-500 tabular-nums">
                      [{bar.startMs}ms → {bar.endMs}ms] ({bar.durationMs}ms)
                    </span>
                  </div>
                  <div className="w-full h-7 bg-stone-100 dark:bg-stone-950 rounded-md relative overflow-hidden border border-stone-200/80 dark:border-stone-800">
                    <div
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                      className={`h-full ${bar.colorClass} rounded transition-all duration-150 flex items-center justify-center text-[11px] font-mono-tech text-white font-medium`}
                    >
                      {bar.durationMs}ms
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Code Trace */}
          <div className="rounded-lg bg-stone-950 text-stone-100 p-4 border border-stone-800">
            <div className="flex items-center justify-between text-xs text-stone-400 pb-2 mb-3 border-b border-stone-800">
              <span>ردیاب اجرای خط‌به‌خط کامپایلر سوئیفت</span>
              <span dir="ltr" className="font-mono-tech text-amber-400">
                t = {currentStep.timeMs} ms · Step {safeStepIdx + 1}/{schedule.codeSteps.length}
              </span>
            </div>
            <pre dir="ltr" className="font-mono-tech text-xs leading-6 overflow-x-auto">
              {codeLines.map((line, idx) => {
                const lineNum = idx + 1;
                const isHighlighted = currentStep.lineNumber === lineNum;
                return (
                  <div
                    key={lineNum}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      isHighlighted
                        ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                        : 'text-stone-300'
                    }`}
                  >
                    <span className="inline-block w-6 text-stone-500 select-none">
                      {lineNum}
                    </span>
                    {line}
                  </div>
                );
              })}
            </pre>
            <div className="mt-3 pt-3 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <p className="text-stone-300">
                <RichText text={currentStep.explanationFa} />
              </p>
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <StepForward className="w-3.5 h-3.5" />
                گام بعدی اجرا (<span dir="ltr" className="font-mono-tech">Step</span>)
              </button>
            </div>
          </div>
        </div>

        {/* Right/Bottom Controls (4 cols) */}
        <div className="lg:col-span-4 p-6 bg-stone-50/60 dark:bg-stone-950/30 flex flex-col justify-between gap-6">
          <div className="space-y-5">
            <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">
              تنظیم زمان تأخیر هر درخواست شبکه (<span dir="ltr" className="font-mono-tech">Network Latency</span>)
            </h4>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label htmlFor="profile-ms-slider" className="text-stone-700 dark:text-stone-300">
                  درخواست اول (<code dir="ltr" className="font-mono-tech">fetchProfile</code>):
                </label>
                <span dir="ltr" className="tabular-nums-ltr font-semibold text-amber-800 dark:text-amber-400">
                  {profileMs} ms
                </span>
              </div>
              <input
                id="profile-ms-slider"
                type="range"
                min={100}
                max={600}
                step={50}
                value={profileMs}
                onChange={(e) => setProfileMs(Number(e.target.value))}
                className="w-full accent-amber-700 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label htmlFor="feed-ms-slider" className="text-stone-700 dark:text-stone-300">
                  درخواست دوم (<code dir="ltr" className="font-mono-tech">fetchFeed</code>):
                </label>
                <span dir="ltr" className="tabular-nums-ltr font-semibold text-sky-800 dark:text-sky-400">
                  {feedMs} ms
                </span>
              </div>
              <input
                id="feed-ms-slider"
                type="range"
                min={100}
                max={800}
                step={50}
                value={feedMs}
                onChange={(e) => setFeedMs(Number(e.target.value))}
                className="w-full accent-sky-700 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label htmlFor="stats-ms-slider" className="text-stone-700 dark:text-stone-300">
                  درخواست سوم (<code dir="ltr" className="font-mono-tech">fetchAnalytics</code>):
                </label>
                <span dir="ltr" className="tabular-nums-ltr font-semibold text-emerald-800 dark:text-emerald-400">
                  {statsMs} ms
                </span>
              </div>
              <input
                id="stats-ms-slider"
                type="range"
                min={100}
                max={700}
                step={50}
                value={statsMs}
                onChange={(e) => setStatsMs(Number(e.target.value))}
                className="w-full accent-emerald-700 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs leading-6 text-stone-600 dark:text-stone-400">
              <strong className="text-stone-900 dark:text-stone-200 block mb-1">
                نکته کلیدی نشر فنی:
              </strong>
              در <code dir="ltr" className="tech-term bg-stone-200 dark:bg-stone-800">async let</code>، کارها در همان خط تعریف شروع می‌شوند، نه در خطی که کلمه کلیدی <code dir="ltr" className="tech-term bg-stone-200 dark:bg-stone-800">await</code> نوشته شده است!
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-200/70 dark:bg-stone-800 rounded-md hover:bg-stone-300/70 dark:hover:bg-stone-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              بازنشانی مقادیر
            </button>
            <span dir="ltr" className="text-[11px] font-mono-tech text-stone-400">
              SE-0317 async let
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
