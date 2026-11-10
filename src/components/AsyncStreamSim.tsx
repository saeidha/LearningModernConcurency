import React, { useState } from 'react';
import {
  simulateAsyncStreamBuffering,
  StreamBufferingStrategy,
} from '../utils/concurrencyEngine';
import { RichText } from './RichText';
import { Activity, RotateCcw } from 'lucide-react';

export const AsyncStreamSim: React.FC = () => {
  const [strategy, setStrategy] =
    useState<StreamBufferingStrategy>('bufferingNewest');
  const [bufferLimit, setBufferLimit] = useState<number>(3);
  const [producedCount, setProducedCount] = useState<number>(9);
  const [consumedCount, setConsumedCount] = useState<number>(2);

  const sim = simulateAsyncStreamBuffering(
    strategy,
    bufferLimit,
    producedCount,
    consumedCount
  );

  const handleReset = () => {
    setStrategy('bufferingNewest');
    setBufferLimit(3);
    setProducedCount(9);
    setConsumedCount(2);
  };

  return (
    <div className="rounded-xl border border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-stone-100/80 dark:bg-stone-950/60 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2">
            <span>آزمایشگاه تعاملی ۰۶</span>
            <span aria-hidden="true">·</span>
            <span dir="ltr" className="font-mono-tech">
              SE-0314 AsyncStream & Backpressure BufferingPolicy
            </span>
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mt-0.5">
            شبیه‌ساز جریان‌های رویداد (<span dir="ltr" className="font-mono-tech">AsyncStream</span>) و سیاست‌های مدیریت فشار (<span dir="ltr" className="font-mono-tech">BufferingPolicy</span>)
          </h3>
        </div>

        <div
          role="group"
          aria-label="سیاست بافرینگ AsyncStream"
          className="flex flex-wrap items-center gap-1 p-1 bg-stone-200/80 dark:bg-stone-800 rounded-lg"
        >
          <button
            type="button"
            onClick={() => setStrategy('bufferingNewest')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              strategy === 'bufferingNewest'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <span dir="ltr" className="font-mono-tech">.bufferingNewest({bufferLimit})</span>
          </button>
          <button
            type="button"
            onClick={() => setStrategy('bufferingOldest')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              strategy === 'bufferingOldest'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <span dir="ltr" className="font-mono-tech">.bufferingOldest({bufferLimit})</span>
          </button>
          <button
            type="button"
            onClick={() => setStrategy('unbounded')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              strategy === 'unbounded'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <span dir="ltr" className="font-mono-tech">.unbounded</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-8 p-6 border-b lg:border-b-0 lg:border-l border-stone-200 dark:border-stone-800 space-y-5">
          <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 text-xs leading-6">
            <Activity className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-1" />
            <p className="text-stone-700 dark:text-stone-300">
              <RichText text={sim.explanationFa} />
            </p>
          </div>

          {/* Visual Packet Stream Grid */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600 dark:text-stone-400 mb-3">
              <span className="font-semibold text-stone-800 dark:text-stone-200">
                وضعیت بسته‌های ارسال‌شده توسط <code dir="ltr" className="font-mono-tech">continuation.yield(event)</code>:
              </span>
              <div className="flex items-center gap-4 text-[11px]" dir="ltr">
                <span className="text-emerald-700 dark:text-emerald-400 font-mono-tech">
                  ● Consumed ({sim.consumedCount})
                </span>
                <span className="text-sky-700 dark:text-sky-400 font-mono-tech">
                  ■ In Ring Buffer ({sim.bufferedPackets.length})
                </span>
                <span className="text-red-600 dark:text-red-400 font-mono-tech">
                  ✕ Dropped ({sim.droppedPackets.length})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5" dir="ltr">
              {sim.events.map((ev) => {
                const isConsumed = ev.status === 'consumed';
                const isBuffered = ev.status === 'buffered';
                return (
                  <div
                    key={ev.seq}
                    className={`p-3 rounded-lg border text-center font-mono-tech transition-colors ${
                      isConsumed
                        ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                        : isBuffered
                        ? 'border-sky-300 dark:border-sky-800/80 bg-sky-50/50 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200'
                        : 'border-red-300/80 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/20 text-red-700 dark:text-red-400 opacity-75'
                    }`}
                  >
                    <div className="text-xs font-bold">Event #{ev.seq}</div>
                    <div className="text-[10px] mt-1 font-semibold">
                      {isConsumed
                        ? '● CONSUMED'
                        : isBuffered
                        ? '■ BUFFERED'
                        : '✕ DROPPED'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <pre
            dir="ltr"
            className="p-4 rounded-lg bg-stone-950 text-stone-100 font-mono-tech text-xs leading-5 overflow-x-auto border border-stone-800"
          >
{`let priceStream = AsyncStream(
    Double.self,
    bufferingPolicy: ${
      strategy === 'unbounded'
        ? '.unbounded'
        : `.${strategy}(${bufferLimit})`
    }
) { continuation in
    let listener = WebSocketTicker.subscribe { price in
        continuation.yield(price)
    }
    continuation.onTermination = { @Sendable _ in
        listener.disconnect() // Guaranteed cleanup on task cancel!
    }
}`}
          </pre>
        </div>

        <div className="lg:col-span-4 p-6 bg-stone-50/60 dark:bg-stone-950/30 flex flex-col justify-between gap-6">
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label htmlFor="stream-produced-slider" className="font-semibold text-stone-700 dark:text-stone-300">
                  تعداد کل رویدادهای تولیدشده (<span dir="ltr" className="font-mono-tech">yield</span>):
                </label>
                <span dir="ltr" className="tabular-nums-ltr font-bold text-amber-800 dark:text-amber-400">
                  {producedCount} Events
                </span>
              </div>
              <input
                id="stream-produced-slider"
                type="range"
                min={4}
                max={15}
                step={1}
                value={producedCount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setProducedCount(val);
                  if (consumedCount > val) setConsumedCount(val);
                }}
                className="w-full accent-amber-700 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label htmlFor="stream-consumed-slider" className="font-semibold text-stone-700 dark:text-stone-300">
                  مصرف‌شده توسط حلقه <code dir="ltr" className="font-mono-tech">for await</code>:
                </label>
                <span dir="ltr" className="tabular-nums-ltr font-bold text-emerald-700 dark:text-emerald-400">
                  {consumedCount} Events
                </span>
              </div>
              <input
                id="stream-consumed-slider"
                type="range"
                min={0}
                max={producedCount}
                step={1}
                value={consumedCount}
                onChange={(e) => setConsumedCount(Number(e.target.value))}
                className="w-full accent-emerald-700 cursor-pointer"
              />
            </div>

            {strategy !== 'unbounded' && (
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <label htmlFor="stream-limit-slider" className="font-semibold text-stone-700 dark:text-stone-300">
                    ظرفیت بافر (<span dir="ltr" className="font-mono-tech">Buffer Capacity</span>):
                  </label>
                  <span dir="ltr" className="tabular-nums-ltr font-bold text-sky-700 dark:text-sky-400">
                    {bufferLimit} Slots
                  </span>
                </div>
                <input
                  id="stream-limit-slider"
                  type="range"
                  min={1}
                  max={6}
                  step={1}
                  value={bufferLimit}
                  onChange={(e) => setBufferLimit(Number(e.target.value))}
                  className="w-full accent-sky-700 cursor-pointer"
                />
              </div>
            )}
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
              SE-0314 AsyncStream
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
