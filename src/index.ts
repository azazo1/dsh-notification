/**
 * dsh-notification Host 半区.
 *
 * 监听 agent 生命周期, 按设置发系统原生通知和 webhook.
 * settings 命名空间让 Web 设置页和 settings.yaml 能热更新同一份配置.
 */
import type { Context, Volatile } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { bindListeners } from './host.ts'
import {
  DEFAULT_MIN_TURN_MS,
  DEFAULT_TITLE,
  PLUGIN_NAME,
  type NotificationSettings,
} from './shared.ts'

export const name = PLUGIN_NAME

export type { NotificationSettings }
export interface Config {
  notifyOnIdle: Volatile<boolean>
  notifyOnError: Volatile<boolean>
  notifyOnApproval: Volatile<boolean>
  minTurnDurationMs: Volatile<number>
  desktop: Volatile<boolean>
  browser: Volatile<boolean>
  browserOnlyWhenHidden: Volatile<boolean>
  webhookUrl: Volatile<string>
  title: Volatile<string>
}

/** Loader / settings 共用的通知 schema. */
export const Config = z.object({
  notifyOnIdle: z.boolean().default(true)
    .description('Notify when an agent finishes a turn (status flips to idle).').volatile(),
  notifyOnError: z.boolean().default(true)
    .description('Notify when a step or turn errors (agent/error).').volatile(),
  notifyOnApproval: z.boolean().default(true)
    .description('Notify when a tool call is waiting for user approval.').volatile(),
  minTurnDurationMs: z.number().min(0).default(DEFAULT_MIN_TURN_MS)
    .description('Only notify for turns that ran at least this long, to skip quick replies.').volatile(),
  desktop: z.boolean().default(true)
    .description('Show a native desktop notification on the machine running the dsh server.').volatile(),
  browser: z.boolean().default(true)
    .description('Show browser Notification popups in the Web UI.').volatile(),
  browserOnlyWhenHidden: z.boolean().default(true)
    .description('Only show browser notifications while the tab is hidden.').volatile(),
  webhookUrl: z.string().default('')
    .description('Optional URL to POST a JSON payload to (Slack-compatible text field included).').volatile(),
  title: z.string().default(DEFAULT_TITLE)
    .description('Title used for desktop and browser notifications.').volatile(),
})

/**
 * 注册 settings 命名空间, 并把 Loader 行配置作为 composition 底.
 * @param ctx - Host 插件上下文.
 * @param config - Loader 校验后的行配置, 缺省时使用 schema 默认值.
 */
export function apply(ctx: Context, config: Config): void {
  const source = (): NotificationSettings => ({
    notifyOnIdle: config.notifyOnIdle.get(),
    notifyOnError: config.notifyOnError.get(),
    notifyOnApproval: config.notifyOnApproval.get(),
    minTurnDurationMs: config.minTurnDurationMs.get(),
    desktop: config.desktop.get(),
    browser: config.browser.get(),
    browserOnlyWhenHidden: config.browserOnlyWhenHidden.get(),
    webhookUrl: config.webhookUrl.get(),
    title: config.title.get(),
  })
  const resolved = source()

  ctx.logger.info(
    'dsh-notification: host loaded, desktop=%s browser=%s',
    resolved.desktop,
    resolved.browser,
  )
  bindListeners(ctx as never, source)
}
