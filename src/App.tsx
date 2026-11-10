import React, { useState, useEffect } from 'react';
import { RichText, EditorialMarginNote } from './components/RichText';
import { ThreadPoolSim } from './components/ThreadPoolSim';
import { TimelineComparisonSim } from './components/TimelineComparisonSim';
import { TaskGroupTreeSim } from './components/TaskGroupTreeSim';
import { ActorIsolationSim } from './components/ActorIsolationSim';
import { ContinuationBridgeSim } from './components/ContinuationBridgeSim';
import { AsyncStreamSim } from './components/AsyncStreamSim';
import { PracticalRecipeGallery } from './components/PracticalRecipeGallery';
import {
  StrictConcurrencyChecker,
  GitHubDeployGuideSection,
} from './components/StrictConcurrencyChecker';
import {
  CHAPTER_1_RECIPES,
  CHAPTER_2_RECIPES,
  CHAPTER_3_RECIPES,
  CHAPTER_4_RECIPES,
  CHAPTER_5_RECIPES,
  CHAPTER_6_RECIPES,
  CHAPTER_8_RECIPES,
} from './data/chapterRecipes';
import {
  BookOpen,
  Sun,
  Moon,
  Search,
  ChevronLeft,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface GlossaryItem {
  termEn: string;
  persianEquivalent: string;
  proposalId: string;
  definitionFa: string;
}

const GLOSSARY_ITEMS: GlossaryItem[] = [
  {
    termEn: 'Suspension Point (await)',
    persianEquivalent: 'نقطه تعلیق غیرانسدادی',
    proposalId: 'SE-0296',
    definitionFa:
      'محلی در تابع `async` که با کلمه کلیدی `await` مشخص می‌شود. در این نقطه، رشته پردازنده (`Thread`) مسدود نمی‌شود؛ بلکه وضعیت فعلی تابع در `Heap` ذخیره شده و `Thread` برای اجرای سایر تسک‌ها آزاد می‌گردد.',
  },
  {
    termEn: 'Cooperative Thread Pool',
    persianEquivalent: 'استخر رشته‌های مشارکتی',
    proposalId: 'Runtime',
    definitionFa:
      'موتور زمان‌بند مدرن سوئیفت که تعداد رشته‌های کرنل را دقیقاً به تعداد هسته‌های فیزیکی `CPU` محدود می‌کند تا از پدیده `Thread Explosion` و سربار `Context Switch` جلوگیری شود.',
  },
  {
    termEn: 'CheckedContinuation',
    persianEquivalent: 'پل ارتباطی بررسی‌شونده به کدهای قدیمی',
    proposalId: 'SE-0300',
    definitionFa:
      'رابط ایمن برای تبدیل کدهای مبتنی بر `Completion Handler` یا `Delegate` به توابع `async` که در زمان اجرا تضمین می‌کند متد `resume()` دقیقاً یک بار فراخوانی شود.',
  },
  {
    termEn: 'Structured Concurrency',
    persianEquivalent: 'هم‌زمانی ساختاریافته',
    proposalId: 'SE-0304',
    definitionFa:
      'الگویی که در آن طول عمر هر `Child Task` اکیداً محدود به اسکوپ لغوی (`Lexical Scope`) تسک والد است؛ هیچ تسک فرزندی نمی‌تواند پس از خروج والد به حیات پنهان ادامه دهد.',
  },
  {
    termEn: 'async let Binding',
    persianEquivalent: 'تخصیص موازی ساختاریافته',
    proposalId: 'SE-0317',
    definitionFa:
      'ساده‌ترین روش تعریف یک `Child Task` موازی برای تعداد ثابتی از درخواست‌ها؛ اجرای عملیات در لحظه تعریف شروع شده و در لحظه خوانده شدن با `await` همگام‌سازی می‌شود.',
  },
  {
    termEn: 'AsyncSequence & AsyncStream',
    persianEquivalent: 'دنباله و جریان رویداد غیرهم‌زمان',
    proposalId: 'SE-0298 / SE-0314',
    definitionFa:
      'معادل غیرهم‌زمان `Sequence` برای دریافت تدریجی مقادیر در طول زمان با حلقه `for await` و مدیریت فشار (`Backpressure`) از طریق سیاست‌های `BufferingPolicy`.',
  },
  {
    termEn: 'Actor Isolation & Reentrancy',
    persianEquivalent: 'ایزولاسیون و بازورودی اکتور',
    proposalId: 'SE-0306',
    definitionFa:
      'محافظت از وضعیت تغییرپذیر با صف پیام سریالی (`Mailbox`). در نقاط `await`، اکتور می‌تواند پیام‌های جدید را بپذیرد (`Reentrancy`) تا دچار بن‌بست (`Deadlock`) نشود.',
  },
  {
    termEn: 'Sendable & Region Isolation (sending)',
    persianEquivalent: 'ایمنی انتقال داده در مرز هم‌زمانی',
    proposalId: 'SE-0302 / SE-0414',
    definitionFa:
      'قرارداد کامپایلر در `Swift 6` برای اثبات اینکه ارسال یک مقدار یا ارجاع بین دو حوزه ایزوله (`Isolation Domains`) هیچ‌گونه ریسک `Data Race` ایجاد نمی‌کند.',
  },
  {
    termEn: '@TaskLocal Storage',
    persianEquivalent: 'حافظه زمینه‌ای درخت وظایف',
    proposalId: 'SE-0311',
    definitionFa:
      'ساختاری برای انتقال ضمنی متادیتا (مانند `TraceID` یا توکن تراکنش) در تمام زیرشاخه‌های یک درخت `Structured Concurrency` بدون تغییر امضای توابع.',
  },
  {
    termEn: 'Clock, Instant & Duration',
    persianEquivalent: 'انتزاع زمان و ساعت قابل تزریق',
    proposalId: 'SE-0329',
    definitionFa:
      'سیستم تایپ‌شده سنجش زمان و تعلیق (`ContinuousClock` و `SuspendingClock`) که امکان تست واحد فوری و قطعی کدهای زمان‌دار را فراهم می‌سازد.',
  },
];

interface QuizQuestion {
  id: string;
  questionFa: string;
  options: { id: string; textFa: string; isCorrect: boolean }[];
  explanationFa: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    questionFa:
      'هنگامی که اجرای یک تابع `async` به عبارت `await` می‌رسد، در سطح سیستم‌عامل چه اتفاقی برای `Thread` فعلی می‌افتد؟',
    options: [
      {
        id: 'a',
        textFa: 'رشته (`Thread`) تا زمان دریافت پاسخ شبکه در حالت `Blocked` متوقف می‌ماند.',
        isCorrect: false,
      },
      {
        id: 'b',
        textFa:
          'وضعیت تابع در یک `Continuation` روی `Heap` ذخیره شده و همان `Thread` بلافاصله به سراغ اجرای سایر `Task`های آماده می‌رود.',
        isCorrect: true,
      },
      {
        id: 'c',
        textFa: 'سیستم‌عامل یک `Kernel Thread` جدید با پشته `512KB` برای ادامه کار می‌سازد.',
        isCorrect: false,
      },
    ],
    explanationFa:
      'در مدل `Swift Concurrency`، تعلیق در نقطه `await` کاملاً غیرانسدادی (`Non-blocking`) است؛ رشته پردازنده آزاد شده و برای کارهای دیگر در `Cooperative Thread Pool` استفاده می‌شود.',
  },
  {
    id: 'q2',
    questionFa:
      'چرا در یک `actor` باید تغییرات وضعیت حساس (`State Mutation`) را پیش از فراخوانی `await` انجام دهیم؟',
    options: [
      {
        id: 'a',
        textFa:
          'به دلیل ویژگی `Actor Reentrancy`؛ زیرا در زمان تعلیق در نقطه `await`، سایر تسک‌ها می‌توانند وارد `actor` شوند و وضعیت نیمه‌کاره را ببینند.',
        isCorrect: true,
      },
      {
        id: 'b',
        textFa: 'چون کامپایلر سوئیفت اجازه نوشتن کد پس از کلمه کلیدی `await` را نمی‌دهد.',
        isCorrect: false,
      },
      {
        id: 'c',
        textFa: 'زیرا `actor` در زمان `await` به یک `struct` تبدیل می‌شود.',
        isCorrect: false,
      },
    ],
    explanationFa:
      'برای جلوگیری از `Deadlock`، اکتورهای سوئیفت `Reentrant` هستند؛ یعنی حین تعلیق یک متد در نقطه `await`، متدهای دیگر روی همان `actor` قابل اجرا هستند.',
  },
  {
    id: 'q3',
    questionFa:
      'در `withCheckedContinuation` اگر به دلیل یک دستور `guard ... else { return }` فراموش کنیم متد `continuation.resume(...)` را صدا بزنیم، چه رخ می‌دهد؟',
    options: [
      {
        id: 'a',
        textFa: 'کامپایلر به‌طور خودکار مقدار `nil` برمی‌گرداند.',
        isCorrect: false,
      },
      {
        id: 'b',
        textFa:
          'تسک فراخوانی‌کننده برای همیشه روی `Heap` معلق (`Leaked Task`) می‌ماند و زمان اجرا هشدار `CONTINUATION MISUSE` چاپ می‌کند.',
        isCorrect: true,
      },
      {
        id: 'c',
        textFa: 'اپلیکیشن بلافاصله کرش می‌کند (`Fatal Error`).',
        isCorrect: false,
      },
    ],
    explanationFa:
      'فراخوانی نکردن `resume` (۰ بار) باعث نشت تسک و توقف ابدی فراخوانی‌کننده می‌شود، در حالی که فراخوانی بیش از ۱ بار (`>= 2x`) باعث کرش فوری (`Fatal Trap`) می‌گردد.',
  },
  {
    id: 'q4',
    questionFa:
      'برای دریافت قیمت لحظه‌ای سهام یا داده‌های سنسور که فقط آخرین مقدار آن اهمیت دارد و مصرف‌کننده کندتر از تولیدکننده است، کدام سیاست بافرینگ `AsyncStream` مناسب‌ترین است؟',
    options: [
      {
        id: 'a',
        textFa: 'سیاست پیش‌فرض `.unbounded` تا هیچ داده‌ای حذف نشود.',
        isCorrect: false,
      },
      {
        id: 'b',
        textFa: 'سیاست `.bufferingOldest(1)` تا اولین قیمت ثبت‌شده حفظ شود.',
        isCorrect: false,
      },
      {
        id: 'c',
        textFa:
          'سیاست `.bufferingNewest(1)` تا همیشه جدیدترین مقدار جایگزین داده قدیمیِ مصرف‌نشده در بافر شود.',
        isCorrect: true,
      },
    ],
    explanationFa:
      'با `.bufferingNewest(1)`، نه حافظه دچار رشد بی‌رویه می‌شود و نه مصرف‌کننده وقت خود را صرف پردازش فریم‌های منقضی‌شده قدیمی می‌کند.',
  },
];

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [glossaryQuery, setGlossaryQuery] = useState<string>('');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  const filteredGlossary = GLOSSARY_ITEMS.filter(
    (item) =>
      item.termEn.toLowerCase().includes(glossaryQuery.toLowerCase()) ||
      item.persianEquivalent.includes(glossaryQuery) ||
      item.definitionFa.includes(glossaryQuery)
  );

  return (
    <div className="min-h-screen bg-[#FBF9F5] dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 lg:px-12 py-4 bg-[#FBF9F5]/95 dark:bg-stone-950/95 backdrop-blur-xs border-b border-stone-200 dark:border-stone-800">
        {/* Zone 1: Single text element Brand wordmark */}
        <a
          href="#top"
          className="text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100 whitespace-nowrap shrink-0"
        >
          نشر رشته‌ها · Swift Concurrency
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav
          aria-label="فصل‌های کتاب تعاملی"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600 dark:text-stone-400"
        >
          <a
            href="#chapter-1"
            className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors whitespace-nowrap shrink-0"
          >
            مبانی و موازی‌سازی
          </a>
          <a
            href="#chapter-3"
            className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors whitespace-nowrap shrink-0"
          >
            TaskGroup و Actors
          </a>
          <a
            href="#chapter-5"
            className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors whitespace-nowrap shrink-0"
          >
            Continuation و Stream
          </a>
          <a
            href="#chapter-7"
            className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors whitespace-nowrap shrink-0"
          >
            سوئیفت ۶ و Sendable
          </a>
          <a
            href="#chapter-8"
            className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors whitespace-nowrap shrink-0"
          >
            معماری پروداکشن
          </a>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#deploy-guide"
            className="px-4 py-2 text-xs font-medium text-white bg-amber-800 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            راهنمای دیپلوی GitHub
          </a>
        </div>
      </header>

      <main id="top" className="max-w-[1240px] mx-auto px-6 lg:px-10 py-10 lg:py-16 space-y-24">
        {/* Editorial Hero Section */}
        <section className="pb-12 border-b border-stone-300/80 dark:border-stone-800">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-stone-500 dark:text-stone-400 mb-6">
            <div className="flex items-center gap-2">
              <span>دانشنامه و کتاب‌تعاملی مهندسی نرم‌افزار</span>
              <span aria-hidden="true">·</span>
              <span dir="ltr" className="font-mono-tech">
                8 Comprehensive Chapters · 7 Simulators · 20+ Production Examples
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              aria-label={isDark ? 'تغییر به حالت کاغذ روشن' : 'تغییر به حالت مطالعه تیره'}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  حالت کاغذ روشن (Archival Paper)
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-stone-700" />
                  حالت مطالعه تیره (Dark Ink)
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-7 space-y-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 leading-[1.3]">
                مرجع جامع و تعاملی{' '}
                <span dir="ltr" className="font-editorial italic font-semibold text-amber-800 dark:text-amber-400">
                  Swift Concurrency
                </span>{' '}
                و معماری{' '}
                <span dir="ltr" className="font-mono-tech text-3xl sm:text-4xl">
                  async/await
                </span>
              </h1>

              <p className="text-base sm:text-lg leading-9 text-stone-700 dark:text-stone-300 max-w-2xl">
                <RichText text="هم‌زمانی مدرن در سوئیفت صرفاً یک جایگزین ظاهری (`Syntactic Sugar`) برای `Completion Handler`ها نیست؛ بلکه بازطراحی کامل مدل زمان اجرا (`Runtime Execution Model`) در ۸ فصل عمیق است: از استخر رشته‌های `Cooperative Thread Pool` و درخت وظایف `Structured Concurrency` تا پل‌های `CheckedContinuation`، جریان‌های `AsyncStream`، ایزولاسیون `Actors` و قوانین سخت‌گیرانه `Swift 6 Sendable`." />
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#chapter-1"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-semibold hover:bg-stone-800 dark:hover:bg-white transition-colors whitespace-nowrap shrink-0"
                >
                  <BookOpen className="w-4 h-4" />
                  شروع مطالعه از فصل اول
                  <ChevronLeft className="w-4 h-4" />
                </a>
                <a
                  href="#chapter-7"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-sm font-medium hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0"
                >
                  ممیز ۶ سناریوی Swift 6
                </a>
              </div>
            </div>

            {/* Curatorial 8-Chapter Table of Contents Card */}
            <div className="lg:col-span-5 p-6 rounded-xl bg-stone-100/90 dark:bg-stone-900/90 border border-stone-200 dark:border-stone-800 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                  سرفصل کامل کتاب (۸ فصل + ۷ آزمایشگاه + ۲۰+ الگوی کد)
                </span>
                <span dir="ltr" className="text-[11px] font-mono-tech text-amber-800 dark:text-amber-400 font-semibold">
                  Complete Edition
                </span>
              </div>
              <ol className="space-y-2.5 text-xs">
                <li className="flex items-baseline justify-between gap-2">
                  <a href="#chapter-1" className="font-semibold text-stone-800 dark:text-stone-200 hover:text-amber-800 dark:hover:text-amber-400">
                    ۰۱. مدل اجرا: از انسداد Thread تا تعلیق Continuation
                  </a>
                  <span dir="ltr" className="font-mono-tech text-[11px] text-stone-500 shrink-0">
                    SE-0296
                  </span>
                </li>
                <li className="flex items-baseline justify-between gap-2">
                  <a href="#chapter-2" className="font-semibold text-stone-800 dark:text-stone-200 hover:text-amber-800 dark:hover:text-amber-400">
                    ۰۲. اجرای ترتیبی await در برابر موازی‌سازی با async let
                  </a>
                  <span dir="ltr" className="font-mono-tech text-[11px] text-stone-500 shrink-0">
                    SE-0317
                  </span>
                </li>
                <li className="flex items-baseline justify-between gap-2">
                  <a href="#chapter-3" className="font-semibold text-stone-800 dark:text-stone-200 hover:text-amber-800 dark:hover:text-amber-400">
                    ۰۳. هم‌زمانی ساختاریافته، TaskGroup و Sliding Window
                  </a>
                  <span dir="ltr" className="font-mono-tech text-[11px] text-stone-500 shrink-0">
                    SE-0304
                  </span>
                </li>
                <li className="flex items-baseline justify-between gap-2">
                  <a href="#chapter-4" className="font-semibold text-stone-800 dark:text-stone-200 hover:text-amber-800 dark:hover:text-amber-400">
                    ۰۴. ایزولاسیون Actor، دام Reentrancy و کش In-Flight
                  </a>
                  <span dir="ltr" className="font-mono-tech text-[11px] text-stone-500 shrink-0">
                    SE-0306
                  </span>
                </li>
                <li className="flex items-baseline justify-between gap-2">
                  <a href="#chapter-5" className="font-semibold text-stone-800 dark:text-stone-200 hover:text-amber-800 dark:hover:text-amber-400">
                    ۰۵. پل زدن به کدهای قدیمی با CheckedContinuation
                  </a>
                  <span dir="ltr" className="font-mono-tech text-[11px] text-stone-500 shrink-0">
                    SE-0300
                  </span>
                </li>
                <li className="flex items-baseline justify-between gap-2">
                  <a href="#chapter-6" className="font-semibold text-stone-800 dark:text-stone-200 hover:text-amber-800 dark:hover:text-amber-400">
                    ۰۶. جریان‌های داده: AsyncSequence، AsyncStream و Backpressure
                  </a>
                  <span dir="ltr" className="font-mono-tech text-[11px] text-stone-500 shrink-0">
                    SE-0314
                  </span>
                </li>
                <li className="flex items-baseline justify-between gap-2">
                  <a href="#chapter-7" className="font-semibold text-stone-800 dark:text-stone-200 hover:text-amber-800 dark:hover:text-amber-400">
                    ۰۷. قوانین سخت‌گیرانه Swift 6، Sendable، sending و Mutex
                  </a>
                  <span dir="ltr" className="font-mono-tech text-[11px] text-stone-500 shrink-0">
                    SE-0414
                  </span>
                </li>
                <li className="flex items-baseline justify-between gap-2">
                  <a href="#chapter-8" className="font-semibold text-stone-800 dark:text-stone-200 hover:text-amber-800 dark:hover:text-amber-400">
                    ۰۸. الگوهای معماری: SwiftUI .task(id:)، @TaskLocal و Clock
                  </a>
                  <span dir="ltr" className="font-mono-tech text-[11px] text-stone-500 shrink-0">
                    SE-0329
                  </span>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* CHAPTER 1: Suspension Points & Cooperative Thread Pool */}
        <section id="chapter-1" className="space-y-8 scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              <div className="text-xs text-amber-800 dark:text-amber-400 font-semibold flex items-center gap-2">
                <span>فصل اول</span>
                <span aria-hidden="true">·</span>
                <span dir="ltr" className="font-mono-tech">
                  Chapter 01 · Suspension Points & Cooperative Pool
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                چرا <span dir="ltr" className="font-mono-tech">async/await</span> رشته‌های پردازنده را مسدود (<span dir="ltr" className="font-mono-tech">Block</span>) نمی‌کند؟
              </h2>
              <p className="text-sm sm:text-base leading-8 text-stone-700 dark:text-stone-300 max-w-prose">
                <RichText text="در معماری سنتی `Grand Central Dispatch (GCD)`، هرگاه یک صف هم‌زمان (`Concurrent DispatchQueue`) با عملیاتی روبه‌رو می‌شد که منتظر ورودی/خروجی شبکه یا دیسک می‌ماند، آن `Kernel Thread` مسدود می‌شد. برای حفظ جریان کار، کرنل مجبور بود رشته‌های جدیدی بسازد که به آن `Thread Explosion` می‌گویند. هر رشته کرنل حدود `512KB` حافظه پشته (`Stack Memory`) اشغال می‌کند و تعویض زمینه (`Context Switch`) بین ده‌ها رشته، کش پردازنده را تخلیه می‌کند." />
              </p>
              <p className="text-sm sm:text-base leading-8 text-stone-700 dark:text-stone-300 max-w-prose">
                <RichText text="در مقابل، `Swift Concurrency` تنها به تعداد هسته‌های فیزیکی پردازنده (`CPU Cores`) رشته ایجاد می‌کند. زمانی که اجرای تابع به کلمه کلیدی `await` (یعنی یک `Suspension Point`) می‌رسد، به جای مسدود کردن `Thread`، فریم متغیرهای محلی تابع در یک ساختار سبک به نام `AsyncFrame` بر روی `Heap` ذخیره شده و یک `Continuation` ثبت می‌شود. همان `Thread` بلافاصله آزاد شده و به سراغ اجرای تسک بعدی می‌رود." />
              </p>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <EditorialMarginNote
                indexLabel="حاشیه ۱.۱"
                titleFa="تفاوت فراخوانی سنکرون و آسنکرون در سطح حافظه"
                termEn="Stack Frame vs AsyncFrame"
                bodyFa="توابع معمولی (`Synchronous`) از پشته پیوسته `Thread Stack` استفاده می‌کنند، اما توابع `async` متغیرهای خود را که باید پیش و پس از نقطه `await` زنده بمانند، در قالب `AsyncFrame` در حافظه `Heap` نگهداری می‌کنند تا مستقل از هر `Thread` خاصی بتوانند روی رشته‌ای دیگر بیدار (`Resume`) شوند."
              />
            </div>
          </div>

          <ThreadPoolSim />
          <PracticalRecipeGallery
            chapterBadgeFa="فصل اول — مدیریت استخر مشارکتی"
            recipes={CHAPTER_1_RECIPES}
          />
        </section>

        {/* CHAPTER 2: Sequential await vs Parallel async let */}
        <section id="chapter-2" className="space-y-8 pt-12 border-t border-stone-200 dark:border-stone-800 scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              <div className="text-xs text-amber-800 dark:text-amber-400 font-semibold flex items-center gap-2">
                <span>فصل دوم</span>
                <span aria-hidden="true">·</span>
                <span dir="ltr" className="font-mono-tech">
                  Chapter 02 · Sequential await vs Parallel async let
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                دام اجرای ترتیبی ناخواسته و قدرت <span dir="ltr" className="font-mono-tech">async let</span>
              </h2>
              <p className="text-sm sm:text-base leading-8 text-stone-700 dark:text-stone-300 max-w-prose">
                <RichText text="یکی از رایج‌ترین اشتباهات هنگام مهاجرت به `async/await`، نوشتن چند عبارت `try await` پشت سر هم برای درخواست‌های مستقلی است که به یکدیگر وابستگی ندارند. وقتی می‌نویسید `let a = await fetchA()` و در خط بعد `let b = await fetchB()`، درخواست دوم تا زمان اتمام کامل درخواست اول حتی آغاز هم نمی‌شود!" />
              </p>
              <p className="text-sm sm:text-base leading-8 text-stone-700 dark:text-stone-300 max-w-prose">
                <RichText text="با استفاده از ساختار `async let`، کامپایلر سوئیفت در همان لحظه تعریف متغیر، یک `Child Task` موازی منشعب می‌کند. درخواست‌ها هم‌زمان در پس‌زمینه اجرا می‌شوند و تابع شما تنها در خطی که به مقدار آن‌ها نیاز دارد با یک `await` منتظر آماده شدن همگی می‌ماند." />
              </p>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <EditorialMarginNote
                indexLabel="حاشیه ۲.۱"
                titleFa="لغو ضمنی در async let"
                termEn="Implicit Cancellation"
                bodyFa="اگر یکی از متغیرهای `async let` خطا پرتاب کند و شما از اسکوپ تابع خارج شوید، زمان اجرای سوئیفت به‌طور خودکار سایر متغیرهای `async let` را Cancel کرده و پیش از خروج از تابع منتظر اتمام ایمن آن‌ها می‌ماند."
              />
            </div>
          </div>

          <TimelineComparisonSim />
          <PracticalRecipeGallery
            chapterBadgeFa="فصل دوم — الگوهای موازی‌سازی با async let"
            recipes={CHAPTER_2_RECIPES}
          />
        </section>

        {/* CHAPTER 3: Structured Concurrency & TaskGroup */}
        <section id="chapter-3" className="space-y-8 pt-12 border-t border-stone-200 dark:border-stone-800 scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              <div className="text-xs text-amber-800 dark:text-amber-400 font-semibold flex items-center gap-2">
                <span>فصل سوم</span>
                <span aria-hidden="true">·</span>
                <span dir="ltr" className="font-mono-tech">
                  Chapter 03 · Structured Concurrency & TaskGroup
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                هم‌زمانی ساختاریافته (<span dir="ltr" className="font-mono-tech">Structured Concurrency</span>) و مدیریت درخت وظایف
              </h2>
              <p className="text-sm sm:text-base leading-8 text-stone-700 dark:text-stone-300 max-w-prose">
                <RichText text="زمانی که تعداد عملیات موازی در زمان کامپایل مشخص نیست (مثلاً دانلود هم‌زمان آرایه‌ای از تصاویر با طول پویا)، از `withTaskGroup` یا `withThrowingTaskGroup` استفاده می‌کنیم. اصل بنیادین `Structured Concurrency` این است که هیچ کار فرزندی (`Child Task`) اجازه ندارد بیشتر از اسکوپ والد خود زنده بماند." />
              </p>
              <p className="text-sm sm:text-base leading-8 text-stone-700 dark:text-stone-300 max-w-prose">
                <RichText text="این ساختار درختی سه مزیت بزرگ به همراه دارد: ۱) انتشار خودکار خطا (`Automatic Error Propagation`) و لغو فرزندان هم‌ردیف، ۲) به ارث بردن اولویت اجرا (`TaskPriority Escalation`) و متغیرهای `@TaskLocal`، و ۳) لغو مشارکتی (`Cooperative Cancellation`) بدون نشت منابع (`Resource Leak`)." />
              </p>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <EditorialMarginNote
                indexLabel="حاشیه ۳.۱"
                titleFa="تفاوت Task.init و Task.detached"
                termEn="Unstructured Tasks"
                bodyFa="زمانی که از کدهای سنکرون (مثل اکشن دکمه در UI) می‌خواهید وارد دنیای `async` شوید، از `Task { ... }` استفاده می‌کنید که اولویت و `Actor Context` والد را به ارث می‌برد. از `Task.detached` تنها زمانی استفاده کنید که مطلقاً هیچ وابستگی به محیط فعلی ندارید."
              />
            </div>
          </div>

          <TaskGroupTreeSim />
          <PracticalRecipeGallery
            chapterBadgeFa="فصل سوم — الگوهای پیشرفته TaskGroup"
            recipes={CHAPTER_3_RECIPES}
          />
        </section>

        {/* CHAPTER 4: Actors & Reentrancy */}
        <section id="chapter-4" className="space-y-8 pt-12 border-t border-stone-200 dark:border-stone-800 scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              <div className="text-xs text-amber-800 dark:text-amber-400 font-semibold flex items-center gap-2">
                <span>فصل چهارم</span>
                <span aria-hidden="true">·</span>
                <span dir="ltr" className="font-mono-tech">
                  Chapter 04 · Actor Isolation, @MainActor & Reentrancy
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                حذف <span dir="ltr" className="font-mono-tech">Data Race</span> با <span dir="ltr" className="font-mono-tech">actor</span> و راز بزرگ <span dir="ltr" className="font-mono-tech">Actor Reentrancy</span>
              </h2>
              <p className="text-sm sm:text-base leading-8 text-stone-700 dark:text-stone-300 max-w-prose">
                <RichText text="زمانی که دو تسک هم‌زمان به یک نمونه از `class` دسترسی دارند و حداقل یکی از آن‌ها مقداری را تغییر می‌دهد، `Data Race` رخ می‌دهد که منجر به کرش‌های تصادفی یا فساد حافظه می‌شود. در گذشته برنامه‌نویسان از قفل‌های دستی (`NSLock` یا `DispatchQueue.sync`) استفاده می‌کردند که مستعد `Deadlock` بود." />
              </p>
              <p className="text-sm sm:text-base leading-8 text-stone-700 dark:text-stone-300 max-w-prose">
                <RichText text="نوع داده `actor` در سوئیفت، وضعیت داخلی خود را ایزوله می‌کند (`Actor Isolation`). هر دسترسی خارجی به متدها یا پراپرتی‌های یک `actor` نیازمند عبور از مرز `await` است تا پیام در صف سریالی (`Mailbox`) قرار گیرد. اما دقت کنید: `actor`ها برای پرهیز از بن‌بست، در نقاط `await` بازورودی (`Reentrant`) هستند!" />
              </p>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <EditorialMarginNote
                indexLabel="حاشیه ۴.۱"
                titleFa="قانون طلایی طراحی متدهای Actor"
                termEn="Synchronous State Transitions"
                bodyFa="همیشه بررسی شرط‌ها (`Invariants`) و تغییر متغیرهای داخلی `actor` را در یک بخش سنکرون و پیوسته پیش از اولین `await` انجام دهید، یا پس از بازگشت از `await`، مجدداً شرط‌های منطقی را ارزیابی کنید."
              />
            </div>
          </div>

          <ActorIsolationSim />
          <PracticalRecipeGallery
            chapterBadgeFa="فصل چهارم — الگوهای کاربردی Actor در پروداکشن"
            recipes={CHAPTER_4_RECIPES}
          />
        </section>

        {/* CHAPTER 5: Bridging Legacy Callbacks & Delegates with Continuations */}
        <section id="chapter-5" className="space-y-8 pt-12 border-t border-stone-200 dark:border-stone-800 scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              <div className="text-xs text-amber-800 dark:text-amber-400 font-semibold flex items-center gap-2">
                <span>فصل پنجم</span>
                <span aria-hidden="true">·</span>
                <span dir="ltr" className="font-mono-tech">
                  Chapter 05 · Bridging Legacy Callbacks via CheckedContinuation
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                پل زدن به کدهای قدیمی (<span dir="ltr" className="font-mono-tech">Callbacks & Delegates</span>) با <span dir="ltr" className="font-mono-tech">CheckedContinuation</span>
              </h2>
              <p className="text-sm sm:text-base leading-8 text-stone-700 dark:text-stone-300 max-w-prose">
                <RichText text="در دنیای واقعی، بسیاری از فریم‌ورک‌های سیستمی اپل (مانند `CoreLocation`، `CoreBluetooth`، `AVFoundation` یا کتابخانه‌های قدیمی شرکت شما) هنوز بر پایه `Completion Handler` یا `Delegate` کار می‌کنند. توابع خانواده `withCheckedContinuation` و `withCheckedThrowingContinuation` (`SE-0300`) پل رسمی بین دنیای قدیم و دنیای `async/await` هستند." />
              </p>
              <p className="text-sm sm:text-base leading-8 text-stone-700 dark:text-stone-300 max-w-prose">
                <RichText text="قانون آهنین `Continuation` این است که در هر مسیر اجرایی ممکن، باید متد `resume(...)` دقیقاً یک بار صدا زده شود: اگر صفر بار صدا زده شود، تسک منتظر تا ابد در حافظه نشت (`Leak`) می‌کند؛ و اگر بیش از یک بار صدا زده شود، زمان اجرای سوئیفت بلافاصله برنامه را متوقف (`Fatal Trap`) می‌سازد." />
              </p>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <EditorialMarginNote
                indexLabel="حاشیه ۵.۱"
                titleFa="چرا فراخوانی دوباره resume کرش می‌کند؟"
                termEn="Memory Safety Guarantee"
                bodyFa="به محض اولین فراخوانی `continuation.resume(returning:)`، فریم تابع معلق (`AsyncFrame`) بیدار شده و متغیرهای محلی آن آزاد می‌شوند. فراخوانی دوم تلاش می‌کند به فریم آزادشده بنویسد؛ بنابراین سوئیفت با یک بررسی اتمی در `CheckedContinuation` جلوی فساد حافظه (`Use-After-Free`) را می‌گیرد."
              />
            </div>
          </div>

          <ContinuationBridgeSim />
          <PracticalRecipeGallery
            chapterBadgeFa="فصل پنجم — الگوهای ایمن Continuation"
            recipes={CHAPTER_5_RECIPES}
          />
        </section>

        {/* CHAPTER 6: AsyncSequence, AsyncStream & Backpressure */}
        <section id="chapter-6" className="space-y-8 pt-12 border-t border-stone-200 dark:border-stone-800 scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              <div className="text-xs text-amber-800 dark:text-amber-400 font-semibold flex items-center gap-2">
                <span>فصل ششم</span>
                <span aria-hidden="true">·</span>
                <span dir="ltr" className="font-mono-tech">
                  Chapter 06 · AsyncSequence, AsyncStream & Backpressure
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                جریان‌های پیوسته رویداد با <span dir="ltr" className="font-mono-tech">AsyncSequence</span> و <span dir="ltr" className="font-mono-tech">AsyncStream</span>
              </h2>
              <p className="text-sm sm:text-base leading-8 text-stone-700 dark:text-stone-300 max-w-prose">
                <RichText text="یک تابع `async` معمولی یا یک `Continuation` تنها یک مقدار واحد را در آینده برمی‌گرداند. اما برای جریان‌هایی که در طول زمان مقادیر متعددی تولید می‌کنند — مانند پیام‌های `WebSocket`، موقعیت لحظه‌ای `GPS`، پیشرفت دانلود فایل یا نوتیفیکیشن‌های سیستم — سوئیفت پروتکل `AsyncSequence` و پیاده‌سازی آماده `AsyncStream` را ارائه می‌دهد." />
              </p>
              <p className="text-sm sm:text-base leading-8 text-stone-700 dark:text-stone-300 max-w-prose">
                <RichText text="یکی از مهم‌ترین تصمیمات معماری هنگام ساخت `AsyncStream`، تعیین سیاست مدیریت فشار (`Backpressure BufferingPolicy`) است: وقتی تولیدکننده سریع‌تر از حلقه `for await` مصرف‌کننده داده تولید کند، آیا باید همه را در حافظه نگه داریم (`.unbounded`)، قدیمی‌ها را حفظ کنیم (`.bufferingOldest`)، یا فقط آخرین وضعیت را نگه داریم (`.bufferingNewest`)؟" />
              </p>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <EditorialMarginNote
                indexLabel="حاشیه ۶.۱"
                titleFa="کتابخانه Apple AsyncAlgorithms"
                termEn="debounce, throttle, merge, combineLatest"
                bodyFa="پکیج رسمی `swift-async-algorithms` عملگرهای پیشرفته‌ای مانند `debounce`، `throttle`، `chain`، `merge` و `combineLatest` را با پشتیبانی کامل از `Structured Concurrency` به تمام انواع `AsyncSequence` اضافه می‌کند."
              />
            </div>
          </div>

          <AsyncStreamSim />
          <PracticalRecipeGallery
            chapterBadgeFa="فصل ششم — الگوهای AsyncSequence در پروداکشن"
            recipes={CHAPTER_6_RECIPES}
          />
        </section>

        {/* CHAPTER 7: Swift 6 Strict Concurrency, Sendable, Region Isolation & Mutex */}
        <section id="chapter-7" className="space-y-8 pt-12 border-t border-stone-200 dark:border-stone-800 scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              <div className="text-xs text-amber-800 dark:text-amber-400 font-semibold flex items-center gap-2">
                <span>فصل هفتم (ویژه مهاجرت به سوئیفت ۶)</span>
                <span aria-hidden="true">·</span>
                <span dir="ltr" className="font-mono-tech">
                  Chapter 07 · Swift 6 Strict Concurrency, Sendable, sending & Mutex
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                کالبدشکافی جامع <span dir="ltr" className="font-mono-tech">Swift 6 Strict Concurrency</span>: از <span dir="ltr" className="font-mono-tech">Sendable</span> تا <span dir="ltr" className="font-mono-tech">Region Isolation</span>
              </h2>
              <p className="text-sm sm:text-base leading-8 text-stone-700 dark:text-stone-300 max-w-prose">
                <RichText text="در `Swift 6 Language Mode`، هشدارهای هم‌زمانی به خطاهای کامپایل قطعی تبدیل می‌شوند تا هرگونه احتمال `Data Race` پیش از اجرای برنامه ریشه‌کن گردد. اما مهاجرت یک پروژه بزرگ به سوئیفت ۶ نیازمند درک دقیق ۶ مفهوم کلیدی است: ۱) پروتکل `Sendable` برای انواع مقداری و کلاس‌های تغییرناپذیر، ۲) ایزولاسیون رابط کاربری با `@MainActor`، ۳) ایزولاسیون مبتنی بر ناحیه (`SE-0414 Region-Based Isolation`) و کلمه کلیدی `sending` برای انتقال اشیای غیر-Sendable، ۴) تطابق پروتکل‌های سنکرون با `@preconcurrency` و `nonisolated`، ۵) جایگزینی قفل‌های قدیمی با `Mutex<T>` از ماژول `Synchronization`، و ۶) حذف متغیرهای سراسری `static var`." />
              </p>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <EditorialMarginNote
                indexLabel="حاشیه ۷.۱"
                titleFa="مهاجرت تدریجی ماژول‌به‌ماژول به Swift 6"
                termEn="Upcoming Feature Flags"
                bodyFa="پیش از تغییر نسخه زبان کل پروژه به ۶، می‌توانید با فعال‌سازی فلگ `-strict-concurrency=complete` در تنظیمات `Swift Compiler`، خطاها را به‌صورت هشدار (`Warning`) در هر ماژول مشاهده و به مرور برطرف کنید."
              />
            </div>
          </div>

          <StrictConcurrencyChecker />
        </section>

        {/* CHAPTER 8: Real-World Production Architecture Patterns */}
        <section id="chapter-8" className="space-y-8 pt-12 border-t border-stone-200 dark:border-stone-800 scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              <div className="text-xs text-amber-800 dark:text-amber-400 font-semibold flex items-center gap-2">
                <span>فصل هشتم</span>
                <span aria-hidden="true">·</span>
                <span dir="ltr" className="font-mono-tech">
                  Chapter 08 · Production Architecture: SwiftUI .task, @TaskLocal & Clock
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                معماری عملیاتی در پروژه‌های بزرگ: <span dir="ltr" className="font-mono-tech">SwiftUI .task(id:)</span>، <span dir="ltr" className="font-mono-tech">@TaskLocal</span> و تست‌پذیری با <span dir="ltr" className="font-mono-tech">Clock</span>
              </h2>
              <p className="text-sm sm:text-base leading-8 text-stone-700 dark:text-stone-300 max-w-prose">
                <RichText text="در فصل پایانی، مفاهیم آموخته‌شده را به معماری روزمره اپلیکیشن‌های iOS و سیستم‌های سروری متصل می‌کنیم: چگونه با مودیفایر `.task(id:)` در SwiftUI چرخه حیات درخواست‌های شبکه را به عمر View گره بزنیم و `Debounce` بسازیم؛ چگونه با `@TaskLocal` (`SE-0311`) شناسه‌های ردیابی (`Trace ID`) را بدون آلوده کردن امضای توابع در کل درخت وظایف منتشر کنیم؛ و چگونه با پروتکل `Clock` (`SE-0329`) کدهای زمان‌دار و منطق `Retry` را در کمتر از یک میلی‌ثانیه Unit Test کنیم." />
              </p>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <EditorialMarginNote
                indexLabel="حاشیه ۸.۱"
                titleFa="تفاوت ContinuousClock و SuspendingClock"
                termEn="SE-0329 Clock Semantics"
                bodyFa="`ContinuousClock` حتی زمانی که آیفون یا مک به حالت Sleep می‌رود به شمارش زمان ادامه می‌دهد (مناسب برای مهلت‌های شبکه)، در حالی که `SuspendingClock` هنگام خواب سیستم متوقف می‌شود (مناسب برای انیمیشن‌ها و تایمرهای درون‌برنامه‌ای)."
              />
            </div>
          </div>

          <PracticalRecipeGallery
            chapterBadgeFa="فصل هشتم — الگوهای معماری، ردیابی و تست‌پذیری"
            recipes={CHAPTER_8_RECIPES}
          />
        </section>

        {/* BILINGUAL TECHNICAL GLOSSARY & 4-QUESTION SELF-CHECK QUIZ */}
        <section id="glossary" className="space-y-10 pt-12 border-t border-stone-200 dark:border-stone-800 scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs text-amber-800 dark:text-amber-400 font-semibold">
                مرجع سریع واژگان استاندارد · Bilingual Technical Glossary
              </div>
              <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                فرهنگ توصیفی اصطلاحات <span dir="ltr" className="font-mono-tech">Swift Concurrency</span>
              </h2>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                aria-label="جستجو در واژه‌نامه فنی"
                placeholder="جستجوی اصطلاح (مثلاً Sendable یا تعلیق)..."
                value={glossaryQuery}
                onChange={(e) => setGlossaryQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGlossary.map((item) => (
              <div
                key={item.termEn}
                className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-2"
              >
                <div className="flex items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-2">
                  <span
                    dir="ltr"
                    className="font-mono-tech font-bold text-sm text-amber-800 dark:text-amber-400"
                  >
                    {item.termEn}
                  </span>
                  <span
                    dir="ltr"
                    className="font-mono-tech text-[11px] text-stone-400"
                  >
                    {item.proposalId}
                  </span>
                </div>
                <div className="text-xs font-bold text-stone-800 dark:text-stone-200">
                  معادل پیشنهادی نشر فنی: {item.persianEquivalent}
                </div>
                <p className="text-xs leading-6 text-stone-600 dark:text-stone-400">
                  <RichText text={item.definitionFa} />
                </p>
              </div>
            ))}
          </div>

          {/* Interactive Self-Assessment Quiz (4 Questions) */}
          <div className="p-6 rounded-xl border border-stone-300 dark:border-stone-800 bg-stone-100/70 dark:bg-stone-900/60 space-y-6">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-800 dark:text-amber-400" />
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                آزمون جامع درک مفاهیم هم‌زمانی (<span dir="ltr" className="font-mono-tech">4-Part Concept Check</span>)
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {QUIZ_QUESTIONS.map((q, qIdx) => {
                const picked = selectedAnswers[q.id];
                const pickedObj = q.options.find((o) => o.id === picked);

                return (
                  <div
                    key={q.id}
                    className="p-5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-4"
                  >
                    <p className="text-xs sm:text-sm font-bold leading-7 text-stone-900 dark:text-stone-100">
                      {qIdx + 1}. <RichText text={q.questionFa} />
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt) => {
                        const isSelected = picked === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              setSelectedAnswers((prev) => ({
                                ...prev,
                                [q.id]: opt.id,
                              }))
                            }
                            className={`w-full text-right p-3 rounded-lg border text-xs leading-6 transition-colors cursor-pointer ${
                              isSelected
                                ? opt.isCorrect
                                  ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-semibold'
                                  : 'border-red-500 bg-red-50/70 dark:bg-red-950/40 text-red-950 dark:text-red-200 font-semibold'
                                : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60 text-stone-700 dark:text-stone-300'
                            }`}
                          >
                            <RichText text={opt.textFa} />
                          </button>
                        );
                      })}
                    </div>
                    {pickedObj && (
                      <div
                        className={`p-3 rounded-md text-xs leading-6 flex items-start gap-2 ${
                          pickedObj.isCorrect
                            ? 'bg-emerald-100/60 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200'
                            : 'bg-amber-100/60 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-1" />
                        <div>
                          <strong>{pickedObj.isCorrect ? 'پاسخ دقیق است: ' : 'راهنمایی فنی: '}</strong>
                          <RichText text={q.explanationFa} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* GITHUB PAGES DEPLOYMENT GUIDE SECTION */}
        <section id="deploy-guide" className="pt-12 border-t border-stone-200 dark:border-stone-800 scroll-mt-24">
          <GitHubDeployGuideSection />
        </section>
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 py-8 px-6 lg:px-12 mt-16 text-xs text-stone-500 dark:text-stone-400">
        <div className="max-w-[1240px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            نشر رشته‌ها — کتاب‌تعاملی بازمتن آموزش <span dir="ltr" className="font-mono-tech">Swift Concurrency</span> به زبان فارسی (نسخه جامع ۸ فصلی)
          </div>
          <div className="flex items-center gap-4">
            <a href="#top" className="hover:text-stone-900 dark:hover:text-stone-200">
              بازگشت به بالای صفحه
            </a>
            <span aria-hidden="true">·</span>
            <a href="#deploy-guide" className="hover:text-stone-900 dark:hover:text-stone-200">
              مستندات استقرار در GitHub Pages
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
