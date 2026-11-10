# نشر رشته‌ها — راهنمای تعاملی Swift Concurrency (Interactive Persian Edition)

یک کتاب‌تعاملی (Interactive Technical Book) و آزمایشگاه شبیه‌سازی بصری برای یادگیری عمیق **Swift Concurrency** مدرن (`async/await`، `Structured Concurrency`، `TaskGroup`، `Actors`، `MainActor` و `Sendable` در Swift 6) به زبان فارسی با نگارش استاندارد نشر فنی و حفظ دقیق اصطلاحات انگلیسی (`Technical English`).

---

## ویژگی‌های کلیدی پروژه (نسخه جامع ۸ فصلی)

1. **نگارش در تراز ناشران فنی (Technical Editorial Publishing)**:
   - ترکیب روان و خوش‌خوان زبان فارسی با اصطلاحات تخصصی انگلیسی به‌صورت `Inline Monospace` با رعایت جهت‌گیری دوطرفه (`BiDi Isolation`).
   - حاشیه‌نویسی‌های تحلیلی (Margin Notes) و بیش از **۲۰ الگوی کد پروداکشن (`Anti-Pattern` در برابر `Production Pattern`)** در تمامی فصل‌ها.

2. **۸ فصل آموزشی و ۷ آزمایشگاه شبیه‌سازی تعاملی (Interactive Simulators)**:
   - **فصل ۱ و شبیه‌ساز ۱ — مدل اجرای Thread vs Continuation**: مقایسه مستقیم مدل قدیمی `GCD (Grand Central Dispatch)` و ایجاد `Thread Explosion` در برابر `Cooperative Thread Pool`، مکانیزم `Suspension Point` و الگوهای `Task.yield()`.
   - **فصل ۲ و شبیه‌ساز ۲ — مقایسه اجرای ترتیبی و موازی (`Sequential await` vs `async let`)**: مشاهده زنده زمان کل اجرا، جدول زمانی موازی، و اجرای گام‌به‌گام کد.
   - **فصل ۳ و شبیه‌ساز ۳ — درخت وظایف (`Structured Concurrency & TaskGroup`)**: آزمایش `withThrowingTaskGroup`، انتشار خودکار خطا، لغو سلسله‌مراتبی و الگوی `Sliding Window` برای محدودسازی سقف هم‌زمانی.
   - **فصل ۴ و شبیه‌ساز ۴ — ایزولاسیون `Actor` و `Actor Reentrancy`**: مقایسه بصری وقوع `Data Race` روی `class` معمولی در برابر صف سریال `actor`، دام `Actor Reentrancy` و الگوی کش تصویر با `enum Entry.inFlight(Task)`.
   - **فصل ۵ و شبیه‌ساز ۵ — پل ارتباطی به کدهای قدیمی با `CheckedContinuation`**: شبیه‌سازی قانون `Resume-Exactly-Once` (نشت تسک در حالت `0x` و کرش در حالت `2x`) و ترکیب با `withTaskCancellationHandler`.
   - **فصل ۶ و شبیه‌ساز ۶ — جریان‌های رویداد با `AsyncSequence` و `AsyncStream`**: آزمایش بصری سیاست‌های مدیریت فشار (`Backpressure BufferingPolicy`: `.unbounded`، `.bufferingOldest` و `.bufferingNewest`).
   - **فصل ۷ و ممیز جامع ۶ سناریوی `Swift 6 Strict Concurrency`**: بررسی خط‌به‌خط `Sendable`، `@MainActor`، ایزولاسیون مبتنی بر ناحیه (`SE-0414 Region-Based Isolation` و کلمه کلیدی `sending`)، تطابق پروتکل‌ها با `@preconcurrency`، قفل مدرن `Mutex<Value>` از ماژول `Synchronization` و حذف `static var`های سراسری.
   - **فصل ۸ — معماری عملیاتی در پروداکشن**: الگوی جستجوی Debounce با `.task(id:)` در SwiftUI، ردیابی توزیع‌شده با `@TaskLocal` و تست‌پذیری قطعی زمان با پروتکل `Clock`.

---

## اجرای پروژه در محیط локал (Local Development)

پیش‌نیاز: نصب بودن **Node.js** (نسخه ۲۰ یا بالاتر).

```bash
# ۱. نصب وابستگی‌ها
npm install

# ۲. اجرای سرور توسعه روی پورت 3000
npm run dev

# ۳. اجرای تست‌های واحد منطق شبیه‌ساز
npx --yes tsx --test src/utils/concurrencyEngine.test.ts

# ۴. ساخت نسخه نهایی (Production Build)
npm run build
```

---

## راهنمای کامل دیپلوی رایگان در GitHub Pages (گام‌به‌گام)

این پروژه یک برنامه تحت وب استاتیک (Static SPA) مبتنی بر **React + Vite + Tailwind CSS** است و بدون نیاز به هیچ سرور بک‌اند پولی، به‌طور کاملاً رایگان روی **GitHub Pages** قابل انتشار است.

### گام ۱: ساخت مخزن (Repository) در گیت‌هاب و ارسال کدها

ابتدا یک مخزن جدید (مثلاً با نام `swift-concurrency-fa`) در اکانت GitHub خود بسازید و سپس در پوشه پروژه دستورات زیر را اجرا کنید:

```bash
git init
git add .
git commit -m "Initial commit: Interactive Swift Concurrency Persian Guide"
git branch -M main
git remote add origin https://github.com/<USERNAME>/<REPO_NAME>.git
git push -u origin main
```

> **نکته مهم درباره مسیر پایه (`base` در Vite)**:
> اگر آدرس سایت شما به شکل `https://<USERNAME>.github.io/<REPO_NAME>/` است، در دستور Build ورک‌فلوی گیت‌هاب از فلگ `--base=/<REPO_NAME>/` استفاده می‌شود (که در فایل GitHub Actions زیر به‌صورت خودکار تنظیم شده است و نیازی به تغییر دستی کد ندارید!).

---

### گام ۲: ایجاد فایل GitHub Actions برای دیپلوی خودکار

در ریشه پروژه خود، مسیر و فایل `.github/workflows/deploy.yml` را بسازید و محتوای زیر را درون آن قرار دهید:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm install --legacy-peer-deps

      - name: Build static site with dynamic repository base path
        run: npx vite build --base="/${{ github.event.repository.name }}/"

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

سپس این فایل را کامیت و Push کنید:

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Pages automated deployment workflow"
git push
```

---

### گام ۳: فعال‌سازی GitHub Pages در تنظیمات مخزن

1. وارد صفحه مخزن خود در سایت **GitHub** شوید.
2. از منوی بالا روی تب **Settings** کلیک کنید.
3. در نوار کناری سمت چپ، گزینه **Pages** را انتخاب کنید.
4. در بخش **Build and deployment**، زیر عنوان **Source**، گزینه را از `Deploy from a branch` به **`GitHub Actions`** تغییر دهید.
5. به تب **Actions** مخزن بروید؛ خواهید دید که ورک‌فلوی `Deploy to GitHub Pages` اجرا شده و پس از حدود ۴۵ ثانیه تیک سبز می‌خورد و لینک عمومی سایت شما آماده است!

---

## ساختار معماری پروژه

- `src/utils/concurrencyEngine.ts`: موتور محاسباتی خالص (Pure Logic Engine) برای شبیه‌سازی زمان‌بندی `Thread Pool`، محاسبه مسیر بحرانی `async let`، ماشین وضعیت `TaskGroup`، شبیه‌ساز `Actor Reentrancy` و قوانین `Swift 6 Strict Concurrency`.
- `src/utils/concurrencyEngine.test.ts`: مجموعه تست‌های واحد (`node:test`) برای تضمین صحت ریاضی و منطقی تمام شبیه‌سازها.
- `src/components/RichText.tsx`: رندرکننده متن فنی فارسی با جداسازی خودکار عبارات انگلیسی (`BiDi Isolation`) و استایل‌دهی کلمات کلیدی Swift.
- `src/components/ThreadPoolSim.tsx`: آزمایشگاه تعاملی مقایسه `GCD Blocking` و `Swift Cooperative Continuation`.
- `src/components/TimelineComparisonSim.tsx`: شبیه‌ساز گام‌به‌گام `Sequential await` در برابر `Parallel async let`.
- `src/components/TaskGroupTreeSim.tsx`: شبیه‌ساز درختی `Structured Concurrency` و `Cooperative Cancellation`.
- `src/components/ActorIsolationSim.tsx`: آزمایشگاه `Data Race`، صف `Actor Mailbox` و معمای `Actor Reentrancy`.
- `src/components/StrictConcurrencyChecker.tsx`: ممیز تعاملی کدهای `Swift 6` همراه با پنل راهنمای استقرار رایگان در GitHub Pages.
