import React, { useState } from 'react';
import { RichText } from './RichText';
import { CheckCircle2, AlertOctagon, Wrench, Copy, Check, Layers } from 'lucide-react';

interface AuditScenario {
  id: string;
  categoryEn: string;
  titleFa: string;
  subtitleEn: string;
  brokenCode: string;
  fixedCode: string;
  compilerDiagnosticEn: string;
  explanationFa: string;
  deepDiveTakeawayFa: string;
}

const SCENARIOS: AuditScenario[] = [
  {
    id: 'non-sendable-closure',
    categoryEn: 'SE-0302 Sendable',
    titleFa: 'ارسال کلاس تغییرپذیر به مرز Task',
    subtitleEn: 'Sending Non-Sendable Reference Across Task Boundary',
    brokenCode: `class UserDraft {
    var bio: String = "iOS Engineer"
}

func publishProfile() {
    let draft = UserDraft()
    Task.detached {
        // ❌ Compiler Error in Swift 6:
        print(draft.bio)
    }
    draft.bio = "Swift Concurrency Author"
}`,
    fixedCode: `struct UserDraft: Sendable {
    let bio: String
}

func publishProfile() {
    let draft = UserDraft(bio: "iOS Engineer")
    Task.detached {
        // ✅ Safe Value Type (Sendable) copy across boundary:
        print(draft.bio)
    }
}`,
    compilerDiagnosticEn:
      "error: sending 'draft' risks causing data races; 'UserDraft' is not 'Sendable'",
    explanationFa:
      'در `Swift 6 Strict Concurrency`، ارسال یک نمونه از `class` تغییرپذیر (`Mutable Reference Type`) به داخل `Task.detached` یا یک `Actor` دیگر در زمان کامپایل مسدود می‌شود. با تبدیل مدل داده به `struct` (که مبتنی بر `Value Semantics` و کپی در هنگام تغییر `Copy-on-Write` است)، ریسک `Data Race` در ریشه حذف می‌گردد.',
    deepDiveTakeawayFa:
      'اگر مجبور به استفاده از `class` هستید، باید آن را `final` تعریف کرده و تمام پراپرتی‌های آن را تغییرناپذیر (`let`) کنید تا کامپایلر اجازه تطابق با پروتکل `Sendable` را بدهد.',
  },
  {
    id: 'main-actor-ui',
    categoryEn: 'SE-0316 Global Actors',
    titleFa: 'به‌روزرسانی UI خارج از @MainActor',
    subtitleEn: 'Mutating @MainActor Isolated ViewModel from Background',
    brokenCode: `@MainActor
final class FeedViewModel: ObservableObject {
    @Published var articles: [String] = []
    
    nonisolated func reloadFromDisk() {
        Task.detached {
            let loaded = ["Swift 6", "Actors"]
            // ❌ Compiler Error:
            self.articles = loaded
        }
    }
}`,
    fixedCode: `@MainActor
final class FeedViewModel: ObservableObject {
    @Published var articles: [String] = []
    
    func reloadFromDisk() async {
        // Suspends @MainActor safely without blocking UI thread:
        let loaded = await DiskReader.readArticles()
        // ✅ Guaranteed to resume on @MainActor executor:
        self.articles = loaded
    }
}`,
    compilerDiagnosticEn:
      "error: main actor-isolated property 'articles' can not be mutated from a non-isolated context",
    explanationFa:
      'ویژگی `articles` تحت حفاظت `@MainActor` قرار دارد. در کد اصلاح‌شده، متد `reloadFromDisk() async` روی `@MainActor` باقی می‌ماند؛ وقتی به `await DiskReader.readArticles()` می‌رسد، رشته اصلی (`Main Thread`) اصلاً فریز نمی‌شود بلکه آزاد شده و پس از اتمام خوانش دیسک، ادامه تابع (`Continuation`) روی `@MainActor` اجرا می‌شود.',
    deepDiveTakeawayFa:
      'هرگز برای فرار از خطای کامپایلر به سراغ `DispatchQueue.main.async` نروید؛ استفاده از `@MainActor` یا `await MainActor.run { ... }` به کامپایلر اجازه می‌دهد صحت ایزولاسیون را در زمان کامپایل اثبات کند.',
  },
  {
    id: 'region-based-isolation',
    categoryEn: 'SE-0414 Region Isolation',
    titleFa: 'ایزولاسیون مبتنی بر ناحیه و کلمه کلیدی sending',
    subtitleEn: 'Region-Based Isolation & Transferring Non-Sendable Values',
    brokenCode: `// Non-Sendable mutable buffer class
class ImageBuffer {
    var pixels: [UInt8] = [0, 128, 255]
}

func processInBackground() async {
    let buffer = ImageBuffer()
    await ImageProcessor.shared.applyFilter(buffer)
    // ❌ Error: 'buffer' used after being transferred to actor!
    print(buffer.pixels.count)
}`,
    fixedCode: `class ImageBuffer {
    var pixels: [UInt8] = [0, 128, 255]
}

actor ImageProcessor {
    static let shared = ImageProcessor()
    // 'sending' parameter transfers region ownership safely:
    func applyFilter(_ buffer: sending ImageBuffer) -> Int {
        buffer.pixels.append(64)
        return buffer.pixels.count
    }
}

func processInBackground() async {
    let buffer = ImageBuffer()
    // ✅ Ownership transferred once; never accessed again locally:
    let total = await ImageProcessor.shared.applyFilter(buffer)
    print(total)
}`,
    compilerDiagnosticEn:
      "error: region-based isolation: 'buffer' cannot be accessed after being transferred across isolation boundary",
    explanationFa:
      'در `Swift 5.10` حتی اگر یک شیء غیر-`Sendable` را می‌ساختید و فقط یک بار به یک `actor` تحویل می‌دادید، کامپایلر خطا می‌داد. در `Swift 6` با معرفی `SE-0414 (Region-Based Isolation)` و کلمه کلیدی `sending`، کامپایلر تحلیل می‌کند که اگر پس از تحویل شیء، دیگر در اسکوپ مبدا به آن دست نزنید، انتقال مالکیت (`Ownership Transfer`) کاملاً ایمن و بدون `Data Race` است!',
    deepDiveTakeawayFa:
      'کلمه کلیدی `sending` در امضای توابع به شما اجازه می‌دهد اشیای غیر-`Sendable` (مثل بافرهای تصویر یا مدل‌های CoreData) را بدون نیاز به `@unchecked Sendable` بین نواحی ایزوله منتقل کنید.',
  },
  {
    id: 'protocol-isolated-conformance',
    categoryEn: 'SE-0423 Dynamic Isolation',
    titleFa: 'تطابق پروتکل سنکرون در کلاس @MainActor',
    subtitleEn: 'Protocol Conformance on @MainActor Isolated Types',
    brokenCode: `protocol Loggable {
    func logSummary() -> String
}

@MainActor
final class CheckoutSheet: Loggable {
    var totalAmount: Int = 250_000
    
    // ❌ Swift 6 Error: Main actor-isolated method 'logSummary()'
    // cannot satisfy nonisolated protocol requirement!
    func logSummary() -> String {
        return "Checkout: \\(totalAmount)"
    }
}`,
    fixedCode: `protocol Loggable {
    func logSummary() -> String
}

@MainActor
final class CheckoutSheet: @preconcurrency Loggable {
    let sheetID: UUID = UUID()
    var totalAmount: Int = 250_000
    
    // ✅ Option A: Mark nonisolated and only access immutable 'let' properties
    nonisolated func logSummary() -> String {
        return "Checkout Sheet ID: \\(sheetID)"
    }
}`,
    compilerDiagnosticEn:
      "error: main actor-isolated instance method 'logSummary()' cannot be used to satisfy nonisolated protocol requirement",
    explanationFa:
      'پروتکل‌های معمولی که متدهای سنکرون دارند، از دید کامپایلر `nonisolated` هستند (یعنی هر کسی از هر رشته‌ای ممکن است آن‌ها را صدا بزند). وقتی یک کلاس `@MainActor` چنین پروتکلی را پیاده‌سازی می‌کند، کامپایلر سوئیفت ۶ مانع دسترسی به متغیرهای `var` داخل آن متد می‌شود.',
    deepDiveTakeawayFa:
      'سه راه‌حل معماری وجود دارد: ۱) اگر پروتکل همیشه در UI استفاده می‌شود، خود `protocol` را با `@MainActor` علامت‌گذاری کنید، ۲) متد را `nonisolated` کرده و فقط از پراپرتی‌های ثابت `let` استفاده کنید، یا ۳) برای کتابخانه‌های قدیمی از `@preconcurrency` بهره ببرید.',
  },
  {
    id: 'unchecked-sendable-synchronization',
    categoryEn: 'Synchronization Module',
    titleFa: 'پیاده‌سازی ایمن @unchecked Sendable با Mutex',
    subtitleEn: 'Replacing Legacy Locks with Swift 6 Mutex<Value>',
    brokenCode: `// ❌ DANGEROUS: Lying to the compiler with @unchecked Sendable
// without internal lock protection!
final class MetricsCounter: @unchecked Sendable {
    var count: Int = 0
    func increment() {
        count += 1 // Unprotected Data Race at runtime!
    }
}`,
    fixedCode: `import Synchronization

// ✅ SAFE SYNCHRONOUS SENDABLE: Using Swift 6 Mutex<T>
final class MetricsCounter: Sendable {
    private let state = Mutex<Int>(0)
    
    func increment() -> Int {
        state.withLock { currentCount in
            currentCount += 1
            return currentCount
        }
    }
}`,
    compilerDiagnosticEn:
      "warning/audit: '@unchecked Sendable' disables compile-time checking; prefer Synchronization.Mutex<T> or actor",
    explanationFa:
      'گاهی اوقات نمی‌توانید از `actor` استفاده کنید چون متد شما باید حتماً به‌صورت سنکرون (بدون `await`) فراخوانی شود. استفاده کورکورانه از `@unchecked Sendable` کامپایلر را ساکت می‌کند اما کرش زمان اجرا را باقی می‌گذارد. در `Swift 6` ماژول استاندارد `Synchronization` و نوع `Mutex<Value>` معرفی شده که ذاتاً `Sendable` است و قفل‌گذاری سنکرون و ایمن را فراهم می‌کند.',
    deepDiveTakeawayFa:
      'نوع `Mutex<T>` در سوئیفت ۶ نیازی به `@unchecked Sendable` ندارد و دسترسی به داده را منحصراً در داخل کلوژر `withLock` مجاز می‌شمارد.',
  },
  {
    id: 'global-mutable-state',
    categoryEn: 'SE-0412 Strict Globals',
    titleFa: 'متغیرهای سراسری و static var در سوئیفت ۶',
    subtitleEn: 'Strict Concurrency for Global and Static Variables',
    brokenCode: `struct NetworkEnvironment {
    // ❌ Swift 6 Error: 'static var' is shared mutable state!
    static var baseURL = "https://api.example.com"
}

func switchServer() {
    NetworkEnvironment.baseURL = "https://staging.example.com"
}`,
    fixedCode: `enum NetworkEnvironment {
    // ✅ Option 1: Compile-time constant 'let' of Sendable type
    static let defaultBaseURL = "https://api.example.com"
    
    // ✅ Option 2: Isolate mutable static state to @MainActor or an actor
    @MainActor static var currentOverrideURL: String? = nil
}`,
    compilerDiagnosticEn:
      "error: static property 'baseURL' is not concurrency-safe because it is nonisolated global shared mutable state",
    explanationFa:
      'بر اساس پروپوزال `SE-0412` در سوئیفت ۶، هرگونه متغیر سراسری یا `static var` که به یک Global Actor مقید نشده باشد، یک حفره بالقوه `Data Race` است و کامپایل نمی‌شود.',
    deepDiveTakeawayFa:
      'تمام تنظیمات ثابتی که با `static var` نوشته شده‌اند اما هرگز تغییر نمی‌کنند را به `static let` تبدیل کنید تا بلافاصله با `Swift 6` سازگار شوند.',
  },
];

export const StrictConcurrencyChecker: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(SCENARIOS[0].id);
  const [isFixedByScenario, setIsFixedByScenario] = useState<
    Record<string, boolean>
  >({});

  const activeScenario =
    SCENARIOS.find((s) => s.id === selectedId) ?? SCENARIOS[0];
  const isFixed = Boolean(isFixedByScenario[activeScenario.id]);

  const toggleFix = () => {
    setIsFixedByScenario((prev) => ({
      ...prev,
      [activeScenario.id]: !prev[activeScenario.id],
    }));
  };

  return (
    <div className="rounded-xl border border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs">
      {/* Header */}
      <div className="px-6 py-4 bg-stone-100/80 dark:bg-stone-950/60 border-b border-stone-200 dark:border-stone-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2">
              <span>آزمایشگاه جامع ۰۷ (۶ سناریوی واقعی مهاجرت به سوئیفت ۶)</span>
              <span aria-hidden="true">·</span>
              <span dir="ltr" className="font-mono-tech">
                Swift 6.0 Complete Concurrency Checking
              </span>
            </div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mt-0.5">
              ممیز تعاملی خطاهای کامپایلر در <span dir="ltr" className="font-mono-tech">Swift 6</span> (<span dir="ltr" className="font-mono-tech">Sendable, sending, @MainActor, Mutex</span>)
            </h3>
          </div>
          <span
            dir="ltr"
            className="text-xs font-mono-tech text-amber-800 dark:text-amber-400 font-semibold"
          >
            {activeScenario.categoryEn}
          </span>
        </div>

        {/* 6 Scenario Tabs */}
        <div
          role="tablist"
          aria-label="سناریوهای خطای کامپایلر Swift 6"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 pt-1"
        >
          {SCENARIOS.map((sc, idx) => (
            <button
              key={sc.id}
              type="button"
              role="tab"
              aria-selected={selectedId === sc.id}
              onClick={() => setSelectedId(sc.id)}
              className={`px-3 py-2 text-right text-xs font-medium rounded-lg border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                selectedId === sc.id
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100 shadow-xs'
                  : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <span className="truncate">
                ۰{idx + 1}. {sc.titleFa}
              </span>
              <span
                dir="ltr"
                className={`font-mono-tech text-[10px] shrink-0 ${
                  selectedId === sc.id
                    ? 'text-amber-300 dark:text-amber-700'
                    : 'text-stone-400'
                }`}
              >
                {sc.categoryEn.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left/Top Code Stage (7 cols) */}
        <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-l border-stone-200 dark:border-stone-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span dir="ltr" className="text-xs font-mono-tech text-stone-500">
              {activeScenario.subtitleEn}
            </span>
            <button
              type="button"
              onClick={toggleFix}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isFixed
                  ? 'bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100 hover:bg-stone-300 dark:hover:bg-stone-700'
                  : 'bg-amber-700 hover:bg-amber-600 text-white'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              {isFixed
                ? 'مشاهده کد دارای خطا (Revert to Broken)'
                : 'اعمال راه‌حل استاندارد Swift 6 (Apply Fix)'}
            </button>
          </div>

          <pre
            dir="ltr"
            className="p-4 rounded-lg bg-stone-950 text-stone-100 font-mono-tech text-xs leading-6 overflow-x-auto border border-stone-800"
          >
            {isFixed ? activeScenario.fixedCode : activeScenario.brokenCode}
          </pre>

          {/* Compiler Output Box */}
          <div
            className={`p-3.5 rounded-lg border text-xs ${
              isFixed
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
                : 'bg-red-50/70 dark:bg-red-950/30 border-red-300 dark:border-red-800/80 text-red-900 dark:text-red-200'
            }`}
          >
            <div className="flex items-center gap-2 font-mono-tech font-semibold" dir="ltr">
              {isFixed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <span>swiftc -swift-version 6: Build Succeeded (0 Concurrency Errors)</span>
                </>
              ) : (
                <>
                  <AlertOctagon className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                  <span>{activeScenario.compilerDiagnosticEn}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Explanation (5 cols) */}
        <div className="lg:col-span-5 p-6 bg-stone-50/60 dark:bg-stone-950/30 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              تحلیل عمیق کامپایلر و الگوی معماری
            </h4>
            <p className="text-xs leading-7 text-stone-700 dark:text-stone-300">
              <RichText text={activeScenario.explanationFa} />
            </p>

            <div className="p-4 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs leading-6 text-stone-700 dark:text-stone-300 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-400">
                <Layers className="w-4 h-4" />
                <span>توصیه مهندسی برای پروژه‌های واقعی:</span>
              </div>
              <p>
                <RichText text={activeScenario.deepDiveTakeawayFa} />
              </p>
            </div>

            <div className="p-4 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs space-y-2">
              <div className="font-bold text-stone-800 dark:text-stone-200">
                ماتریس تصمیم‌گیری <span dir="ltr" className="font-mono-tech">Sendable</span> در سوئیفت ۶:
              </div>
              <ul className="space-y-1.5 text-stone-600 dark:text-stone-400 list-disc pr-4 leading-6">
                <li>
                  مدل‌های داده و DTOها: همیشه <code dir="ltr" className="font-mono-tech">struct</code> یا <code dir="ltr" className="font-mono-tech">enum</code> با فیلدهای <code dir="ltr" className="font-mono-tech">Sendable</code>.
                </li>
                <li>
                  سرویس‌های دارای وضعیت آسنکرون: تبدیل به <code dir="ltr" className="font-mono-tech">actor</code>.
                </li>
                <li>
                  کلاس‌های سنکرون نیازمند قفل سریع: استفاده از <code dir="ltr" className="font-mono-tech">Mutex&lt;Value&gt;</code> از ماژول <code dir="ltr" className="font-mono-tech">Synchronization</code>.
                </li>
                <li>
                  ارسال یک‌طرفه بافرهای غیر-Sendable: استفاده از پارامتر <code dir="ltr" className="font-mono-tech">sending</code> (<code dir="ltr" className="font-mono-tech">SE-0414</code>).
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-[11px] font-mono-tech text-stone-400" dir="ltr">
            <span>SE-0302 · SE-0412 · SE-0414 · SE-0423</span>
            <span>Swift 6.0 Mode</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const GitHubDeployGuideSection: React.FC = () => {
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);

  const gitInitCommands = `git init
git add .
git commit -m "Initial commit: Swift Concurrency Interactive Persian Book"
git branch -M main
git remote add origin https://github.com/<USERNAME>/<REPO_NAME>.git
git push -u origin main`;

  const workflowYaml = `name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install --legacy-peer-deps
      - run: npx vite build --base="/\${{ github.event.repository.name }}/"
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4`;

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard?.writeText(content);
    setCopiedBlock(id);
    setTimeout(() => setCopiedBlock(null), 2000);
  };

  return (
    <div className="rounded-xl border border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 lg:p-8 space-y-6">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
        <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2">
          <span>پیوست اجرایی و مستندات <span dir="ltr" className="font-mono-tech">README.md</span></span>
          <span aria-hidden="true">·</span>
          <span dir="ltr" className="font-mono-tech">
            Zero-Cost GitHub Pages CI/CD
          </span>
        </div>
        <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-1">
          راهنمای گام‌به‌گام دیپلوی رایگان در <span dir="ltr" className="font-mono-tech">GitHub Pages</span>
        </h3>
        <p className="text-sm text-stone-600 dark:text-stone-400 mt-1 leading-7">
          تمام این دستورالعمل‌ها در فایل <code dir="ltr" className="tech-term bg-stone-200 dark:bg-stone-800">README.md</code> ریشه پروژه نیز ذخیره شده‌اند تا به‌محض آپلود در گیت‌هاب، صفحه اول مخزن شما یک مستند کامل باشد.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              گام اول: ارسال سورس‌پروژه به مخزن گیت‌هاب
            </h4>
            <button
              type="button"
              onClick={() => handleCopy('git-cmds', gitInitCommands)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 cursor-pointer whitespace-nowrap shrink-0"
            >
              {copiedBlock === 'git-cmds' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  کپی شد
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  کپی دستورات Git
                </>
              )}
            </button>
          </div>
          <p className="text-xs leading-6 text-stone-600 dark:text-stone-400">
            یک مخزن عمومی (<span dir="ltr" className="font-mono-tech">Public Repository</span>) در گیت‌هاب بسازید و دستورات زیر را در ترمینال اجرا کنید:
          </p>
          <pre
            dir="ltr"
            className="p-4 rounded-lg bg-stone-950 text-stone-100 font-mono-tech text-xs leading-6 overflow-x-auto border border-stone-800"
          >
            {gitInitCommands}
          </pre>

          <div className="p-4 rounded-lg bg-stone-100/90 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 text-xs leading-6 text-stone-700 dark:text-stone-300 space-y-1.5">
            <div className="font-bold text-stone-900 dark:text-stone-100">
              گام سوم: فعال‌سازی یک‌باره در تنظیمات مخزن
            </div>
            <p>
              ۱. وارد تب <code dir="ltr" className="tech-term bg-stone-200 dark:bg-stone-800">Settings</code> مخزن خود در گیت‌هاب شوید.
            </p>
            <p>
              ۲. از منوی سمت چپ وارد بخش <code dir="ltr" className="tech-term bg-stone-200 dark:bg-stone-800">Pages</code> شوید.
            </p>
            <p>
              ۳. زیر قسمت <code dir="ltr" className="tech-term bg-stone-200 dark:bg-stone-800">Build and deployment</code>، مقدار <code dir="ltr" className="tech-term bg-stone-200 dark:bg-stone-800">Source</code> را روی <code dir="ltr" className="tech-term bg-stone-200 dark:bg-stone-800">GitHub Actions</code> قرار دهید.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              گام دوم: فایل <span dir="ltr" className="font-mono-tech">.github/workflows/deploy.yml</span>
            </h4>
            <button
              type="button"
              onClick={() => handleCopy('yaml-workflow', workflowYaml)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 cursor-pointer whitespace-nowrap shrink-0"
            >
              {copiedBlock === 'yaml-workflow' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  کپی شد
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  کپی فایل YAML
                </>
              )}
            </button>
          </div>
          <p className="text-xs leading-6 text-stone-600 dark:text-stone-400">
            با قرار دادن این فایل در مسیر <code dir="ltr" className="tech-term bg-stone-200 dark:bg-stone-800">.github/workflows/deploy.yml</code>، با هر <code dir="ltr" className="tech-term bg-stone-200 dark:bg-stone-800">git push</code> نسخه نهایی با تنظیم خودکار <code dir="ltr" className="tech-term bg-stone-200 dark:bg-stone-800">--base</code> ساخته و منتشر می‌شود:
          </p>
          <pre
            dir="ltr"
            className="p-4 rounded-lg bg-stone-950 text-stone-100 font-mono-tech text-[11px] leading-5 overflow-x-auto border border-stone-800 max-h-[300px]"
          >
            {workflowYaml}
          </pre>
        </div>
      </div>
    </div>
  );
};
