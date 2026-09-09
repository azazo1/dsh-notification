/**
 * dsh-notification Host 半区.
 *
 * 监听 agent 生命周期, 按设置发系统原生通知和 webhook.
 * settings 命名空间让 Web General 和 settings.yaml 能热更新同一份配置.
 */
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type {} from '@deepseek-ai/dsh-settings'
import { bindListeners } from './host.ts'
import {
  DEFAULT_MIN_TURN_MS,
  DEFAULT_TITLE,
  PLUGIN_NAME,
  SETTINGS_NAMESPACE,
  type NotificationSettings,
} from './shared.ts'

export const name = PLUGIN_NAME

export type { NotificationSettings }
export type Config = NotificationSettings

/** Loader / settings 共用的通知 schema. */
export const Config = z.object({
  notifyOnIdle: z.boolean().default(true)
    .description('Notify when an agent finishes a turn (status flips to idle).'),
  notifyOnError: z.boolean().default(true)
    .description('Notify when a step or turn errors (agent/error).'),
  notifyOnApproval: z.boolean().default(true)
    .description('Notify when a tool call is waiting for user approval.'),
  minTurnDurationMs: z.number().min(0).default(DEFAULT_MIN_TURN_MS)
    .description('Only notify for turns that ran at least this long, to skip quick replies.'),
  desktop: z.boolean().default(true)
    .description('Show a native desktop notification on the machine running the dsh server.'),
  browser: z.boolean().default(true)
    .description('Show browser Notification popups in the Web UI.'),
  browserOnlyWhenHidden: z.boolean().default(true)
    .description('Only show browser notifications while the tab is hidden.'),
  webhookUrl: z.string().default('')
    .description('Optional URL to POST a JSON payload to (Slack-compatible text field included).'),
  title: z.string().default(DEFAULT_TITLE)
    .description('Title used for desktop and browser notifications.'),
})

/**
 * 注册 settings 命名空间, 并把 Loader 行配置作为 composition 底.
 * @param ctx - Host 插件上下文.
 * @param config - Loader 校验后的行配置, 缺省时使用 schema 默认值.
 */
export function apply(ctx: Context, config?: NotificationSettings): void {
  const resolved: NotificationSettings = Config(config)
  let source = (): NotificationSettings => resolved

  ctx.logger.info(
    'dsh-notification: host loaded, desktop=%s browser=%s',
    resolved.desktop,
    resolved.browser,
  )

  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.installSection(
      ctx,
      SETTINGS_NAMESPACE,
      Config,
      resolved,
      {
        setSource: (current) => {
          source = current
        },
        onChange: () => {
          const next = source()
          settingsCtx.logger.info(
            'dsh-notification: settings desktop=%s browser=%s webhook=%s',
            next.desktop,
            next.browser,
            next.webhookUrl ? 'on' : 'off',
          )
        },
      },
    )
  })

  bindListeners(ctx as never, () => source())
}
