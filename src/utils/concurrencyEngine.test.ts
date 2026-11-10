import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateThreadPoolMetrics,
  computeTimelineSchedule,
  simulateTaskGroupExecution,
  simulateActorIsolation,
  simulateContinuationContract,
  simulateAsyncStreamBuffering,
} from './concurrencyEngine';

test('calculateThreadPoolMetrics models GCD thread explosion vs Swift cooperative pool bounded threads', () => {
  const gcd = calculateThreadPoolMetrics('gcd-blocking', 4, 48);
  const cooperative = calculateThreadPoolMetrics('swift-cooperative', 4, 48);

  assert.equal(gcd.activeThreadsCreated, 48);
  assert.equal(gcd.blockedThreads, 44);
  assert.equal(gcd.statusLevel, 'critical');
  assert.equal(gcd.statusLabelEn, 'THREAD EXPLOSION');

  assert.equal(cooperative.activeThreadsCreated, 4);
  assert.equal(cooperative.blockedThreads, 0);
  assert.equal(cooperative.suspendedContinuationsInHeap, 44);
  assert.equal(cooperative.statusLevel, 'nominal');
  assert.ok(cooperative.memoryFootprintKB < gcd.memoryFootprintKB);
});

test('computeTimelineSchedule accurately calculates sequential await vs parallel async let durations', () => {
  const sampleEndpoints = [
    { id: 'profile', name: 'پروفایل کاربر', swiftCall: 'fetchProfile()', durationMs: 300, colorClass: 'bg-amber-600' },
    { id: 'feed', name: 'فید خبرها', swiftCall: 'fetchFeed()', durationMs: 500, colorClass: 'bg-sky-600' },
    { id: 'stats', name: 'آمار فعالیت', swiftCall: 'fetchStats()', durationMs: 400, colorClass: 'bg-emerald-600' },
  ];

  const seq = computeTimelineSchedule('sequential-await', sampleEndpoints);
  const par = computeTimelineSchedule('parallel-async-let', sampleEndpoints);

  assert.equal(seq.totalDurationMs, 1200);
  assert.equal(seq.speedupFactor, 1.0);
  assert.equal(seq.bars[0].startMs, 0);
  assert.equal(seq.bars[1].startMs, 300);
  assert.equal(seq.bars[2].startMs, 800);

  assert.equal(par.totalDurationMs, 500);
  assert.equal(par.speedupFactor, 2.4);
  assert.equal(par.bars[0].startMs, 0);
  assert.equal(par.bars[1].startMs, 0);
  assert.equal(par.bars[2].startMs, 0);
});

test('simulateTaskGroupExecution propagates error and cancels sibling tasks automatically', () => {
  const specs = [
    { id: 't1', title: 'CDN Image #1', durationMs: 300, willThrowError: false },
    { id: 't2', title: 'Auth Token Validation', durationMs: 400, willThrowError: true }, // throws at 200ms
    { id: 't3', title: 'Heavy Analytics Sync', durationMs: 700, willThrowError: false },
  ];

  const outcome = simulateTaskGroupExecution(specs);
  assert.equal(outcome.parentStatus, 'thrown-error');
  assert.equal(outcome.totalElapsedMs, 200);

  const t1 = outcome.children.find((c) => c.id === 't1')!;
  const t2 = outcome.children.find((c) => c.id === 't2')!;
  const t3 = outcome.children.find((c) => c.id === 't3')!;

  assert.equal(t2.status, 'failed');
  assert.equal(t1.status, 'cancelled');
  assert.equal(t3.status, 'cancelled');
});

test('simulateActorIsolation differentiates data race, actor serialization, and actor reentrancy', () => {
  const unsafeRes = simulateActorIsolation('unsafe-class', 100, 80, 80);
  const actorRes = simulateActorIsolation('isolated-actor', 100, 80, 80);
  const reentrantBug = simulateActorIsolation('actor-reentrancy-bug', 100, 80, 80);
  const reentrantFixed = simulateActorIsolation('actor-reentrancy-fixed', 100, 80, 80);

  assert.equal(unsafeRes.hasDataRaceOrLogicBug, true);
  assert.equal(actorRes.hasDataRaceOrLogicBug, false);
  assert.equal(actorRes.finalBalance, 20);

  assert.equal(reentrantBug.hasDataRaceOrLogicBug, true);
  assert.equal(reentrantBug.finalBalance, -60);

  assert.equal(reentrantFixed.hasDataRaceOrLogicBug, false);
  assert.equal(reentrantFixed.finalBalance, 20);
});

test('simulateContinuationContract validates resume-once invariant vs task leak and double-resume crash', () => {
  const valid = simulateContinuationContract('resume-once-valid');
  const leak = simulateContinuationContract('resume-zero-leak');
  const crash = simulateContinuationContract('resume-twice-crash');

  assert.equal(valid.isHealthy, true);
  assert.equal(valid.resumeCount, 1);

  assert.equal(leak.isHealthy, false);
  assert.equal(leak.runtimeStatusEn, 'TASK LEAKED FOREVER');

  assert.equal(crash.isHealthy, false);
  assert.equal(crash.runtimeStatusEn, 'FATAL RUNTIME TRAP');
});

test('simulateAsyncStreamBuffering enforces unbounded, bufferingOldest, and bufferingNewest backpressure', () => {
  const oldest = simulateAsyncStreamBuffering('bufferingOldest', 3, 8, 2);
  // Events 1,2 consumed; remaining 3,4,5,6,7,8 -> oldest 3 kept (3,4,5), dropped (6,7,8)
  assert.deepEqual(oldest.bufferedPackets, [3, 4, 5]);
  assert.deepEqual(oldest.droppedPackets, [6, 7, 8]);

  const newest = simulateAsyncStreamBuffering('bufferingNewest', 3, 8, 2);
  // Events 1,2 consumed; remaining 3,4,5,6,7,8 -> newest 3 kept (6,7,8), dropped (3,4,5)
  assert.deepEqual(newest.bufferedPackets, [6, 7, 8]);
  assert.deepEqual(newest.droppedPackets, [3, 4, 5]);
});

