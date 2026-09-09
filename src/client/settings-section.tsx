import { useState, useSyncExternalStore, type ReactNode } from 'react'
import {
  asNonNegativeNumber,
  DEFAULT_MIN_TURN_MS,
  DEFAULT_SETTINGS,
  DEFAULT_TITLE,
  SETTINGS_FIELDS,
  type NotificationSettings,
} from '../shared.ts'
import { Switch, TextControl } from './controls.tsx'
import type { NotificationLocaleKey } from './locales.ts'
import type { SettingsScope } from './scope.ts'

export interface NotificationSettingsSectionProps {
  /** 已绑定的 settings scope. */
  scope: SettingsScope<NotificationSettings>
  /** locale 读取函数. */
  t: (key: NotificationLocaleKey) => string
}

type BooleanField = {
  [K in keyof NotificationSettings]: NotificationSettings[K] extends boolean ? K : never
}[keyof NotificationSettings]

function liveSettings(scope: SettingsScope<NotificationSettings>): NotificationSettings {
  return scope.getSnapshot().value ?? DEFAULT_SETTINGS
}

function Panel({ title, children }: { title: string, children: ReactNode }) {
  return (
    <div className="dsh-notification-panel">
      <div className="dsh-notification-panel-title">{title}</div>
      {children}
    </div>
  )
}

function SwitchField({
  scope,
  settings,
  field,
  title,
  description,
  disabled = false,
}: {
  scope: SettingsScope<NotificationSettings>
  settings: NotificationSettings
  field: BooleanField
  title: string
  description: string
  disabled?: boolean
}) {
  const checked = settings[field]
  return (
    <div className="dsh-notification-switch-row">
      <div className="dsh-notification-text">
        <div className="dsh-notification-title">{title}</div>
        <div className="dsh-notification-desc">{description}</div>
      </div>
      <Switch
        checked={checked}
        label={title}
        disabled={disabled}
        onToggle={() => {
          void scope.set(SETTINGS_FIELDS[field], !checked)
        }}
      />
    </div>
  )
}

function DraftField({
  id,
  title,
  description,
  saved,
  placeholder,
  type,
  numeric,
  disabled,
  onCommit,
}: {
  id: string
  title: string
  description: string
  saved: string
  placeholder?: string
  type?: 'text' | 'url'
  numeric?: boolean
  disabled?: boolean
  onCommit: (value: string) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const value = draft ?? saved

  const commit = (): void => {
    if (draft === null || draft === saved) {
      setDraft(null)
      return
    }
    onCommit(draft)
    setDraft(null)
  }

  return (
    <div className="dsh-notification-field">
      <label className="dsh-notification-title" htmlFor={id}>{title}</label>
      <TextControl
        id={id}
        value={value}
        placeholder={placeholder}
        type={type}
        numeric={numeric}
        disabled={disabled}
        onChange={setDraft}
        onCommit={commit}
      />
      <p className="dsh-notification-desc">{description}</p>
    </div>
  )
}

/**
 * Settings 侧栏里的通知页, 覆盖全部可调字段, 写入即时生效.
 */
export function NotificationSettingsSection({ scope, t }: NotificationSettingsSectionProps) {
  const settings = useSyncExternalStore(
    (onChange) => scope.subscribe(onChange),
    () => liveSettings(scope),
  )

  const commitMinTurn = (raw: string): void => {
    const trimmed = raw.trim()
    const next = trimmed === ''
      ? DEFAULT_MIN_TURN_MS
      : asNonNegativeNumber(trimmed, settings.minTurnDurationMs)
    void scope.set(SETTINGS_FIELDS.minTurnDurationMs, next)
  }

  const commitTitle = (raw: string): void => {
    const next = raw.trim()
    void scope.set(SETTINGS_FIELDS.title, next === '' ? DEFAULT_TITLE : next)
  }

  const commitWebhook = (raw: string): void => {
    void scope.set(SETTINGS_FIELDS.webhookUrl, raw.trim())
  }

  return (
    <section className="dsh-notification-section">
      <h2 className="dsh-notification-heading">{t('page.title')}</h2>
      <p className="dsh-notification-intro">{t('page.description')}</p>
      <Panel title={t('page.events')}>
        <SwitchField
          scope={scope}
          settings={settings}
          field="notifyOnIdle"
          title={t('settings.notifyOnIdle.title')}
          description={t('settings.notifyOnIdle.description')}
        />
        <SwitchField
          scope={scope}
          settings={settings}
          field="notifyOnError"
          title={t('settings.notifyOnError.title')}
          description={t('settings.notifyOnError.description')}
        />
        <SwitchField
          scope={scope}
          settings={settings}
          field="notifyOnApproval"
          title={t('settings.notifyOnApproval.title')}
          description={t('settings.notifyOnApproval.description')}
        />
        <DraftField
          id="dsh-notification-min-turn"
          title={t('settings.minTurnDurationMs.title')}
          description={t('settings.minTurnDurationMs.description')}
          saved={String(settings.minTurnDurationMs)}
          numeric
          disabled={!settings.notifyOnIdle}
          onCommit={commitMinTurn}
        />
      </Panel>
      <Panel title={t('page.channels')}>
        <SwitchField
          scope={scope}
          settings={settings}
          field="desktop"
          title={t('settings.desktop.title')}
          description={t('settings.desktop.description')}
        />
        <SwitchField
          scope={scope}
          settings={settings}
          field="browser"
          title={t('settings.browser.title')}
          description={t('settings.browser.description')}
        />
        <SwitchField
          scope={scope}
          settings={settings}
          field="browserOnlyWhenHidden"
          title={t('settings.browserOnlyWhenHidden.title')}
          description={t('settings.browserOnlyWhenHidden.description')}
          disabled={!settings.browser}
        />
        <DraftField
          id="dsh-notification-title"
          title={t('settings.titleField.title')}
          description={t('settings.titleField.description')}
          saved={settings.title}
          onCommit={commitTitle}
        />
        <DraftField
          id="dsh-notification-webhook"
          title={t('settings.webhookUrl.title')}
          description={t('settings.webhookUrl.description')}
          saved={settings.webhookUrl}
          placeholder={t('settings.webhookUrl.placeholder')}
          type="url"
          onCommit={commitWebhook}
        />
      </Panel>
    </section>
  )
}
