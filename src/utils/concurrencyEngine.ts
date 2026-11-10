/**
 * Pure simulation logic for Swift Concurrency interactive visualizers.
 * Decoupled from React UI for fast, deterministic unit testing.
 */

export type ConcurrencyRuntimeMode = 'gcd-blocking' | 'swift-cooperative';

export interface ThreadPoolMetrics {
  mode: ConcurrencyRuntimeMode;
  cpuCores: number;
  incomingTasks: number;
  activeThreadsCreated: number;
  blockedThreads: number;
  suspendedContinuationsInHeap: number;
  contextSwitchOverheadScore: number; // 0 to 100
  memoryFootprintKB: number;
  statusLevel: 'nominal' | 'elevated' | 'critical';
  statusLabelEn: 'NOMINAL' | 'ELEVATED' | 'THREAD EXPLOSION';
  summaryFa: string;
}

/**
 * Calculates thread allocation, memory footprint (stack vs heap continuation),
 * and context-switch overhead between legacy GCD blocking queues and Swift's
 * Cooperative Thread Pool.
 */
export function calculateThreadPoolMetrics(
  mode: ConcurrencyRuntimeMode,
  cpuCores: number,
  incomingTasks: number
): ThreadPoolMetrics {
  const safeCores = Math.max(1, Math.min(16, cpuCores));
  const safeTasks = Math.max(1, Math.min(200, incomingTasks));

  if (mode === 'gcd-blocking') {
    // GCD spawns new kernel threads when existing threads block on I/O semaphore/locks,
    // up to high thread limits, with ~512KB stack per kernel thread.
    const activeThreadsCreated = Math.min(64, Math.max(safeCores, safeTasks));
    const blockedThreads = Math.max(0, activeThreadsCreated - safeCores);
    const memoryFootprintKB = activeThreadsCreated * 512;
    const contextSwitchOverheadScore = Math.min(
      100,
      Math.round((activeThreadsCreated / safeCores) * 18)
    );

    const isCritical = activeThreadsCreated > safeCores * 3;
    const isElevated = activeThreadsCreated > safeCores;

    return {
      mode,
      cpuCores: safeCores,
      incomingTasks: safeTasks,
      activeThreadsCreated,
      blockedThreads,
      suspendedContinuationsInHeap: 0,
      contextSwitchOverheadScore,
      memoryFootprintKB,
      statusLevel: isCritical ? 'critical' : isElevated ? 'elevated' : 'nominal',
      statusLabelEn: isCritical
        ? 'THREAD EXPLOSION'
        : isElevated
        ? 'ELEVATED'
        : 'NOMINAL',
      summaryFa: isCritical
        ? `ایجاد ${activeThreadsCreated} رشته کرنل برای ${safeCores} هسته پردازنده؛ وقوع پدیده \`Thread Explosion\` و سربار سنگین \`Context Switch\`.`
        : `هر تسک منتظر ورودی/خروجی یک \`Thread\` سیستم‌عامل را مسدود (\`Block\`) نگه داشته است.`,
    };
  }

  // Swift Cooperative Thread Pool:
  // Width is strictly bounded to CPU core count. Waiting tasks become lightweight
  // AsyncFrame / Continuation records on the heap (~4KB each) with zero blocked kernel threads.
  const activeThreadsCreated = Math.min(safeCores, safeTasks);
  const suspendedContinuationsInHeap = Math.max(0, safeTasks - activeThreadsCreated);
  const memoryFootprintKB = activeThreadsCreated * 512 + suspendedContinuationsInHeap * 4;
  const contextSwitchOverheadScore = Math.min(
    15,
    Math.max(2, Math.round((activeThreadsCreated / safeCores) * 8))
  );

  return {
    mode,
    cpuCores: safeCores,
    incomingTasks: safeTasks,
    activeThreadsCreated,
    blockedThreads: 0,
    suspendedContinuationsInHeap,
    contextSwitchOverheadScore,
    memoryFootprintKB,
    statusLevel: 'nominal',
    statusLabelEn: 'NOMINAL',
    summaryFa: `حداکثر ${activeThreadsCreated} رشته هم‌اندازه هسته‌های \`CPU\` فعال است و ${suspendedContinuationsInHeap} تسک در نقطه \`await\` به‌صورت \`Continuation\` سبک در \`Heap\` معلق شده‌اند بدون مسدودسازی \`Thread\`.`,
  };
}

export interface AsyncEndpointSpec {
  id: string;
  name: string;
  swiftCall: string;
  durationMs: number;
  colorClass: string;
}

export interface ScheduledTaskBar {
  id: string;
  name: string;
  swiftCall: string;
  startMs: number;
  endMs: number;
  durationMs: number;
  lane: number;
  colorClass: string;
}

export interface TimelineScheduleResult {
  executionMode: 'sequential-await' | 'parallel-async-let';
  totalDurationMs: number;
  speedupFactor: number;
  bars: ScheduledTaskBar[];
  codeSteps: {
    timeMs: number;
    lineNumber: number;
    explanationFa: string;
    technicalStateEn: string;
  }[];
}

/**
 * Computes exact execution schedule for sequential `await` vs parallel `async let`
 * bindings in Swift.
 */
export function computeTimelineSchedule(
  executionMode: 'sequential-await' | 'parallel-async-let',
  endpoints: AsyncEndpointSpec[]
): TimelineScheduleResult {
  const sequentialSum = endpoints.reduce((acc, ep) => acc + ep.durationMs, 0);
  const maxSingle = endpoints.reduce((acc, ep) => Math.max(acc, ep.durationMs), 0);

  if (executionMode === 'sequential-await') {
    let cursor = 0;
    const bars: ScheduledTaskBar[] = [];
    const codeSteps: TimelineScheduleResult['codeSteps'] = [
      {
        timeMs: 0,
        lineNumber: 1,
        explanationFa: 'ورود به تابع async؛ اجرای خط اول و رسیدن به اولین نقطه تعلیق (Suspension Point).',
        technicalStateEn: 'Enter loadDashboard() -> Suspend at first await',
      },
    ];

    endpoints.forEach((ep, idx) => {
      const startMs = cursor;
      const endMs = cursor + ep.durationMs;
      bars.push({
        id: ep.id,
        name: ep.name,
        swiftCall: ep.swiftCall,
        startMs,
        endMs,
        durationMs: ep.durationMs,
        lane: 0,
        colorClass: ep.colorClass,
      });
      cursor = endMs;
      codeSteps.push({
        timeMs: endMs,
        lineNumber: idx + 2,
        explanationFa: `تکمیل ${ep.name} پس از ${ep.durationMs}ms؛ تابع در Continuation بیدار شده و تازه درخواست بعدی را آغاز می‌کند.`,
        technicalStateEn: `Resume Continuation #${idx + 1} (${ep.id} completed at ${endMs}ms)`,
      });
    });

    return {
      executionMode,
      totalDurationMs: sequentialSum,
      speedupFactor: 1.0,
      bars,
      codeSteps,
    };
  }

  // Parallel `async let`: all child tasks spawn immediately at t=0 on separate lanes
  const bars: ScheduledTaskBar[] = endpoints.map((ep, idx) => ({
    id: ep.id,
    name: ep.name,
    swiftCall: ep.swiftCall,
    startMs: 0,
    endMs: ep.durationMs,
    durationMs: ep.durationMs,
    lane: idx,
    colorClass: ep.colorClass,
  }));

  const sortedByCompletion = [...endpoints].sort((a, b) => a.durationMs - b.durationMs);
  const codeSteps: TimelineScheduleResult['codeSteps'] = [
    {
      timeMs: 0,
      lineNumber: 2,
      explanationFa:
        'تعریف سه عبارت async let؛ هر سه Child Task بلافاصله در پس‌زمینه (بدون توقف در خط تعریف) شروع به اجرا می‌کنند.',
      technicalStateEn: 'Spawn 3 Structured Child Tasks immediately (t = 0ms)',
    },
    ...sortedByCompletion.map((ep, idx) => ({
      timeMs: ep.durationMs,
      lineNumber: 5,
      explanationFa: `اماده شدن نتیجه ${ep.name} در لحظه ${ep.durationMs}ms در بافر Child Task.`,
      technicalStateEn: `Child Task [${ep.id}] fulfilled at ${ep.durationMs}ms`,
    })),
    {
      timeMs: maxSingle,
      lineNumber: 6,
      explanationFa: `عبور از عبارت try await (profile, feed, stats) به محض آماده شدن کندترین درخواست (${maxSingle}ms).`,
      technicalStateEn: `Tuple await resolved in ${maxSingle}ms (vs ${sequentialSum}ms sequential)`,
    },
  ];

  const speedupFactor =
    maxSingle > 0 ? Number((sequentialSum / maxSingle).toFixed(2)) : 1.0;

  return {
    executionMode,
    totalDurationMs: maxSingle,
    speedupFactor,
    bars,
    codeSteps,
  };
}

export type ChildTaskStatus = 'running' | 'completed' | 'failed' | 'cancelled';

export interface StructuredChildNode {
  id: string;
  title: string;
  durationMs: number;
  willThrowError: boolean;
  status: ChildTaskStatus;
  completedAtMs: number | null;
  statusNoteFa: string;
}

export interface TaskGroupSimulationOutcome {
  parentStatus: 'completed' | 'thrown-error' | 'cancelled';
  totalElapsedMs: number;
  children: StructuredChildNode[];
  structuredGuaranteeFa: string;
}

/**
 * Simulates Swift's `withThrowingTaskGroup` structured lifecycle:
 * - If any child throws an error at t_err, the group automatically triggers
 *   `group.cancelAll()` on all remaining running sibling tasks (`Task.isCancelled == true`),
 *   and the parent scope never leaks orphan background tasks.
 */
export function simulateTaskGroupExecution(
  childrenSpecs: {
    id: string;
    title: string;
    durationMs: number;
    willThrowError: boolean;
  }[],
  manualCancelAtMs?: number | null
): TaskGroupSimulationOutcome {
  // Determine earliest failure time if any child throws
  const throwingTimes = childrenSpecs
    .filter((c) => c.willThrowError)
    .map((c) => Math.round(c.durationMs * 0.5)); // fails halfway through its duration

  const earliestThrowMs =
    throwingTimes.length > 0 ? Math.min(...throwingTimes) : null;

  const effectiveCancelCutoffMs =
    manualCancelAtMs != null && manualCancelAtMs > 0
      ? earliestThrowMs != null
        ? Math.min(manualCancelAtMs, earliestThrowMs)
        : manualCancelAtMs
      : earliestThrowMs;

  const children: StructuredChildNode[] = childrenSpecs.map((spec) => {
    const throwTime = spec.willThrowError ? Math.round(spec.durationMs * 0.5) : null;

    if (
      throwTime != null &&
      effectiveCancelCutoffMs != null &&
      throwTime === effectiveCancelCutoffMs &&
      (manualCancelAtMs == null || throwTime <= manualCancelAtMs)
    ) {
      return {
        ...spec,
        status: 'failed',
        completedAtMs: throwTime,
        statusNoteFa: `پرتاب خطا در ${throwTime}ms -> فراخوانی خودکار group.cancelAll()`,
      };
    }

    if (
      effectiveCancelCutoffMs != null &&
      spec.durationMs > effectiveCancelCutoffMs
    ) {
      return {
        ...spec,
        status: 'cancelled',
        completedAtMs: effectiveCancelCutoffMs,
        statusNoteFa: `دریافت سیگنال Task.isCancelled در ${effectiveCancelCutoffMs}ms و توقف ایمن`,
      };
    }

    return {
      ...spec,
      status: 'completed',
      completedAtMs: spec.durationMs,
      statusNoteFa: `تکمیل موفقیت‌آمیز در ${spec.durationMs}ms`,
    };
  });

  const totalElapsedMs = children.reduce(
    (max, c) => Math.max(max, c.completedAtMs ?? 0),
    0
  );

  const hasFailed = children.some((c) => c.status === 'failed');
  const hasCancelled = children.some((c) => c.status === 'cancelled');

  const parentStatus: TaskGroupSimulationOutcome['parentStatus'] = hasFailed
    ? 'thrown-error'
    : hasCancelled
    ? 'cancelled'
    : 'completed';

  const structuredGuaranteeFa = hasFailed
    ? 'به محض پرتاب خطا در یکی از فرزندان، `TaskGroup` به صورت خودکار پرچم `Task.isCancelled` را برای سایر فرزندان در حال اجرا فعال کرد و هیچ تسک سرگردانی (`Leaked Task`) خارج از اسکوپ باقی نماند.'
    : hasCancelled
    ? 'با لغو والد، سیگنال `Cooperative Cancellation` به تمام زیرشاخه‌های درخت منتقل شد و خروج از بلوک فقط پس از پاک‌سازی کامل فرزندان رخ داد.'
    : 'تمام `Child Task`ها پیش از خروج از بلوک `withThrowingTaskGroup` با موفقیت تجمیع شدند (تضمین حیات سلسله‌مراتبی).';

  return {
    parentStatus,
    totalElapsedMs,
    children,
    structuredGuaranteeFa,
  };
}

export type ActorProtectionMode =
  | 'unsafe-class'
  | 'isolated-actor'
  | 'actor-reentrancy-bug'
  | 'actor-reentrancy-fixed';

export interface ConcurrentTransactionStep {
  stepIndex: number;
  actorOrThread: string;
  operationEn: string;
  balanceSnapshot: number;
  explanationFa: string;
  isAnomaly: boolean;
}

export interface ActorSimulationResult {
  mode: ActorProtectionMode;
  initialBalance: number;
  withdrawalA: number;
  withdrawalB: number;
  finalBalance: number;
  totalWithdrawn: number;
  hasDataRaceOrLogicBug: boolean;
  steps: ConcurrentTransactionStep[];
  verdictFa: string;
}

/**
 * Simulates concurrent bank withdrawal or cache operations across:
 * 1. Unsafe `class` (Data Race / lost update or double withdrawal)
 * 2. Isolated `actor` synchronous method (Serialized Mailbox, safe)
 * 3. `actor` with `await` between check and state mutation (Actor Reentrancy trap!)
 * 4. `actor` with state mutation before `await` (Reentrancy-safe pattern)
 */
export function simulateActorIsolation(
  mode: ActorProtectionMode,
  initialBalance: number = 100,
  withdrawalA: number = 80,
  withdrawalB: number = 80
): ActorSimulationResult {
  if (mode === 'unsafe-class') {
    // Both threads read balance = 100 simultaneously without synchronization
    const finalBalance = initialBalance - withdrawalB; // overwritten / corrupted state
    const totalWithdrawn = withdrawalA + withdrawalB;
    return {
      mode,
      initialBalance,
      withdrawalA,
      withdrawalB,
      finalBalance,
      totalWithdrawn,
      hasDataRaceOrLogicBug: true,
      verdictFa:
        'خطای بحرانی `Data Race`: دو `Thread` هم‌زمان فیلد `var balance` را خوانده و نوشتند. علاوه بر برداشت غیرمجاز ۱۶۰ واحد از موجودی ۱۰۰ واحدی، حافظه دچار `Memory Corruption` شد.',
      steps: [
        {
          stepIndex: 1,
          actorOrThread: 'Thread 1 & Thread 2',
          operationEn: 'READ balance == 100 (Concurrent Unsynchronized Read)',
          balanceSnapshot: initialBalance,
          explanationFa: 'هر دو `Thread` در یک لحظه موجودی ۱۰۰ را می‌خوانند و شرط `balance >= 80` برای هر دو برقرار می‌شود!',
          isAnomaly: true,
        },
        {
          stepIndex: 2,
          actorOrThread: 'Thread 1',
          operationEn: `WRITE balance = 100 - ${withdrawalA}`,
          balanceSnapshot: initialBalance - withdrawalA,
          explanationFa: 'رشته اول مقدار ۲۰ را در حافظه می‌نویسد.',
          isAnomaly: false,
        },
        {
          stepIndex: 3,
          actorOrThread: 'Thread 2',
          operationEn: `WRITE balance = 100 - ${withdrawalB} (Overwrites Thread 1!)`,
          balanceSnapshot: finalBalance,
          explanationFa: 'رشته دوم هم بر اساس خوانش قدیمی (۱۰۰) مقدار را بازنویسی می‌کند؛ رخداد `Data Race` و برداشت مضاعف!',
          isAnomaly: true,
        },
      ],
    };
  }

  if (mode === 'isolated-actor') {
    const afterA = initialBalance - withdrawalA;
    const canBWithdraw = afterA >= withdrawalB;
    const finalBalance = canBWithdraw ? afterA - withdrawalB : afterA;
    const totalWithdrawn = withdrawalA + (canBWithdraw ? withdrawalB : 0);

    return {
      mode,
      initialBalance,
      withdrawalA,
      withdrawalB,
      finalBalance,
      totalWithdrawn,
      hasDataRaceOrLogicBug: false,
      verdictFa:
        'ایزولاسیون کامل با `Actor Mailbox`: پیام‌ها به‌صورت سریالی (`Serial Executor`) یکی‌پس‌ازدیگری پردازش شدند. درخواست دوم موجودیِ به‌روزشده (۲۰) را دید و به‌درستی رد شد.',
      steps: [
        {
          stepIndex: 1,
          actorOrThread: 'Actor Mailbox (Task A)',
          operationEn: `guard balance (100) >= ${withdrawalA} -> balance -= ${withdrawalA}`,
          balanceSnapshot: afterA,
          explanationFa: 'پیام اول وارد بخش ایزوله `Actor` می‌شود، موجودی به ۲۰ کاهش می‌یابد و اجرای متد کامل می‌شود.',
          isAnomaly: false,
        },
        {
          stepIndex: 2,
          actorOrThread: 'Actor Mailbox (Task B)',
          operationEn: `guard balance (${afterA}) >= ${withdrawalB} -> false (Rejected)`,
          balanceSnapshot: finalBalance,
          explanationFa: 'پیام دوم از صف `Mailbox` خارج شده و موجودی واقعی (۲۰) را می‌بیند؛ تراکنش غیرمجاز با ایمنی کامل رد می‌شود.',
          isAnomaly: false,
        },
      ],
    };
  }

  if (mode === 'actor-reentrancy-bug') {
    const finalBalance = initialBalance - withdrawalA - withdrawalB;
    const totalWithdrawn = withdrawalA + withdrawalB;
    return {
      mode,
      initialBalance,
      withdrawalA,
      withdrawalB,
      finalBalance,
      totalWithdrawn,
      hasDataRaceOrLogicBug: true,
      verdictFa:
        'دام ظریف `Actor Reentrancy`: اگرچه `Data Race` سطح حافظه رخ نداد، اما چون تغییر وضعیت (`balance -= amount`) بعد از نقطه `await` نوشته شده بود، در زمان تعلیق `Task A`، تسک دوم وارد `Actor` شد و موجودی منفی (`-60`) رقم خورد!',
      steps: [
        {
          stepIndex: 1,
          actorOrThread: 'Actor (Task A)',
          operationEn: `guard balance (100) >= ${withdrawalA} -> SUSPEND at await authorize()`,
          balanceSnapshot: initialBalance,
          explanationFa: 'تسک اول شرط موجودی را چک می‌کند اما پیش از کسر مبلغ، در خط `await` متوقف (`Suspend`) می‌شود و `Actor` آزاد می‌گردد.',
          isAnomaly: false,
        },
        {
          stepIndex: 2,
          actorOrThread: 'Actor (Task B - Reentrant!)',
          operationEn: `guard balance (100) >= ${withdrawalB} -> PASSES while Task A suspended!`,
          balanceSnapshot: initialBalance,
          explanationFa: 'به دلیل ویژگی `Reentrancy` در `Actor`ها، تسک دوم وارد `Actor` شده و می‌بیند موجودی هنوز ۱۰۰ است!',
          isAnomaly: true,
        },
        {
          stepIndex: 3,
          actorOrThread: 'Actor (Task A & B Resume)',
          operationEn: `balance -= ${withdrawalA}; balance -= ${withdrawalB} -> ${finalBalance}`,
          balanceSnapshot: finalBalance,
          explanationFa: 'هر دو تسک از نقطه `await` بازگشته و مبلغ را کسر می‌کنند؛ موجودی به ۶۰- سقوط می‌کند (نقض `Invariant` منطقی).',
          isAnomaly: true,
        },
      ],
    };
  }

  // actor-reentrancy-fixed: mutate state BEFORE suspension point (or re-check after await)
  const afterA = initialBalance - withdrawalA;
  return {
    mode,
    initialBalance,
    withdrawalA,
    withdrawalB,
    finalBalance: afterA,
    totalWithdrawn: withdrawalA,
    hasDataRaceOrLogicBug: false,
    verdictFa:
      'الگوی طلایی ایمنی در برابر `Reentrancy`: وضعیت `Actor` (کسر موجودی یا رزرو مبلغ) پیش از نقطه تعلیق `await` به‌روزرسانی شد تا هیچ تسک ورودی در زمان تعلیق، وضعیت قدیمی را مشاهده نکند.',
    steps: [
      {
        stepIndex: 1,
        actorOrThread: 'Actor (Task A)',
        operationEn: `guard balance >= ${withdrawalA}; balance -= ${withdrawalA} (NOW 20) -> await log()`,
        balanceSnapshot: afterA,
        explanationFa: 'تسک اول ابتدا موجودی را به ۲۰ کاهش می‌دهد و سپس وارد نقطه تعلیق `await` می‌شود.',
        isAnomaly: false,
      },
      {
        stepIndex: 2,
        actorOrThread: 'Actor (Task B - Reentrant)',
        operationEn: `guard balance (20) >= ${withdrawalB} -> false (Safely Rejected)`,
        balanceSnapshot: afterA,
        explanationFa: 'حتی اگر تسک دوم در زمان تعلیق `Task A` وارد `Actor` شود، مقدار به‌روزشده (۲۰) را دیده و رد می‌شود.',
        isAnomaly: false,
      },
    ],
  };
}

export type ContinuationResumePolicy =
  | 'resume-once-valid'
  | 'resume-zero-leak'
  | 'resume-twice-crash';

export interface ContinuationSimulationOutcome {
  policy: ContinuationResumePolicy;
  resumeCount: number;
  runtimeStatusEn: 'VALID RESUME' | 'TASK LEAKED FOREVER' | 'FATAL RUNTIME TRAP';
  isHealthy: boolean;
  diagnosticFa: string;
  swiftTraceEn: string[];
}

/**
 * Models `withCheckedContinuation` / `withCheckedThrowingContinuation` contract:
 * - Resuming 0 times leaks the suspended task forever (CheckedContinuation logs a warning on deinit).
 * - Resuming 1 time properly wakes the suspended AsyncFrame on the cooperative pool.
 * - Resuming >= 2 times triggers an immediate deterministic runtime trap (`SWIFT TASK CONTINUATION MISUSE`).
 */
export function simulateContinuationContract(
  policy: ContinuationResumePolicy
): ContinuationSimulationOutcome {
  if (policy === 'resume-once-valid') {
    return {
      policy,
      resumeCount: 1,
      runtimeStatusEn: 'VALID RESUME',
      isHealthy: true,
      diagnosticFa:
        'قرارداد `CheckedContinuation` به درستی اجرا شد: دقیقاً یک بار فراخوانی `continuation.resume(returning:)` انجام گرفت و فریم معلق در `Heap` بلافاصله به استخر رشته‌ها بازگردانده شد.',
      swiftTraceEn: [
        '1. Suspend caller task & allocate CheckedContinuation<Location, Error>',
        '2. Legacy delegate fires didUpdateLocations([loc])',
        '3. continuation.resume(returning: loc) -> State transitions Pending -> Resumed',
        '4. Enqueue AsyncFrame onto Cooperative Executor -> Caller resumes safely',
      ],
    };
  }

  if (policy === 'resume-zero-leak') {
    return {
      policy,
      resumeCount: 0,
      runtimeStatusEn: 'TASK LEAKED FOREVER',
      isHealthy: false,
      diagnosticFa:
        'فراموشی فراخوانی `resume` در یکی از شاخه‌های شرطی (`early return`): تسک فراخوانی‌کننده تا ابد در وضعیت `Suspended` روی `Heap` منجمد می‌ماند و `CheckedContinuation` هشدار `SWIFT TASK CONTINUATION MISUSE: leaked its continuation!` چاپ می‌کند.',
      swiftTraceEn: [
        '1. Suspend caller task & allocate CheckedContinuation<Data, Error>',
        '2. Legacy callback hits `guard let data else { return }` WITHOUT calling resume!',
        '3. Closure exits -> CheckedContinuation.deinit detects unresumed state',
        '4. ⚠️ SWIFT TASK CONTINUATION MISUSE: fetchLegacyData() leaked its continuation!',
      ],
    };
  }

  return {
    policy,
    resumeCount: 2,
    runtimeStatusEn: 'FATAL RUNTIME TRAP',
    isHealthy: false,
    diagnosticFa:
      'فراخوانی چندباره `continuation.resume` (مثلاً وقتی `CLLocationManagerDelegate` یا یک کالبک چند بار صدا زده می‌شود): در اولین فراخوانی تسک بیدار شده است و فراخوانی دوم باعث کرش فوری (`Fatal Trap`) برای جلوگیری از فساد حافظه می‌شود.',
    swiftTraceEn: [
      '1. Delegate fires event #1 -> continuation.resume(returning: loc1) [OK]',
      '2. Caller Task wakes up and deallocates continuation frame',
      '3. Delegate fires event #2 -> continuation.resume(returning: loc2) [ILLEGAL]',
      '4. 💥 Fatal error: SWIFT TASK CONTINUATION MISUSE: tried to resume its continuation more than once!',
    ],
  };
}

export type StreamBufferingStrategy =
  | 'unbounded'
  | 'bufferingOldest'
  | 'bufferingNewest';

export interface StreamEventPacket {
  seq: number;
  status: 'consumed' | 'buffered' | 'dropped';
}

export interface AsyncStreamSimulationResult {
  strategy: StreamBufferingStrategy;
  bufferLimit: number;
  producedCount: number;
  consumedCount: number;
  bufferedPackets: number[];
  droppedPackets: number[];
  events: StreamEventPacket[];
  explanationFa: string;
}

/**
 * Simulates `AsyncStream.Continuation.BufferingPolicy` when producer emits `producedCount`
 * elements rapidly while consumer has only pulled `consumedCount` elements via `for await`.
 */
export function simulateAsyncStreamBuffering(
  strategy: StreamBufferingStrategy,
  bufferLimit: number,
  producedCount: number,
  consumedCount: number
): AsyncStreamSimulationResult {
  const safeLimit = Math.max(1, Math.min(10, bufferLimit));
  const safeProduced = Math.max(1, Math.min(20, producedCount));
  const safeConsumed = Math.max(0, Math.min(safeProduced, consumedCount));

  const events: StreamEventPacket[] = [];
  const unconsumedSeqs: number[] = [];

  for (let seq = 1; seq <= safeProduced; seq++) {
    if (seq <= safeConsumed) {
      events.push({ seq, status: 'consumed' });
    } else {
      unconsumedSeqs.push(seq);
    }
  }

  let keptInBuffer: number[] = [];
  let dropped: number[] = [];

  if (strategy === 'unbounded') {
    keptInBuffer = [...unconsumedSeqs];
  } else if (strategy === 'bufferingOldest') {
    keptInBuffer = unconsumedSeqs.slice(0, safeLimit);
    dropped = unconsumedSeqs.slice(safeLimit);
  } else {
    // bufferingNewest(limit): keeps only the latest `safeLimit` items in the ring buffer
    if (unconsumedSeqs.length <= safeLimit) {
      keptInBuffer = [...unconsumedSeqs];
    } else {
      const cutIndex = unconsumedSeqs.length - safeLimit;
      dropped = unconsumedSeqs.slice(0, cutIndex);
      keptInBuffer = unconsumedSeqs.slice(cutIndex);
    }
  }

  for (const seq of unconsumedSeqs) {
    if (keptInBuffer.includes(seq)) {
      events.push({ seq, status: 'buffered' });
    } else {
      events.push({ seq, status: 'dropped' });
    }
  }

  const explanationFa =
    strategy === 'unbounded'
      ? `در سیاست پیش‌فرض \`.unbounded\`، تمام ${keptInBuffer.length} رویدادِ مصرف‌نشده در حافظه صف می‌کشند؛ اگر تولیدکننده سریع‌تر از حلقه \`for await\` باشد، مصرف رم بی‌رویه رشد می‌کند.`
      : strategy === 'bufferingOldest'
      ? `در سیاست \`.bufferingOldest(${safeLimit})\`، به محض پر شدن ظرفیت بافر (${safeLimit} آیتم اول)، رویدادهای جدیدتر (${dropped.length} آیتم) دور ریخته می‌شوند.`
      : `در سیاست \`.bufferingNewest(${safeLimit})\` (ایده‌آل برای سنسورها و قیمت لحظه‌ای)، همیشه ${keptInBuffer.length} داده آخر حفظ شده و داده‌های قدیمی‌ترِ بافر (${dropped.length} آیتم) جایگزین می‌شوند.`;

  return {
    strategy,
    bufferLimit: safeLimit,
    producedCount: safeProduced,
    consumedCount: safeConsumed,
    bufferedPackets: keptInBuffer,
    droppedPackets: dropped,
    events,
    explanationFa,
  };
}

