/**
 * 插件页里 dsh-notification 卡片的配置页.
 *
 * 页面只在 Host 真的组合了本条目的期间注册 (configForms.whileServed).
 */
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import {
  SettingsForm, SettingsValueField, type SettingsFieldState,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { SETTINGS_FIELDS, type NotificationSettings } from '../shared.ts'
import { GroupHeading, SwitchField } from './fields.tsx'
import { formLabels } from './locales.ts'
import type { NotificationCardFace } from './settings-form.ts'

/** 组件拿到的 props. */
export type NotificationSettingsCardProps =
  PropsRuntime<'plugins.bundle.config'>
  & PropsLocale<'dsh-notification'>
  & InjectFace<NotificationCardFace>

/**
 * 渲染卡片的一行简介或配置表单, 由插件页的 view 决定.
 * @param props - 页面要的视图, 字典, 表单快照与动作.
 * @returns 简介文本或配置表单.
 */
export function NotificationSettingsCard(props: NotificationSettingsCardProps) {
  const { t } = props
  const state = props.useNotificationCard(snapshot => snapshot)
  if (props.view === 'summary') return t('description')
  const disabled = !state.writable

  const switchField = (
    id: string,
    label: string,
    hint: string,
    fieldName: keyof NotificationSettings,
    fieldState: SettingsFieldState,
  ) => (
    <SwitchField
      id={id}
      label={label}
      hint={hint}
      checked={fieldState.text === 'true'}
      overridden={fieldState.overridden}
      overriddenLabel={t('overridden')}
      resetLabel={t('reset')}
      disabled={disabled}
      onToggle={(next) => { props.edit(fieldName, next ? 'true' : 'false') }}
      onReset={() => { props.resetField(fieldName) }}
    />
  )

  return (
    <SettingsForm labels={formLabels(t)} state={state} onSave={props.save} onDiscard={props.discard}>
      <GroupHeading title={t('eventsGroup')} />
      {switchField(
        'plugin-config-notification-idle',
        t('notifyOnIdle'),
        t('notifyOnIdleHint'),
        SETTINGS_FIELDS.notifyOnIdle,
        state.notifyOnIdle,
      )}
      {switchField(
        'plugin-config-notification-error',
        t('notifyOnError'),
        t('notifyOnErrorHint'),
        SETTINGS_FIELDS.notifyOnError,
        state.notifyOnError,
      )}
      {switchField(
        'plugin-config-notification-approval',
        t('notifyOnApproval'),
        t('notifyOnApprovalHint'),
        SETTINGS_FIELDS.notifyOnApproval,
        state.notifyOnApproval,
      )}
      <SettingsValueField
        id="plugin-config-notification-min-turn"
        label={t('minTurnDurationMs')}
        hint={t('minTurnDurationMsHint')}
        overriddenLabel={t('overridden')}
        resetLabel={t('reset')}
        invalidLabel={t('invalidNumber')}
        numeric
        disabled={disabled}
        {...state.minTurnDurationMs}
        onEdit={(text) => { props.edit(SETTINGS_FIELDS.minTurnDurationMs, text) }}
        onReset={() => { props.resetField(SETTINGS_FIELDS.minTurnDurationMs) }}
      />
      <GroupHeading title={t('channelsGroup')} />
      {switchField(
        'plugin-config-notification-desktop',
        t('desktop'),
        t('desktopHint'),
        SETTINGS_FIELDS.desktop,
        state.desktop,
      )}
      {switchField(
        'plugin-config-notification-browser',
        t('browser'),
        t('browserHint'),
        SETTINGS_FIELDS.browser,
        state.browser,
      )}
      {switchField(
        'plugin-config-notification-hidden',
        t('browserOnlyWhenHidden'),
        t('browserOnlyWhenHiddenHint'),
        SETTINGS_FIELDS.browserOnlyWhenHidden,
        state.browserOnlyWhenHidden,
      )}
      <SettingsValueField
        id="plugin-config-notification-title"
        label={t('titleField')}
        hint={t('titleFieldHint')}
        overriddenLabel={t('overridden')}
        resetLabel={t('reset')}
        invalidLabel={t('invalidNumber')}
        disabled={disabled}
        {...state.title}
        onEdit={(text) => { props.edit(SETTINGS_FIELDS.title, text) }}
        onReset={() => { props.resetField(SETTINGS_FIELDS.title) }}
      />
      <SettingsValueField
        id="plugin-config-notification-webhook"
        label={t('webhookUrl')}
        hint={t('webhookUrlHint')}
        placeholder={t('webhookUrlPlaceholder')}
        overriddenLabel={t('overridden')}
        resetLabel={t('reset')}
        invalidLabel={t('invalidNumber')}
        disabled={disabled}
        {...state.webhookUrl}
        onEdit={(text) => { props.edit(SETTINGS_FIELDS.webhookUrl, text) }}
        onReset={() => { props.resetField(SETTINGS_FIELDS.webhookUrl) }}
      />
    </SettingsForm>
  )
}
