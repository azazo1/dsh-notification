import assert from 'node:assert/strict'
import { after, describe, it } from 'node:test'
import { apply, Config, name } from '../src/index.ts'
import { DEFAULT_SETTINGS, type NotificationSettings } from '../src/shared.ts'

interface MockCtx {
  logger: { info: (...args: unknown[]) => void }
  listeners: Map<string, (...args: unknown[]) => unknown>
  on: (event: string, fn: (...args: unknown[]) => unknown) => void
  emit: (event: string, ...args: unknown[]) => unknown
  inject: (deps: string[], fn: (inner: unknown) => void) => void
  updateSettings?: (next: NotificationSettings) => void
}

function mockCtx(): MockCtx {
  const listeners = new Map<string, (...args: unknown[]) => unknown>()
  return {
    logger: { info() {} },
    listeners,
    on(event, fn) {
      listeners.set(event, fn)
    },
    emit(event, ...args) {
      return listeners.get(event)?.(...args)
    },
    inject() {},
  }
}

function captureWebhook() {
  const calls: Array<{ url: unknown; payload: Record<string, unknown> }> = []
  const original = globalThis.fetch
  globalThis.fetch = ((url: unknown, init?: { body?: string }) => {
    calls.push({ url, payload: JSON.parse(String(init?.body)) as Record<string, unknown> })
    return Promise.resolve({ ok: true }) as Promise<Response>
  }) as typeof fetch
  after(() => {
    globalThis.fetch = original
  })
  return calls
}

type Ref<T> = { get(): T }

function ref<T>(value: T): Ref<T> {
  return { get: () => value }
}

function webhookConfig(overrides: Partial<NotificationSettings> = {}): Config {
  const value: NotificationSettings = {
    ...DEFAULT_SETTINGS,
    desktop: false,
    webhookUrl: 'https://example.invalid/hook',
    minTurnDurationMs: 0,
    ...overrides,
  }
  return {
    notifyOnIdle: ref(value.notifyOnIdle),
    notifyOnError: ref(value.notifyOnError),
    notifyOnApproval: ref(value.notifyOnApproval),
    minTurnDurationMs: ref(value.minTurnDurationMs),
    desktop: ref(value.desktop),
    browser: ref(value.browser),
    browserOnlyWhenHidden: ref(value.browserOnlyWhenHidden),
    webhookUrl: ref(value.webhookUrl),
    title: ref(value.title),
  }
}

function mockCtxWithSettings(): MockCtx {
  return mockCtx()
}

describe('plugin contract', () => {
  it('exports a named plugin with a validating schema', () => {
    assert.equal(name, 'dsh-notification')
    const config = Config({})
    assert.equal(config.notifyOnIdle.get(), true)
    assert.equal(config.minTurnDurationMs.get(), 5000)
    assert.equal(config.browser.get(), true)
    assert.equal(config.desktop.get(), true)
  })

  it('apply registers the four listeners', () => {
    const ctx = mockCtx()
    apply(ctx as never, webhookConfig())
    assert.deepEqual(
      [...ctx.listeners.keys()].sort(),
      ['agent/disposed', 'agent/error', 'agent/status', 'approval/request'],
    )
  })
})

describe('idle notifications', () => {
  it('posts the webhook once the duration gate passes', () => {
    const calls = captureWebhook()
    const ctx = mockCtx()
    apply(ctx as never, webhookConfig())
    const agent = {}
    ctx.emit('agent/status', { agent, status: 'running' })
    ctx.emit('agent/status', { agent, status: 'idle' })
    assert.equal(calls.length, 1)
    assert.equal(calls[0]?.payload.summary, 'Agent finished')
    assert.equal(calls[0]?.payload.level, 'info')
    assert.match(String(calls[0]?.payload.text), /^Agent finished/)
  })

  it('stays quiet below minTurnDurationMs', () => {
    const calls = captureWebhook()
    const ctx = mockCtx()
    apply(ctx as never, webhookConfig({ minTurnDurationMs: 60_000 }))
    const agent = {}
    ctx.emit('agent/status', { agent, status: 'running' })
    ctx.emit('agent/status', { agent, status: 'idle' })
    assert.equal(calls.length, 0)
  })

  it('never notifies idle without a tracked start', () => {
    const calls = captureWebhook()
    const ctx = mockCtx()
    apply(ctx as never, webhookConfig())
    ctx.emit('agent/status', { agent: {}, status: 'idle' })
    assert.equal(calls.length, 0)
  })
})

describe('error and approval', () => {
  it('posts an error-level webhook with turn and step', () => {
    const calls = captureWebhook()
    const ctx = mockCtx()
    apply(ctx as never, webhookConfig())
    ctx.emit('agent/error', { agent: {}, turn: 3, step: 2, error: new Error('boom') })
    assert.equal(calls.length, 1)
    assert.equal(calls[0]?.payload.level, 'error')
    assert.match(String(calls[0]?.payload.body), /turn 3, step 2: boom/)
  })

  it('notifies approval and always delegates to next()', async () => {
    const calls = captureWebhook()
    const ctx = mockCtx()
    apply(ctx as never, webhookConfig())
    let delegated = false
    const outcome = await ctx.emit(
      'approval/request',
      { toolName: 'bash', reason: 'rm -rf build' },
      () => {
        delegated = true
        return Promise.resolve('allowed-once')
      },
    )
    assert.equal(delegated, true)
    assert.equal(outcome, 'allowed-once')
    assert.equal(calls[0]?.payload.summary, 'Approval needed')
    assert.match(String(calls[0]?.payload.body), /bash — rm -rf build/)
  })

  it('delegates even with notifications off', async () => {
    const calls = captureWebhook()
    const ctx = mockCtx()
    apply(ctx as never, webhookConfig({ notifyOnApproval: false }))
    let delegated = false
    await ctx.emit('approval/request', { toolName: 'bash' }, () => {
      delegated = true
      return Promise.resolve('rejected')
    })
    assert.equal(delegated, true)
    assert.equal(calls.length, 0)
  })
})

describe('toggles and disposal', () => {
  it('silences per-event channels', () => {
    const calls = captureWebhook()
    const ctx = mockCtx()
    apply(ctx as never, webhookConfig({ notifyOnIdle: false, notifyOnError: false }))
    const agent = {}
    ctx.emit('agent/status', { agent, status: 'running' })
    ctx.emit('agent/status', { agent, status: 'idle' })
    ctx.emit('agent/error', { agent, turn: 1, step: 1, error: 'x' })
    assert.equal(calls.length, 0)
  })

  it('drops turn-timing state on dispose', () => {
    const calls = captureWebhook()
    const ctx = mockCtx()
    apply(ctx as never, webhookConfig())
    const agent = {}
    ctx.emit('agent/status', { agent, status: 'running' })
    ctx.emit('agent/disposed', { agent })
    ctx.emit('agent/status', { agent, status: 'idle' })
    assert.equal(calls.length, 0)
  })
})

describe('live settings', () => {
  it('picks up a settings overlay without reloading listeners', () => {
    const calls = captureWebhook()
    const ctx = mockCtxWithSettings()
    const entry = webhookConfig()
    apply(ctx as never, entry)
    entry.notifyOnIdle = ref(false)
    const agent = {}
    ctx.emit('agent/status', { agent, status: 'running' })
    ctx.emit('agent/status', { agent, status: 'idle' })
    assert.equal(calls.length, 0)
  })
})
