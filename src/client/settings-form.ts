/**
 * dsh-notification 配置卡片的暂存表单.
 *
 * 表单是 profile 条目 volatile Config 的投影: 草稿只留在卡片页, 保存才写回 profile 的 patch 层.
 */
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store'
import {
  SettingsFormModel, settingsNumberField, settingsTextField,
  type SettingsFieldSpec, type SettingsFieldState, type SettingsFormActions,
  type SettingsFormScope, type SettingsFormShell,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { SETTINGS_FIELDS, type NotificationSettings } from '../shared.ts'

/**
 * 布尔字段的草稿编码: 官方模型只解析文本字段, 布尔值以 `true` / `false` 暂存.
 * @param field - 字段名.
 * @returns 该字段的转换描述.
 */
function settingsBooleanField(field: string): SettingsFieldSpec {
  return {
    field,
    format: value => typeof value === 'boolean' ? String(value) : '',
    parse: text => text === 'true'
      ? { kind: 'set', value: true }
      : text === 'false'
        ? { kind: 'set', value: false }
        : undefined,
  }
}

/** 卡片读到的状态. */
export interface NotificationCardState extends SettingsFormShell {
  /** 回合结束通知. */
  notifyOnIdle: SettingsFieldState
  /** 出错通知. */
  notifyOnError: SettingsFieldState
  /** 等待审批通知. */
  notifyOnApproval: SettingsFieldState
  /** 最短回合时长. */
  minTurnDurationMs: SettingsFieldState
  /** 系统通知. */
  desktop: SettingsFieldState
  /** 浏览器通知. */
  browser: SettingsFieldState
  /** 仅标签页隐藏时弹浏览器通知. */
  browserOnlyWhenHidden: SettingsFieldState
  /** 通知标题. */
  title: SettingsFieldState
  /** webhook 地址. */
  webhookUrl: SettingsFieldState
}

/** 卡片注册时注入给组件的面. */
export interface NotificationCardFace extends SettingsFormActions {
  hooks: {
    /** 组件通过它读快照 (useNotificationCard). */
    notificationCard: SnapshotStore<NotificationCardState>
  }
}

/** 把本插件条目的配置表单桥接成配置卡片的暂存表单. */
export class NotificationSettingsForm {
  private readonly form: SettingsFormModel<NotificationSettings>
  private readonly store: SnapshotStore<NotificationCardState>

  /**
   * @param scope - 本插件 profile 条目的共享配置表单 (ctx.configForms.get).
   */
  constructor(scope: SettingsFormScope<NotificationSettings>) {
    this.form = new SettingsFormModel(scope, [
      settingsBooleanField(SETTINGS_FIELDS.notifyOnIdle),
      settingsBooleanField(SETTINGS_FIELDS.notifyOnError),
      settingsBooleanField(SETTINGS_FIELDS.notifyOnApproval),
      settingsNumberField(SETTINGS_FIELDS.minTurnDurationMs),
      settingsBooleanField(SETTINGS_FIELDS.desktop),
      settingsBooleanField(SETTINGS_FIELDS.browser),
      settingsBooleanField(SETTINGS_FIELDS.browserOnlyWhenHidden),
      settingsTextField(SETTINGS_FIELDS.title),
      settingsTextField(SETTINGS_FIELDS.webhookUrl),
    ])
    this.store = this.form.bind(() => ({
      ...this.form.shell(),
      notifyOnIdle: this.form.field(SETTINGS_FIELDS.notifyOnIdle),
      notifyOnError: this.form.field(SETTINGS_FIELDS.notifyOnError),
      notifyOnApproval: this.form.field(SETTINGS_FIELDS.notifyOnApproval),
      minTurnDurationMs: this.form.field(SETTINGS_FIELDS.minTurnDurationMs),
      desktop: this.form.field(SETTINGS_FIELDS.desktop),
      browser: this.form.field(SETTINGS_FIELDS.browser),
      browserOnlyWhenHidden: this.form.field(SETTINGS_FIELDS.browserOnlyWhenHidden),
      title: this.form.field(SETTINGS_FIELDS.title),
      webhookUrl: this.form.field(SETTINGS_FIELDS.webhookUrl),
    }))
  }

  /**
   * 构造 slot 注册要注入的面.
   * @returns 快照 hook 与表单动作.
   */
  inject(): NotificationCardFace {
    return { hooks: { notificationCard: this.store }, ...this.form.actions() }
  }

  /** 释放对配置表单的订阅. */
  dispose(): void {
    this.form.dispose()
  }
}
