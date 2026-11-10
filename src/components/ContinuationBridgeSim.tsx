import React, { useState } from 'react';
import {
  simulateContinuationContract,
  ContinuationResumePolicy,
} from '../utils/concurrencyEngine';
import { RichText } from './RichText';
import { CheckCircle2, AlertTriangle, Skull, RotateCcw } from 'lucide-react';

export const ContinuationBridgeSim: React.FC = () => {
  const [policy, setPolicy] =
    useState<ContinuationResumePolicy>('resume-once-valid');

  const outcome = simulateContinuationContract(policy);

  const codeByPolicy: Record<ContinuationResumePolicy, string> = {
    'resume-once-valid': `// ✅ SAFE: Every execution path calls resume() EXACTLY ONCE
func fetchUserAvatar(url: URL) async throws -> UIImage {
    return try await withCheckedThrowingContinuation { continuation in
        LegacyImageDownloader.shared.download(url) { data, error in
            if let error = error {
                continuation.resume(throwing: error)
                return
            }
            guard let data = data, let image = UIImage(data: data) else {
                continuation.resume(throwing: ImageError.corruptedData)
                return
            }
            continuation.resume(returning: image)
        }
    }
}`,
    'resume-zero-leak': `// ⚠️ BUG (0x Resume): Early return forgets to call continuation.resume()
func fetchUserAvatar(url: URL) async throws -> UIImage {
    return try await withCheckedThrowingContinuation { continuation in
        LegacyImageDownloader.shared.download(url) { data, error in
            guard let data = data, let image = UIImage(data: data) else {
                // ❌ Forgot continuation.resume(throwing: ...) here!
                // Caller Task stays suspended on Heap forever!
                return
            }
            continuation.resume(returning: image)
        }
    }
}`,
    'resume-twice-crash': `// 💥 CRASH (2x Resume): Delegate or callback fires multiple times!
func requestCurrentLocation() async throws -> CLLocation {
    return try await withCheckedThrowingContinuation { continuation in
        // ❌ CLLocationManager calls didUpdateLocations repeatedly:
        self.onLocationUpdate = { location in
            // 1st update: resumes task OK
            // 2nd update: FATAL ERROR - tried to resume more than once!
            continuation.resume(returning: location)
        }
        locationManager.startUpdatingLocation()
    }
}`,
  };

  return (
    <div className="rounded-xl border border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-stone-100/80 dark:bg-stone-950/60 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2">
            <span>آزمایشگاه تعاملی ۰۵</span>
            <span aria-hidden="true">·</span>
            <span dir="ltr" className="font-mono-tech">
              SE-0300 CheckedContinuation Bridge Contract
            </span>
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mt-0.5">
            پل ارتباطی <span dir="ltr" className="font-mono-tech">withCheckedThrowingContinuation</span> و قانون طلایی <span dir="ltr" className="font-mono-tech">Resume-Exactly-Once</span>
          </h3>
        </div>

        <div
          role="group"
          aria-label="سناریوی فراخوانی ادامه اجرا (Continuation)"
          className="flex flex-wrap items-center gap-1 p-1 bg-stone-200/80 dark:bg-stone-800 rounded-lg"
        >
          <button
            type="button"
            onClick={() => setPolicy('resume-once-valid')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              policy === 'resume-once-valid'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            ۱. فراخوانی استاندارد (<span dir="ltr" className="font-mono-tech">1x Resume</span>)
          </button>
          <button
            type="button"
            onClick={() => setPolicy('resume-zero-leak')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              policy === 'resume-zero-leak'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            ۲. فراموشی در شاخه شرطی (<span dir="ltr" className="font-mono-tech">0x Leak</span>)
          </button>
          <button
            type="button"
            onClick={() => setPolicy('resume-twice-crash')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              policy === 'resume-twice-crash'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            ۳. فراخوانی تکراری (<span dir="ltr" className="font-mono-tech">2x Fatal Crash</span>)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-l border-stone-200 dark:border-stone-800 space-y-4">
          <div
            className={`p-4 rounded-lg border flex items-start gap-3 ${
              outcome.isHealthy
                ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80'
                : policy === 'resume-zero-leak'
                ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80'
                : 'bg-red-50/60 dark:bg-red-950/30 border-red-300 dark:border-red-800/80'
            }`}
          >
            {outcome.isHealthy ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : policy === 'resume-zero-leak' ? (
              <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <Skull className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs leading-6">
              <div className="flex flex-wrap items-center gap-2 font-bold text-stone-900 dark:text-stone-100 mb-1">
                <span>رفتار زمان اجرا (<span dir="ltr" className="font-mono-tech">Runtime Verdict</span>):</span>
                <span
                  dir="ltr"
                  className={`font-mono-tech ${
                    outcome.isHealthy
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : policy === 'resume-zero-leak'
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {outcome.isHealthy
                    ? `● ${outcome.runtimeStatusEn}`
                    : `▲ ${outcome.runtimeStatusEn}`}
                </span>
              </div>
              <p className="text-stone-700 dark:text-stone-300">
                <RichText text={outcome.diagnosticFa} />
              </p>
            </div>
          </div>

          <pre
            dir="ltr"
            className="p-4 rounded-lg bg-stone-950 text-stone-100 font-mono-tech text-xs leading-6 overflow-x-auto border border-stone-800"
          >
            {codeByPolicy[policy]}
          </pre>
        </div>

        <div className="lg:col-span-5 p-6 bg-stone-50/60 dark:bg-stone-950/30 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">
              ردیاب مراحل داخلی <span dir="ltr" className="font-mono-tech">CheckedContinuation</span> در Runtime
            </h4>
            <div className="space-y-2" dir="ltr">
              {outcome.swiftTraceEn.map((line, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 font-mono-tech text-[11px] text-stone-700 dark:text-stone-300"
                >
                  {line}
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs leading-6 text-stone-600 dark:text-stone-400">
              <strong className="text-stone-900 dark:text-stone-200 block mb-1">
                تفاوت <span dir="ltr" className="font-mono-tech">Checked</span> و <span dir="ltr" className="font-mono-tech">Unsafe</span>:
              </strong>
              در محیط توسعه و حتی پروداکشن، همیشه از <code dir="ltr" className="tech-term bg-stone-200 dark:bg-stone-800">withCheckedContinuation</code> استفاده کنید زیرا یک بایت وضعیت اتمیک برای تشخیص نشت یا فراخوانی مضاعف نگه می‌دارد. تنها در حلقه‌های فوق‌سریع گرافیکی/صوتی پس از اطمینان کامل، سراغ <code dir="ltr" className="tech-term bg-stone-200 dark:bg-stone-800">withUnsafeContinuation</code> بروید.
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={() => setPolicy('resume-once-valid')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-200/70 dark:bg-stone-800 rounded-md hover:bg-stone-300/70 dark:hover:bg-stone-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              بازنشانی به حالت ایمن
            </button>
            <span dir="ltr" className="text-[11px] font-mono-tech text-stone-400">
              SE-0300 Continuations
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
