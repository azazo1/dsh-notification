import { useSyncExternalStore } from 'react'
import { DESKTOP_FIELD, DEFAULT_SETTINGS, type NotificationSettings } from '../shared.ts'
import type { NotificationLocaleKey } from './locales.ts'
import type { SettingsScope } from './scope.ts'

export interface DesktopSettingsRowProps {
  /** 已绑定的 settings scope. */
  scope: SettingsScope<NotificationSettings>
  /** locale 读取函数. */
  t: (key: NotificationLocaleKey) => string
}

function currentDesktop(scope: SettingsScope<NotificationSettings>): boolean {
  return scope.getSnapshot().value?.desktop ?? DEFAULT_SETTINGS.desktop
}

/**
 * Settings > General 中的系统通知开关行.
 * @param props.scope - Host 命名空间的浏览器镜像.
 * @param props.t - 文案读取.
 */
export function DesktopSettingsRow({ scope, t }: DesktopSettingsRowProps) {
  const desktop = useSyncExternalStore(
    (onChange) => scope.subscribe(onChange),
    () => currentDesktop(scope),
  )

  return (
    <div className="dsh-notification-row">
      <div className="dsh-notification-text">
        <div className="dsh-notification-title">{t('settings.desktop.title')}</div>
        <div className="dsh-notification-desc">{t('settings.desktop.description')}</div>
      </div>
      <button
        type="button"
        role="switch"
        className="dsh-notification-switch"
        aria-checked={desktop}
        aria-label={t('settings.desktop.title')}
        onClick={() => {
          void scope.set(DESKTOP_FIELD, !desktop)
        }}
      >
        <span className="dsh-notification-thumb" />
      </button>
    </div>
  )
}
