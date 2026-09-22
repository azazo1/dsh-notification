import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { apply, Config, desktopNotify, name } from '../index.js'

/** Minimal Cordis-shaped context: records listeners, exposes emit helpers. */
function mockCtx() {
  const listeners = new Map()
  return {
    listeners,
    on(event, fn) {
      listeners.set(event, fn)
    },
    emit(event, ...args) {
      return listeners.get(event)?.(...args)
    },
  }
}

/** Stub global fetch, capturing webhook payloads. Returns captured calls. */
function captureWebhook(t) {
  const calls = []
  const original = globalThis.fetch
  globalThis.fetch = (url, init) => {
    calls.push({ url, payload: JSON.parse(init.body) })
    return Promise.resolve({ ok: true })
  }
  t.after(() => { globalThis.fetch = original })
  return calls
}

/** Config with both silent channels off and the webhook as the observable. */
function webhookConfig(overrides = {}) {
  return new Config({
    desktop: false,
    webhookUrl: 'https://example.invalid/hook',
    minTurnDurationMs: 0,
    ...overrides,
  })
}

test('exports a named plugin with a validating schema', () => {
  assert.equal(name, 'dsh-notification')
  const config = new Config({})
  assert.equal(config.notifyOnIdle, true)
  assert.equal(config.minTurnDurationMs, 5000)
  assert.equal(config.browser, true)
})

test('apply registers the four listeners', () => {
  const ctx = mockCtx()
  apply(ctx, webhookConfig())
  assert.deepEqual(
    [...ctx.listeners.keys()].sort(),
    ['agent/disposed', 'agent/error', 'agent/status', 'approval/request'],
  )
})

test('turn finish posts the webhook once the duration gate passes', (t) => {
  const calls = captureWebhook(t)
  const ctx = mockCtx()
  apply(ctx, webhookConfig())
  const agent = {}
  ctx.emit('agent/status', { agent, status: 'running' })
  ctx.emit('agent/status', { agent, status: 'idle' })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].payload.summary, 'Agent finished')
  assert.equal(calls[0].payload.level, 'info')
  assert.match(calls[0].payload.text, /^Agent finished/)
})

test('a turn below minTurnDurationMs stays quiet', (t) => {
  const calls = captureWebhook(t)
  const ctx = mockCtx()
  apply(ctx, webhookConfig({ minTurnDurationMs: 60_000 }))
  const agent = {}
  ctx.emit('agent/status', { agent, status: 'running' })
  ctx.emit('agent/status', { agent, status: 'idle' })
  assert.equal(calls.length, 0)
})

test('idle without a tracked start never notifies', (t) => {
  const calls = captureWebhook(t)
  const ctx = mockCtx()
  apply(ctx, webhookConfig())
  ctx.emit('agent/status', { agent: {}, status: 'idle' })
  assert.equal(calls.length, 0)
})

test('agent/error posts an error-level webhook with turn and step', (t) => {
  const calls = captureWebhook(t)
  const ctx = mockCtx()
  apply(ctx, webhookConfig())
  ctx.emit('agent/error', { agent: {}, turn: 3, step: 2, error: new Error('boom') })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].payload.level, 'error')
  assert.match(calls[0].payload.body, /turn 3, step 2: boom/)
})

test('approval/request notifies AND always delegates to next()', async (t) => {
  const calls = captureWebhook(t)
  const ctx = mockCtx()
  apply(ctx, webhookConfig())
  let delegated = false
  const outcome = await ctx.emit('approval/request',
    { toolName: 'bash', reason: 'rm -rf build' },
    () => { delegated = true; return Promise.resolve('allowed-once') })
  assert.equal(delegated, true, 'observe-only waterfall listener must call next()')
  assert.equal(outcome, 'allowed-once', 'must return the downstream outcome unchanged')
  assert.equal(calls[0].payload.summary, 'Approval needed')
  assert.match(calls[0].payload.body, /bash — rm -rf build/)
})

test('approval/request delegates even with notifications off', async (t) => {
  const calls = captureWebhook(t)
  const ctx = mockCtx()
  apply(ctx, webhookConfig({ notifyOnApproval: false }))
  let delegated = false
  await ctx.emit('approval/request', { toolName: 'bash' },
    () => { delegated = true; return Promise.resolve('rejected') })
  assert.equal(delegated, true)
  assert.equal(calls.length, 0)
})

test('per-event toggles silence their channel', (t) => {
  const calls = captureWebhook(t)
  const ctx = mockCtx()
  apply(ctx, webhookConfig({ notifyOnIdle: false, notifyOnError: false }))
  const agent = {}
  ctx.emit('agent/status', { agent, status: 'running' })
  ctx.emit('agent/status', { agent, status: 'idle' })
  ctx.emit('agent/error', { agent, turn: 1, step: 1, error: 'x' })
  assert.equal(calls.length, 0)
})

test('agent/disposed drops turn-timing state', (t) => {
  const calls = captureWebhook(t)
  const ctx = mockCtx()
  apply(ctx, webhookConfig())
  const agent = {}
  ctx.emit('agent/status', { agent, status: 'running' })
  ctx.emit('agent/disposed', { agent })
  ctx.emit('agent/status', { agent, status: 'idle' })
  assert.equal(calls.length, 0, 'no notification for an agent disposed mid-turn')
})

/**
 * Regression test for issue #1: on headless Linux without `notify-send`,
 * `spawn()` returns synchronously and the OS failure (ENOENT) arrives later
 * as an `'error'` event on the ChildProcess. A missing `'error'` listener
 * makes Node rethrow it as uncaughtException and kill the whole dsh process.
 * The fix attaches a no-op `'error'` listener synchronously on every branch
 * so the async error is swallowed and the notifier stays best-effort.
 *
 * `node:child_process` is a frozen built-in module namespace in ESM, so we
 * inject the spawn function through `desktopNotify`'s `deps` parameter
 * instead of mutating the global — removing that parameter would silently
 * un-guard the headless-Linux crash path this test exists to cover.
 */
test('desktop notification swallows an async spawn ENOENT (regression for issue #1)', async (t) => {
  const fakeChild = new EventEmitter()
  fakeChild.unref = () => {}
  const enoent = Object.assign(new Error('spawn notify-send ENOENT'), { code: 'ENOENT' })
  setImmediate(() => fakeChild.emit('error', enoent))

  const spawnCalls = []
  const mockSpawn = (cmd, args, opts) => {
    spawnCalls.push({ cmd, args, opts })
    return fakeChild
  }

  const unhandled = []
  const onUncaught = (err) => { unhandled.push(err) }
  process.on('uncaughtException', onUncaught)
  t.after(() => { process.off('uncaughtException', onUncaught) })

  desktopNotify('DeepSeek Harness', 'Agent finished — done in 1m 31s', { spawn: mockSpawn })

  await new Promise((r) => setImmediate(r))
  await new Promise((r) => setImmediate(r))

  assert.equal(spawnCalls.length, 1, 'exactly one spawn per desktop notification')
  assert.deepEqual(spawnCalls[0].opts, { stdio: 'ignore', detached: true })
  assert.equal(unhandled.length, 0,
    `spawn 'error' must NOT bubble to uncaughtException (got: ${unhandled.map((e) => e.message).join(', ')})`)
})
