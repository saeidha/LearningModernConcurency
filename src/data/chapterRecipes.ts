import { PracticalRecipe } from '../components/PracticalRecipeGallery';

export const CHAPTER_1_RECIPES: PracticalRecipe[] = [
  {
    id: 'ch1-cpu-starvation',
    titleFa: 'جلوگیری از قفل شدن استخر رشته‌ها در حلقه‌های سنگین CPU',
    subtitleEn: 'Preventing Cooperative Pool Starvation with Task.yield()',
    antiPatternTitleFa: 'انحصار کامل Thread با حلقه سنکرون سنگین',
    antiPatternCode: `func compressLargeVideo(frames: [RawFrame]) async -> Data {
    var output = Data()
    // ❌ BAD: Tight synchronous loop monopolizes 1 Cooperative Thread
    // for seconds without any Suspension Point!
    for frame in frames {
        output.append(encodeHEVC(frame))
    }
    return output
}`,
    bestPracticeTitleFa: 'همکاری داوطلبانه با زمان‌بند با استفاده از Task.yield()',
    bestPracticeCode: `func compressLargeVideo(frames: [RawFrame]) async throws -> Data {
    var output = Data()
    for (index, frame) in frames.enumerated() {
        // ✅ Check cancellation & yield thread every 25 frames:
        if index.isMultiple(of: 25) {
            try Task.checkCancellation()
            await Task.yield() // Gives other queued Continuations a turn
        }
        output.append(encodeHEVC(frame))
    }
    return output
}`,
    architecturalTakeawayFa:
      'چون تعداد رشته‌های `Cooperative Thread Pool` دقیقاً برابر با هسته‌های `CPU` است، اگر یک تابع `async` بدون هیچ نقطه `await` برای مدت طولانی محاسبات سنگین انجام دهد، سایر تسک‌ها دچار قحطی پردازنده (`Thread Starvation`) می‌شوند. فراخوانی دوره‌ای `await Task.yield()` یک نقطه تعلیق مصنوعی ایجاد می‌کند تا زمان‌بند به سایر کارها نیز نوبت بدهد.',
  },
  {
    id: 'ch1-blocking-semaphore',
    titleFa: 'ممنوعیت مطلق DispatchSemaphore.wait() در توابع async',
    subtitleEn: 'Why Classical Locks & Semaphores Deadlock the Cooperative Pool',
    antiPatternTitleFa: 'ایجاد Deadlock با مسدود کردن رشته مشارکتی',
    antiPatternCode: `func bridgeAsyncToSyncBadly() async {
    let semaphore = DispatchSemaphore(value: 0)
    Task {
        // Might need the very thread that semaphore.wait() is blocking!
        await performNetworkWork()
        semaphore.signal()
    }
    // ❌ DEADLOCK RISK: Blocks the underlying kernel thread!
    semaphore.wait()
}`,
    bestPracticeTitleFa: 'حفظ قرارداد پیشروی (Forward Progress Contract) با await',
    bestPracticeCode: `func performSequentially() async {
    // ✅ Suspends Continuation on Heap without blocking kernel thread:
    await performNetworkWork()
    
    // Or if limiting concurrency count, use an Actor or TaskGroup
    // instead of DispatchSemaphore!
}`,
    architecturalTakeawayFa:
      'قرارداد زمان اجرای سوئیفت (`Runtime Contract`) ایجاب می‌کند که تمام رشته‌های استخر مشارکتی همواره رو به جلو حرکت کنند (`Forward Progress`). استفاده از `semaphore.wait()` یا `pthread_cond_wait` رشته را مسدود کرده و اگر تمام هسته‌ها منتظر تسکی باشند که در صف همان استخر مانده، کل اپلیکیشن دچار `Deadlock` دائمی می‌شود.',
  },
];

export const CHAPTER_2_RECIPES: PracticalRecipe[] = [
  {
    id: 'ch2-dependent-vs-independent',
    titleFa: 'ترکیب هوشمند درخواست‌های وابسته و مستقل در یک تابع',
    subtitleEn: 'Mixing Sequential await and Parallel async let Bindings',
    antiPatternTitleFa: 'اجرای کاملاً ترتیبی تمام مراحل احراز هویت و داشبورد',
    antiPatternCode: `func openStorefront() async throws -> StoreViewData {
    // 1. Must happen first:
    let session = try await authenticateUser()
    // ❌ 2, 3, 4 only depend on 'session', NOT on each other,
    // yet they wait for one another sequentially!
    let cart = try await fetchCart(token: session.token)
    let recommendations = try await fetchRecs(userID: session.userID)
    let banners = try await fetchPromoBanners()
    return StoreViewData(cart, recommendations, banners)
}`,
    bestPracticeTitleFa: 'شروع فوری کارهای مستقل و پایپ‌لاین دو مرحله‌ای',
    bestPracticeCode: `func openStorefront() async throws -> StoreViewData {
    // Public banners don't even need authentication! Start at t=0:
    async let banners = fetchPromoBanners()
    
    // Wait for auth token (Dependency Step 1):
    let session = try await authenticateUser()
    
    // Fan-out parallel child tasks that need 'session':
    async let cart = fetchCart(token: session.token)
    async let recommendations = fetchRecs(userID: session.userID)
    
    return try await StoreViewData(cart, recommendations, banners)
}`,
    architecturalTakeawayFa:
      'پیش از نوشتن `await`، همیشه گراف وابستگی داده‌ها (`Data Dependency Graph`) را رسم کنید: درخواست `banners` در لحظه ورود به تابع آغاز می‌شود، و دو درخواست `cart` و `recommendations` بلافاصله پس از آماده شدن `session` به‌صورت موازی اجرا می‌شوند.',
  },
  {
    id: 'ch2-scoped-cancellation',
    titleFa: 'لغو خودکار متغیرهای async let در صورت خروج زودهنگام',
    subtitleEn: 'Implicit Scoped Cancellation When One Branch Fails',
    antiPatternTitleFa: 'استفاده از Taskهای غیرساختاریافته بدون مدیریت لغو',
    antiPatternCode: `func loadOrderDetails(id: String) async throws {
    // ❌ Unstructured Tasks keep running in background even if
    // validateAccess() throws an error!
    let invoiceTask = Task { try await downloadInvoicePDF(id) }
    let shippingTask = Task { try await trackShipment(id) }
    
    try await validateUserAccess(id) // If this throws, tasks above leak!
    let _ = try await (invoiceTask.value, shippingTask.value)
}`,
    bestPracticeTitleFa: 'استفاده از async let برای تضمین لغو خودکار در خروج از اسکوپ',
    bestPracticeCode: `func loadOrderDetails(id: String) async throws -> (Data, Shipment) {
    async let invoice = downloadInvoicePDF(id)
    async let shipping = trackShipment(id)
    
    // ✅ If validateUserAccess throws, Swift runtime automatically
    // cancels both 'invoice' and 'shipping' and awaits their cleanup!
    try await validateUserAccess(id)
    return try await (invoice, shipping)
}`,
    architecturalTakeawayFa:
      'متغیرهای `async let` به اسکوپ لغوی تابع گره خورده‌اند؛ اگر خطایی پیش از رسیدن به `await` نهایی پرتاب شود، کامپایلر سوئیفت به‌طور ضمنی سیگنال `cancel()` را به تمام `async let`های آن تابع ارسال می‌کند.',
  },
];

export const CHAPTER_3_RECIPES: PracticalRecipe[] = [
  {
    id: 'ch3-bounded-concurrency',
    titleFa: 'محدودسازی تعداد تسک‌های هم‌زمان در TaskGroup (الگوی Windowing)',
    subtitleEn: 'Bounding Maximum Concurrent Child Tasks to Prevent Memory Spikes',
    antiPatternTitleFa: 'ایجاد ۱۰٬۰۰۰ تسک فرزند در یک حلقه بدون سقف هم‌زمانی',
    antiPatternCode: `func resizeAllPhotos(urls: [URL]) async throws -> [UIImage] {
    try await withThrowingTaskGroup(of: UIImage.self) { group in
        // ❌ Spawns 10,000 child tasks simultaneously!
        // Exhausts file descriptors and spikes RAM usage:
        for url in urls {
            group.addTask { try await decodeAndResize(url) }
        }
        var results: [UIImage] = []
        for try await img in group { results.append(img) }
        return results
    }
}`,
    bestPracticeTitleFa: 'الگوی Sliding Window با حداکثر ۴ تسک هم‌زمان',
    bestPracticeCode: `func resizeAllPhotos(urls: [URL], maxConcurrent: Int = 4) async throws -> [UIImage] {
    try await withThrowingTaskGroup(of: UIImage.self) { group in
        var index = 0
        // 1. Seed initial window of up to 'maxConcurrent' tasks:
        for _ in 0..<min(maxConcurrent, urls.count) {
            let url = urls[index]; index += 1
            group.addTask { try await decodeAndResize(url) }
        }
        var results: [UIImage] = []
        // 2. As each task finishes, enqueue the next URL:
        while let img = try await group.next() {
            results.append(img)
            if index < urls.count {
                let url = urls[index]; index += 1
                group.addTask { try await decodeAndResize(url) }
            }
        }
        return results
    }
}`,
    architecturalTakeawayFa:
      'فراخوانی بی‌رویه `group.addTask` در یک حلقه بزرگ، هزاران رکورد در `Heap` ایجاد کرده و سرور مقصد را با خطای `HTTP 429 Too Many Requests` مواجه می‌کند. با الگوی `Sliding Window`، تنها زمانی یک `addTask` جدید صدا زده می‌شود که یکی از تسک‌های قبلی با `group.next()` کارش تمام شده باشد.',
  },
  {
    id: 'ch3-order-preservation',
    titleFa: 'حفظ ترتیب عناصر خروجی در اجرای موازی TaskGroup',
    subtitleEn: 'Preserving Input Array Order with Indexed Tuple Results',
    antiPatternTitleFa: 'فرض نادرستِ ترتیب تکمیل برابر با ترتیب افزودن تسک‌ها',
    antiPatternCode: `func fetchChapters(ids: [Int]) async throws -> [Chapter] {
    try await withThrowingTaskGroup(of: Chapter.self) { group in
        for id in ids {
            group.addTask { try await api.loadChapter(id) }
        }
        var chapters: [Chapter] = []
        // ❌ BUG: group yields results in COMPLETION order (fastest first),
        // NOT in the original 'ids' array order!
        for try await ch in group { chapters.append(ch) }
        return chapters
    }
}`,
    bestPracticeTitleFa: 'بازگرداندن تاپل (index, value) برای چیدمان دقیق در آرایه مقصد',
    bestPracticeCode: `func fetchChapters(ids: [Int]) async throws -> [Chapter] {
    try await withThrowingTaskGroup(of: (Int, Chapter).self) { group in
        for (index, id) in ids.enumerated() {
            group.addTask { (index, try await api.loadChapter(id)) }
        }
        var ordered = Array<Chapter?>(repeating: nil, count: ids.count)
        for try await (index, chapter) in group {
            ordered[index] = chapter
        }
        return ordered.compactMap { $0 }
    }
}`,
    architecturalTakeawayFa:
      'حلقه `for try await result in group` نتایج را به ترتیب زمان آماده شدن (`Completion Order`) تحویل می‌دهد، نه ترتیب فراخوانی `addTask`. با بازگرداندن تاپل `(Int, Element)`، هم از سرعت اجرای موازی بهره می‌برید و هم ترتیب دقیق اولیه را حفظ می‌کنید.',
  },
];

export const CHAPTER_4_RECIPES: PracticalRecipe[] = [
  {
    id: 'ch4-image-cache-dedup',
    titleFa: 'حذف درخواست‌های تکراری در کش تصویر با الگوی In-Flight Task در Actor',
    subtitleEn: 'Solving Actor Reentrancy Duplicate Downloads via Task Caching',
    antiPatternTitleFa: 'دانلود چندباره یک URL به دلیل تعلیق در نقطه await',
    antiPatternCode: `actor AvatarCache {
    private var cache: [URL: UIImage] = [:]
    
    func image(for url: URL) async throws -> UIImage {
        if let existing = cache[url] { return existing }
        // ❌ REENTRANCY BUG: If 5 views request the same URL at once,
        // all 5 pass the 'if' check while the 1st is suspended here!
        let downloaded = try await network.fetchImage(url)
        cache[url] = downloaded
        return downloaded
    }
}`,
    bestPracticeTitleFa: 'ذخیره وضعیت In-Flight با enum پیش از رسیدن به await',
    bestPracticeCode: `actor AvatarCache {
    private enum Entry {
        case inFlight(Task<UIImage, Error>)
        case ready(UIImage)
    }
    private var cache: [URL: Entry] = [:]
    
    func image(for url: URL) async throws -> UIImage {
        if let entry = cache[url] {
            switch entry {
            case .ready(let img): return img
            case .inFlight(let task): return try await task.value // Coalesce!
            }
        }
        let task = Task { try await network.fetchImage(url) }
        // ✅ Stored synchronously BEFORE awaiting!
        cache[url] = .inFlight(task)
        do {
            let img = try await task.value
            cache[url] = .ready(img)
            return img
        } catch {
            cache[url] = nil // Evict failed attempt
            throw error
        }
    }
}`,
    architecturalTakeawayFa:
      'این الگو (معروف به `Request Deduplication` در مستندات اپل) یکی از مهم‌ترین کاربردهای واقعی `actor` است: با ذخیره `case .inFlight(Task)` پیش از نقطه `await`، اگر ۱۰ کامپوننت رابط کاربری در یک میلی‌ثانیه یک آواتار واحد را بخواهند، تنها ۱ درخواست شبکه ارسال شده و هر ۱۰ کامپوننت روی نتیجه همان `Task` منتظر می‌مانند.',
  },
  {
    id: 'ch4-nonisolated-computed',
    titleFa: 'حذف awaitهای غیرضروری با کلمه کلیدی nonisolated',
    subtitleEn: 'Exposing Immutable Actor Properties Synchronously via nonisolated',
    antiPatternTitleFa: 'اجبار فراخوانی‌کننده به استفاده از await برای خواندن ثوابت',
    antiPatternCode: `actor DatabaseConnection {
    let databaseName: String
    let schemaVersion: Int
    
    init(name: String, version: Int) {
        self.databaseName = name
        self.schemaVersion = version
    }
    // ❌ External callers must write 'await db.connectionTag()'
    // even though it only reads immutable 'let' constants!
    func connectionTag() -> String {
        "\\(databaseName)_v\\(schemaVersion)"
    }
}`,
    bestPracticeTitleFa: 'علامت‌گذاری متدهای مبتنی بر let با nonisolated',
    bestPracticeCode: `actor DatabaseConnection: CustomStringConvertible {
    let databaseName: String
    let schemaVersion: Int
    
    init(name: String, version: Int) {
        self.databaseName = name
        self.schemaVersion = version
    }
    // ✅ Can be called synchronously without 'await' from any thread:
    nonisolated var description: String {
        "\\(databaseName)_v\\(schemaVersion)"
    }
}`,
    architecturalTakeawayFa:
      'پراپرتی‌های ثابت (`let`) از نوع `Sendable` درون یک `actor` هرگز پس از `init` تغییر نمی‌کنند؛ بنابراین با افزودن کلمه کلیدی `nonisolated` به متدها یا پراپرتی‌های محاسباتی که فقط به مقادیر `let` وابسته‌اند، سربار صف پیام `Actor` و نیاز به `await` را کاملاً حذف می‌کنید.',
  },
];

export const CHAPTER_5_RECIPES: PracticalRecipe[] = [
  {
    id: 'ch5-idempotent-gate',
    titleFa: 'محافظت از Delegateهای چندباره با پرچم یک‌بارمصرف در Continuation',
    subtitleEn: 'Guarding Multi-Fire Delegates with an Optional Continuation Slot',
    antiPatternTitleFa: 'نگهداری مستقیم Continuation بدون صفر کردن مرجع پس از مصرف',
    antiPatternCode: `final class BluetoothScanner: NSObject, CBCentralManagerDelegate {
    var continuation: CheckedContinuation<CBPeripheral, Error>?
    
    func centralManager(_ central: CBCentralManager, didDiscover p: CBPeripheral) {
        // ❌ CRASHES on 2nd discovered peripheral!
        continuation?.resume(returning: p)
    }
}`,
    bestPracticeTitleFa: 'مصرف و nil کردن اتمیک Continuation در اولین رویداد',
    bestPracticeCode: `final class BluetoothScanner: NSObject, CBCentralManagerDelegate {
    private var continuation: CheckedContinuation<CBPeripheral, Error>?
    
    func centralManager(_ central: CBCentralManager, didDiscover p: CBPeripheral) {
        // ✅ Take and nil-out slot immediately so subsequent calls are no-ops:
        guard let cont = self.continuation else { return }
        self.continuation = nil
        central.stopScan()
        cont.resume(returning: p)
    }
}`,
    architecturalTakeawayFa:
      'هرگاه یک API قدیمی مبتنی بر `Delegate` (مانند `CoreBluetooth` یا `CoreLocation`) را با `withCheckedContinuation` به یک تابع `async` تک‌مقداری تبدیل می‌کنید، بلافاصله پیش از فراخوانی `resume`، متغیر ذخیره‌کننده `continuation` را برابر `nil` قرار دهید تا فراخوانی‌های بعدیِ Delegate باعث کرش `CONTINUATION MISUSE` نشوند.',
  },
  {
    id: 'ch5-cancellation-handler',
    titleFa: 'پشتیبانی از لغو تسک در زمان تعلیق با withTaskCancellationHandler',
    subtitleEn: 'Wiring Task Cancellation into Legacy Continuation Wrappers',
    antiPatternTitleFa: 'عدم اطلاع‌رسانی لغو Task به درخواست شبکه قدیمی',
    antiPatternCode: `func downloadLegacyFile(url: URL) async throws -> Data {
    // ❌ If parent Task is cancelled while waiting, legacyTask keeps
    // downloading in the background and wastes bandwidth!
    return try await withCheckedThrowingContinuation { cont in
        let legacyTask = LegacyDownloader.start(url) { result in
            cont.resume(with: result)
        }
    }
}`,
    bestPracticeTitleFa: 'ترکیب withTaskCancellationHandler با CheckedContinuation',
    bestPracticeCode: `func downloadLegacyFile(url: URL) async throws -> Data {
    let token = LegacyCancellationToken()
    return try await withTaskCancellationHandler {
        try await withCheckedThrowingContinuation { cont in
            LegacyDownloader.start(url, token: token) { result in
                cont.resume(with: result)
            }
        }
    } onCancel: {
        // ✅ Runs immediately when Task.cancel() is triggered!
        token.abortNetworkRequest()
    }
}`,
    architecturalTakeawayFa:
      'بلوک `withCheckedContinuation` به‌خودی‌خود نمی‌داند چگونه کتابخانه قدیمی شما را متوقف کند! با قرار دادن آن درون `withTaskCancellationHandler`، به محض اینکه تسک فراخوانی‌کننده Cancel شود، کلوژر `onCancel` بلافاصله اجرا شده و عملیات زیربنایی را متوقف می‌سازد.',
  },
];

export const CHAPTER_6_RECIPES: PracticalRecipe[] = [
  {
    id: 'ch6-notification-center',
    titleFa: 'گوش دادن به رویدادهای سیستم با NotificationCenter.notifications',
    subtitleEn: 'Replacing NotificationCenter Observers with AsyncSequence Loops',
    antiPatternTitleFa: 'مدیریت دستی addObserver و فراموشی removeObserver',
    antiPatternCode: `final class KeyboardTracker {
    private var token: NSObjectProtocol?
    func start() {
        // ❌ Boilerplate token management & weak self dance:
        token = NotificationCenter.default.addObserver(
            forName: UIResponder.keyboardWillShowNotification,
            object: nil, queue: .main
        ) { [weak self] note in
            self?.handleKeyboard(note)
        }
    }
}`,
    bestPracticeTitleFa: 'حلقه ساختاریافته for await با لغو خودکار همراه با عمر View',
    bestPracticeCode: `func observeKeyboardEvents() async {
    let notifications = NotificationCenter.default.notifications(
        named: UIResponder.keyboardWillShowNotification
    )
    // ✅ Automatically unsubscribes when the enclosing Task is cancelled
    // (e.g. inside SwiftUI's .task { await observeKeyboardEvents() }):
    for await notification in notifications {
        await handleKeyboardOnMain(notification)
    }
}`,
    architecturalTakeawayFa:
      'با استفاده از `AsyncSequence` و مودیفایر `.task {}` در SwiftUI، به محض بسته شدن صفحه (`View Disappear`)، تسک لغو شده و حلقه `for await` به‌طور خودکار اشتراک `NotificationCenter` را پاک‌سازی می‌کند.',
  },
  {
    id: 'ch6-termination-cleanup',
    titleFa: 'جلوگیری از نشت حافظه در AsyncStream با onTermination',
    subtitleEn: 'Cleaning Up External Timers & Sockets via continuation.onTermination',
    antiPatternTitleFa: 'رها کردن Timer یا WebSocket پس از خروج مصرف‌کننده از حلقه',
    antiPatternCode: `func makeHeartbeatStream() -> AsyncStream<Date> {
    AsyncStream { continuation in
        // ❌ LEAK: If caller breaks out of 'for await' loop early,
        // this Timer keeps firing forever in the background!
        Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            continuation.yield(Date())
        }
    }
}`,
    bestPracticeTitleFa: 'ثبت هندلر پاک‌سازی در continuation.onTermination',
    bestPracticeCode: `func makeHeartbeatStream() -> AsyncStream<Date> {
    AsyncStream { continuation in
        let timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            continuation.yield(Date())
        }
        // ✅ Invoked both on continuation.finish() AND when consumer
        // cancels or breaks out of the 'for await' loop:
        continuation.onTermination = { @Sendable _ in
            timer.invalidate()
        }
    }
}`,
    architecturalTakeawayFa:
      'هرگاه درون `AsyncStream` یک منبع خارجی (مانند `Timer`، `WebSocket` یا `FileHandle`) باز می‌کنید، حتماً منطق بستن آن را در `continuation.onTermination` قرار دهید؛ این کلوژر حتی اگر مصرف‌کننده با دستور `break` از حلقه `for await` خارج شود، فراخوانی می‌گردد.',
  },
];

export const CHAPTER_8_RECIPES: PracticalRecipe[] = [
  {
    id: 'ch8-swiftui-task-id',
    titleFa: 'الگوی جستجوی زنده (Debounced Search) با مودیفایر .task(id:) در SwiftUI',
    subtitleEn: 'Automatic Cancellation & Debouncing with SwiftUI .task(id:) and Task.sleep',
    antiPatternTitleFa: 'ساخت Task دستی در onChange بدون لغو درخواست قبلی (Race Condition)',
    antiPatternCode: `.onChange(of: searchQuery) { newQuery in
    // ❌ RACE CONDITION: If user types "Swi" then "Swift",
    // slow response for "Swi" might arrive AFTER "Swift" and overwrite UI!
    Task {
        self.results = try await api.search(newQuery)
    }
}`,
    bestPracticeTitleFa: 'لغو خودکار تایپ قبلی با .task(id:) و Task.sleep(for:)',
    bestPracticeCode: `.task(id: searchQuery) {
    guard !searchQuery.isEmpty else { self.results = []; return }
    do {
        // ✅ 1. Debounce 300ms: throws CancellationError if user types next char!
        try await Task.sleep(for: .milliseconds(300))
        // ✅ 2. If searchQuery changes during network call, URLSession is cancelled:
        self.results = try await api.search(searchQuery)
    } catch is CancellationError {
        // Expected cancellation on rapid keystrokes; safely ignore
    } catch {
        self.errorMessage = error.localizedDescription
    }
}`,
    architecturalTakeawayFa:
      'مودیفایر `.task(id: searchQuery)` در SwiftUI یک شاهکار مهندسی است: به محض تغییر `searchQuery`، تسک قبلی را Cancel کرده و تسک جدیدی آغاز می‌کند. ترکیب آن با `try await Task.sleep(for: .milliseconds(300))` بدون نیاز به Combine، یک `Debounce` کامل و عاری از `Race Condition` می‌سازد.',
  },
  {
    id: 'ch8-task-local-tracing',
    titleFa: 'ردیابی توزیع‌شده درخواست‌ها بدون تغییر امضای توابع با @TaskLocal',
    subtitleEn: 'Propagating Request Trace IDs Implicitly Across Child Tasks via @TaskLocal',
    antiPatternTitleFa: 'مرور دستی پارامتر traceID در تمام لایه‌های برنامه (Context Drilling)',
    antiPatternCode: `// ❌ Pollutes every single function signature across 10 layers:
func checkout(cart: Cart, traceID: String) async throws {
    try await validateInventory(cart, traceID: traceID)
    try await chargeCard(cart, traceID: traceID)
}`,
    bestPracticeTitleFa: 'تزریق زمینه‌ای و ارث‌بری خودکار در درخت وظایف با @TaskLocal',
    bestPracticeCode: `enum RequestContext {
    @TaskLocal static var traceID: String = "anonymous"
}

func handleCheckout(cart: Cart) async throws {
    // ✅ Bound for this lexical scope AND inherited by all async let / TaskGroup children:
    try await RequestContext.$traceID.withValue("REQ-98412") {
        async let inv = validateInventory(cart) // Reads RequestContext.traceID == "REQ-98412"
        async let pay = chargeCard(cart)        // Reads RequestContext.traceID == "REQ-98412"
        _ = try await (inv, pay)
    }
}`,
    architecturalTakeawayFa:
      'متغیرهای `@TaskLocal` (`SE-0311`) نسخه امن و ساختاریافته `Thread-Local Storage` هستند؛ مقدار تنظیم‌شده با `.withValue(...)` به‌طور خودکار به تمام `Child Task`های ایجادشده با `async let`، `TaskGroup` و `Task {}` به ارث می‌رسد.',
  },
  {
    id: 'ch8-dependency-injected-clock',
    titleFa: 'تست‌پذیری قطعی کدهای زمان‌دار با پروتکل Clock و ContinuousClock',
    subtitleEn: 'Deterministic Unit Testing of Time-Based Async Logic via Swift Clock Protocol',
    antiPatternTitleFa: 'وابستگی مستقیم به زمان واقعی در تست‌های واحد (کند و شکننده)',
    antiPatternCode: `func retryWithBackoff<T>(operation: () async throws -> T) async throws -> T {
    for attempt in 1...3 {
        do { return try await operation() }
        catch {
            // ❌ Hardcoded wall-clock sleep makes unit tests take 6+ seconds!
            try await Task.sleep(nanoseconds: 2_000_000_000)
        }
    }
    return try await operation()
}`,
    bestPracticeTitleFa: 'تزریق جنریک Clock<Duration> برای اجرای فوری در محیط تست',
    bestPracticeCode: `func retryWithBackoff<C: Clock, T>(
    clock: C = ContinuousClock(),
    operation: () async throws -> T
) async throws -> T where C.Duration == Duration {
    for _ in 1...3 {
        do { return try await operation() }
        catch {
            // ✅ In production uses ContinuousClock; in tests pass ImmediateClock!
            try await clock.sleep(for: .seconds(2))
        }
    }
    return try await operation()
}`,
    architecturalTakeawayFa:
      'پروتکل `Clock` (`SE-0329`) در سوئیفت دو پیاده‌سازی استاندارد دارد: `ContinuousClock` (که در زمان Sleep دستگاه متوقف می‌شود) و `SuspendingClock`. با دریافت `clock: some Clock` در ورودی تابع، می‌توانید در تست‌های واحد یک `TestClock` فوری پاس دهید تا تست‌های زمان‌دار در کمتر از ۱ میلی‌ثانیه اجرا شوند.',
  },
];
