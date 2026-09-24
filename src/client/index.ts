/**
 * dsh-notification 浏览器半区.
 *
 * 盯着 session list 弹浏览器通知, 并在插件页的卡片上注册配置界面.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type { ConfigForm } from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import { ENTRY_ID, type NotificationSettings } from '../shared.ts'
import { en, NS, zh } from './locales.ts'
import { NotificationSettingsCard } from './settings-card.tsx'
import { NotificationSettingsForm } from './settings-form.ts'
import { ensurePermission, watchSessions, type SessionList } from './session-watch.ts'
import { injectStyles } from './styles.ts'

/** 所需服务: slots 注册, locale 字典, configForms 配置, sessions 会话列表. */
export const inject = ['slots', 'locale', 'configForms', 'sessions']

/**
 * 注入样式, 订阅浏览器通知, 并挂上插件页的配置卡片.
 * @param ctx - Web Client 插件上下文.
 */
export function apply(ctx: ClientContext): void {
  ctx.logger.info('dsh-notification: client applying')
  injectStyles()

  const scope: ConfigForm<NotificationSettings> = ctx.configForms.get<NotificationSettings>(ENTRY_ID)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-notification: dictionaries')
  ctx.effect(() => ensurePermission(), 'dsh-notification: permission')

  const list: SessionList | undefined = ctx.sessions?.list
  if (list !== undefined) {
    ctx.effect(() => watchSessions(list, scope), 'dsh-notification: session watch')
  }

  const card = new NotificationSettingsForm(scope)
  ctx.effect(() => () => { card.dispose() }, 'dsh-notification: settings form')
  ctx.effect(() => ctx.configForms.whileServed([ENTRY_ID], () => ctx.slots.inject(
    'plugins.bundle.config',
    () => ctx.slots.register({
      name: 'plugins.bundle.config',
      // 槽位键是包名 (插件页按包名派发), 与 configForms 寻址用的条目 id 是两件事.
      key: PLUGIN_ID,
      locale: NS,
      inject: () => card.inject(),
    }, NotificationSettingsCard),
  )), 'dsh-notification: plugins page card')
}
