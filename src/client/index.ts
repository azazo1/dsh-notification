/**
 * dsh-notification 浏览器半区.
 *
 * 盯着 session list 弹浏览器通知, 并在 Settings > General 挂一行系统通知开关.
 */
import { createElement } from 'react'
import {
  decodeNotificationSettings,
  PLUGIN_ID,
  SETTINGS_NAMESPACE,
  type NotificationSettings,
} from '../shared.ts'
import { NS, en, zh, type NotificationLocaleKey } from './locales.ts'
import type { SettingsScope } from './scope.ts'
import { DesktopSettingsRow } from './settings-row.tsx'
import { ensurePermission, watchSessions, type SessionList } from './session-watch.ts'
import { injectStyles } from './styles.ts'

interface LocaleService {
  bind: (ns: string) => (key: string) => string
  register: (
    ns: string,
    dicts: { zh: Record<string, string>; en: Record<string, string> },
  ) => () => void
}

interface SlotsService {
  inject: (name: string, factory: () => unknown) => void
  register: (options: Record<string, unknown>, component: unknown) => unknown
}

interface ClientContext {
  logger: { info: (...args: unknown[]) => void; debug: (...args: unknown[]) => void }
  settingsScope: {
    bind: (spec: {
      namespace: string
      decode?: (section: unknown) => NotificationSettings | undefined
    }) => SettingsScope<NotificationSettings>
  }
  locale: LocaleService
  slots: SlotsService
  sessions?: { list?: SessionList }
  get: (name: string) => { list?: SessionList } | undefined
  effect: (callback: () => (() => void) | void, name?: string) => void
}

export const inject = ['slots', 'locale', 'settingsScope', 'sessions']

/**
 * 注入样式, 订阅浏览器通知, 并挂上 General 设置行.
 * @param ctx - Web Client 插件上下文.
 */
export function apply(ctx: ClientContext): void {
  ctx.logger.info('dsh-notification: client applying')
  injectStyles()

  const scope = ctx.settingsScope.bind({
    namespace: SETTINGS_NAMESPACE,
    decode: decodeNotificationSettings,
  })

  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-notification: dictionaries')
  ctx.effect(() => ensurePermission(), 'dsh-notification: permission')

  const sessions = ctx.sessions ?? ctx.get('sessions')
  const list = sessions?.list
  if (list) {
    ctx.effect(() => watchSessions(list, scope), 'dsh-notification: session watch')
  }

  const t = ctx.locale.bind(NS) as (key: NotificationLocaleKey) => string
  ctx.slots.inject('settings.general.item', () => ctx.slots.register(
    {
      name: 'settings.general.item',
      id: PLUGIN_ID,
      order: 90,
      locale: NS,
    },
    () => createElement(DesktopSettingsRow, { scope, t }),
  ))
}
