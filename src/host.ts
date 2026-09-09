import { desktopNotify } from './desktop.ts'
import { formatDuration, type NotificationSettings } from './shared.ts'
import { postWebhook } from './webhook.ts'

/** Host 监听所需的最小 ctx 面. */
export interface HostListenerContext {
  on: (event: string, listener: (...args: never[]) => unknown) => unknown
}

/** 通知级别. */
export type NotifyLevel = 'info' | 'warn' | 'error'

interface StatusEvent {
  agent: object
  status: string
}

interface ErrorEvent {
  error?: { message?: string } | string
  turn?: unknown
  step?: unknown
}

interface ApprovalRequest {
  toolName?: string
  reason?: string
}

interface DisposedEvent {
  agent: object
}

/**
 * 按当前设置发桌面通知和 webhook.
 * @param config - 当前解析后的设置.
 * @param summary - 短标题.
 * @param body - 详细正文.
 * @param level - 级别.
 */
export function notify(
  config: NotificationSettings,
  summary: string,
  body: string,
  level: NotifyLevel,
): void {
  const text = body ? `${summary} — ${body}` : summary
  if (config.desktop) desktopNotify(config.title, text)
  if (config.webhookUrl) {
    postWebhook(config.webhookUrl, {
      text,
      summary,
      body,
      level,
      ts: new Date().toISOString(),
    })
  }
}

/**
 * 挂上 Host 生命周期监听. 每次通知都读取 current(), 所以 settings 热更新立刻生效.
 * @param ctx - Host 插件上下文.
 * @param current - 当前解析后的设置.
 */
export function bindListeners(ctx: HostListenerContext, current: () => NotificationSettings): void {
  const startedAt = new Map<object, number>()

  ctx.on('agent/status', ((event: StatusEvent) => {
    const { agent, status } = event
    if (status === 'running') {
      startedAt.set(agent, Date.now())
      return
    }
    const t0 = startedAt.get(agent)
    startedAt.delete(agent)
    const config = current()
    if (!config.notifyOnIdle || t0 == null) return
    const elapsed = Date.now() - t0
    if (elapsed < config.minTurnDurationMs) return
    notify(config, 'Agent finished', `done in ${formatDuration(elapsed)}`, 'info')
  }) as (...args: never[]) => unknown)

  ctx.on('agent/error', ((event: ErrorEvent) => {
    const config = current()
    if (!config.notifyOnError) return
    const raw = event.error
    const message = typeof raw === 'string' ? raw : raw?.message
    const detail = String(message ?? 'unknown error').slice(0, 200)
    notify(config, 'Agent error', `turn ${event.turn}, step ${event.step}: ${detail}`, 'error')
  }) as (...args: never[]) => unknown)

  ctx.on('approval/request', ((req: ApprovalRequest, next: () => unknown) => {
    const config = current()
    if (config.notifyOnApproval) {
      const detail = req.reason ? `${req.toolName} — ${req.reason}` : String(req.toolName ?? 'tool')
      notify(config, 'Approval needed', detail, 'warn')
    }
    return next()
  }) as (...args: never[]) => unknown)

  ctx.on('agent/disposed', ((event: DisposedEvent) => {
    startedAt.delete(event.agent)
  }) as (...args: never[]) => unknown)
}
