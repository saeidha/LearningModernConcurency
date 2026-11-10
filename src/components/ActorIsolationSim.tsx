import React, { useState } from 'react';
import {
  simulateActorIsolation,
  ActorProtectionMode,
} from '../utils/concurrencyEngine';
import { RichText } from './RichText';
import { ShieldAlert, ShieldCheck, RotateCcw } from 'lucide-react';

export const ActorIsolationSim: React.FC = () => {
  const [mode, setMode] = useState<ActorProtectionMode>('isolated-actor');
  const [withdrawalA, setWithdrawalA] = useState<number>(80);
  const [withdrawalB, setWithdrawalB] = useState<number>(80);

  const sim = simulateActorIsolation(mode, 100, withdrawalA, withdrawalB);

  const handleReset = () => {
    setMode('isolated-actor');
    setWithdrawalA(80);
    setWithdrawalB(80);
  };

  const swiftSnippetByMode: Record<ActorProtectionMode, string> = {
    'unsafe-class': `// ❌ UNSAFE CLASS: Simultaneous Read/Write Data Race
final class BankAccount {
    var balance: Int = 100
    func withdraw(_ amount: Int) {
        guard balance >= amount else { return }
        balance -= amount // Crash or Corrupted State!
    }
}`,
    'isolated-actor': `// ✅ ISOLATED ACTOR: Serialized Mailbox Execution
actor BankAccount {
    private var balance: Int = 100
    func withdraw(_ amount: Int) -> Bool {
        guard balance >= amount else { return false }
        balance -= amount
        return true
    }
}`,
    'actor-reentrancy-bug': `// ⚠️ ACTOR REENTRANCY TRAP: Suspension before state update
actor BankAccount {
    private var balance: Int = 100
    func withdraw(_ amount: Int) async -> Bool {
        guard balance >= amount else { return false }
        await auditServer.authorize(amount) // <-- SUSPENDS HERE!
        // Another Task can enter actor while suspended!
        balance -= amount // Balance drops to -60!
        return true
    }
}`,
    'actor-reentrancy-fixed': `// ✅ REENTRANCY-SAFE ACTOR: Mutate state BEFORE await
actor BankAccount {
    private var balance: Int = 100
    func withdraw(_ amount: Int) async -> Bool {
        guard balance >= amount else { return false }
        balance -= amount // Deduct BEFORE suspension point
        await auditServer.logTransaction(amount)
        return true
    }
}`,
  };

  return (
    <div className="rounded-xl border border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-stone-100/80 dark:bg-stone-950/60 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2">
            <span>آزمایشگاه تعاملی ۰۴</span>
            <span aria-hidden="true">·</span>
            <span dir="ltr" className="font-mono-tech">
              Actor Isolation & Reentrancy Visualizer
            </span>
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mt-0.5">
            شبیه‌ساز <span dir="ltr" className="font-mono-tech">Data Race</span>، صف سریال <span dir="ltr" className="font-mono-tech">Actor</span> و معمای <span dir="ltr" className="font-mono-tech">Actor Reentrancy</span>
          </h3>
        </div>

        {/* 4-Mode Selector */}
        <div
          role="group"
          aria-label="حالت حفاظت حافظه در Actor"
          className="flex flex-wrap items-center gap-1 p-1 bg-stone-200/80 dark:bg-stone-800 rounded-lg"
        >
          <button
            type="button"
            onClick={() => setMode('unsafe-class')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'unsafe-class'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            ۱. <span dir="ltr" className="font-mono-tech">class</span> غیرایمن (<span dir="ltr" className="font-mono-tech">Data Race</span>)
          </button>
          <button
            type="button"
            onClick={() => setMode('isolated-actor')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'isolated-actor'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            ۲. <span dir="ltr" className="font-mono-tech">actor</span> استاندارد
          </button>
          <button
            type="button"
            onClick={() => setMode('actor-reentrancy-bug')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'actor-reentrancy-bug'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            ۳. دام <span dir="ltr" className="font-mono-tech">Reentrancy</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('actor-reentrancy-fixed')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'actor-reentrancy-fixed'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            ۴. الگوی ایمن <span dir="ltr" className="font-mono-tech">Reentrancy</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left/Top Stage (8 cols): Execution Trace & Verdict */}
        <div className="lg:col-span-8 p-6 border-b lg:border-b-0 lg:border-l border-stone-200 dark:border-stone-800 space-y-5">
          {/* Verdict Banner */}
          <div
            className={`p-4 rounded-lg border flex items-start gap-3 ${
              sim.hasDataRaceOrLogicBug
                ? 'bg-red-50/60 dark:bg-red-950/30 border-red-300 dark:border-red-800/80'
                : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80'
            }`}
          >
            {sim.hasDataRaceOrLogicBug ? (
              <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs leading-6">
              <div className="flex flex-wrap items-center gap-2 font-bold text-stone-900 dark:text-stone-100 mb-0.5">
                <span>نتیجه تراکنش هم‌زمان (موجودی اولیه: ۱۰۰ واحد):</span>
                <span
                  dir="ltr"
                  className={`font-mono-tech ${
                    sim.hasDataRaceOrLogicBug
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {sim.hasDataRaceOrLogicBug
                    ? `▲ INVARIANT VIOLATION (Final Balance: ${sim.finalBalance})`
                    : `● MEMORY & LOGIC SAFE (Final Balance: ${sim.finalBalance})`}
                </span>
              </div>
              <p className="text-stone-700 dark:text-stone-300">
                <RichText text={sim.verdictFa} />
              </p>
            </div>
          </div>

          {/* Step-by-step Interleaving Table */}
          <div className="space-y-2.5">
            {sim.steps.map((st) => (
              <div
                key={st.stepIndex}
                className={`p-3.5 rounded-lg border text-xs ${
                  st.isAnomaly
                    ? 'border-red-300 dark:border-red-800/70 bg-red-50/30 dark:bg-red-950/20'
                    : 'border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/50'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <span dir="ltr" className="font-mono-tech font-semibold text-stone-800 dark:text-stone-200">
                    Step 0{st.stepIndex} · {st.actorOrThread}
                  </span>
                  <span dir="ltr" className="tabular-nums-ltr font-mono-tech font-bold text-amber-800 dark:text-amber-400">
                    balance == {st.balanceSnapshot}
                  </span>
                </div>
                <div
                  dir="ltr"
                  className="font-mono-tech text-[11px] text-stone-600 dark:text-stone-400 mb-1.5 bg-stone-200/50 dark:bg-stone-900 px-2 py-1 rounded"
                >
                  {st.operationEn}
                </div>
                <p className="text-stone-700 dark:text-stone-300 leading-5">
                  <RichText text={st.explanationFa} />
                </p>
              </div>
            ))}
          </div>

          {/* Code comparison block */}
          <pre
            dir="ltr"
            className="p-4 rounded-lg bg-stone-950 text-stone-100 font-mono-tech text-xs leading-5 overflow-x-auto border border-stone-800"
          >
            {swiftSnippetByMode[mode]}
          </pre>
        </div>

        {/* Right Controls (4 cols) */}
        <div className="lg:col-span-4 p-6 bg-stone-50/60 dark:bg-stone-950/30 flex flex-col justify-between gap-6">
          <div className="space-y-5">
            <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">
              تنظیم مبالغ برداشت هم‌زمان از حساب (موجودی پایه: <span dir="ltr" className="font-mono-tech">100</span>)
            </h4>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label htmlFor="withdraw-a-slider" className="text-stone-700 dark:text-stone-300">
                  درخواست برداشت اول (<span dir="ltr" className="font-mono-tech">Task A</span>):
                </label>
                <span dir="ltr" className="tabular-nums-ltr font-bold text-amber-800 dark:text-amber-400">
                  {withdrawalA} Units
                </span>
              </div>
              <input
                id="withdraw-a-slider"
                type="range"
                min={30}
                max={90}
                step={10}
                value={withdrawalA}
                onChange={(e) => setWithdrawalA(Number(e.target.value))}
                className="w-full accent-amber-700 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label htmlFor="withdraw-b-slider" className="text-stone-700 dark:text-stone-300">
                  درخواست برداشت دوم (<span dir="ltr" className="font-mono-tech">Task B</span>):
                </label>
                <span dir="ltr" className="tabular-nums-ltr font-bold text-sky-800 dark:text-sky-400">
                  {withdrawalB} Units
                </span>
              </div>
              <input
                id="withdraw-b-slider"
                type="range"
                min={30}
                max={90}
                step={10}
                value={withdrawalB}
                onChange={(e) => setWithdrawalB(Number(e.target.value))}
                className="w-full accent-sky-700 cursor-pointer"
              />
            </div>

            <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-600 dark:text-stone-400">مجموع مبلغ برداشت‌شده:</span>
                <span dir="ltr" className="tabular-nums-ltr font-bold text-stone-900 dark:text-stone-100">
                  {sim.totalWithdrawn} Units
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600 dark:text-stone-400">موجودی نهایی حساب:</span>
                <span
                  dir="ltr"
                  className={`tabular-nums-ltr font-bold ${
                    sim.finalBalance < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {sim.finalBalance} Units
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
              بازنشانی شبیه‌ساز
            </button>
            <span dir="ltr" className="text-[11px] font-mono-tech text-stone-400">
              SE-0306 Actors
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
