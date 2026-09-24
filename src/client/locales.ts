/** `dsh-notification` 插件页配置卡片的文案. */
import type { SettingsFormLabels } from '@deepseek-ai/dsh-client-ui-primitives'

/** 本插件字典的命名空间, 与包名一致. */
export const NS = 'dsh-notification'

/** 本插件用到的文案键. */
export type NotificationLocaleKey =
  | 'description'
  | 'eventsGroup' | 'channelsGroup'
  | 'notifyOnIdle' | 'notifyOnIdleHint'
  | 'notifyOnError' | 'notifyOnErrorHint'
  | 'notifyOnApproval' | 'notifyOnApprovalHint'
  | 'desktop' | 'desktopHint'
  | 'browser' | 'browserHint'
  | 'browserOnlyWhenHidden' | 'browserOnlyWhenHiddenHint'
  | 'minTurnDurationMs' | 'minTurnDurationMsHint'
  | 'titleField' | 'titleFieldHint'
  | 'webhookUrl' | 'webhookUrlHint' | 'webhookUrlPlaceholder'
  | 'overridden' | 'reset' | 'invalidNumber'
  | 'readOnly' | 'unavailable' | 'save' | 'saving' | 'saveFailed'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** 本插件配置卡片的文案. */
    'dsh-notification': NotificationLocaleKey
  }
}

/** English copy. */
export const en: Record<NotificationLocaleKey, string> = {
  description: 'Desktop, browser, or webhook alerts when a turn finishes, errors, or waits for approval.',
  eventsGroup: 'Events',
  channelsGroup: 'Channels',
  notifyOnIdle: 'Turn finished',
  notifyOnIdleHint: 'Notify when the agent flips from running back to idle.',
  notifyOnError: 'Errors',
  notifyOnErrorHint: 'Notify when a step or turn reports an error.',
  notifyOnApproval: 'Approval needed',
  notifyOnApprovalHint: 'Notify when a tool call waits for confirmation. Turning this off still forwards the request to the real approver.',
  desktop: 'System notifications',
  desktopHint: 'Native OS notifications on the machine running dsh. Turning this off leaves browser popups and webhooks unchanged.',
  browser: 'Browser notifications',
  browserHint: 'Browser Notification popups on the machine viewing the Web UI.',
  browserOnlyWhenHidden: 'Only while the tab is hidden',
  browserOnlyWhenHiddenHint: 'Skip browser popups while this tab is visible.',
  minTurnDurationMs: 'Minimum turn duration (ms)',
  minTurnDurationMsHint: 'Skip the "finished" alert for turns shorter than this, so quick replies stay quiet.',
  titleField: 'Notification title',
  titleFieldHint: 'Shared title for desktop and browser notifications.',
  webhookUrl: 'Webhook URL',
  webhookUrlHint: 'Optional POST target with a Slack-compatible text field. Leave empty to disable.',
  webhookUrlPlaceholder: 'https://hooks.slack.com/services/...',
  overridden: 'Overridden',
  reset: 'Reset to default',
  invalidNumber: 'Enter a whole number of milliseconds, or leave blank to use the default.',
  readOnly: 'This deployment stores settings read-only.',
  unavailable: 'This plugin is not loaded, so it cannot be configured right now.',
  save: 'Save',
  saving: 'Saving...',
  saveFailed: 'The deployment did not accept these values; they were left for you to correct.',
}

/** Simplified Chinese copy. */
export const zh: Record<NotificationLocaleKey, string> = {
  description: '回合结束, 出错或等待审批时, 发系统通知, 浏览器弹窗或 webhook.',
  eventsGroup: '触发事件',
  channelsGroup: '通知渠道',
  notifyOnIdle: '回合结束',
  notifyOnIdleHint: 'agent 从 running 回到 idle 时通知.',
  notifyOnError: '出错',
  notifyOnErrorHint: '步骤或回合报错时通知.',
  notifyOnApproval: '等待审批',
  notifyOnApprovalHint: '工具调用需要你确认时通知. 关掉后仍会把审批交给真正的审批器.',
  desktop: '系统通知',
  desktopHint: '在运行 dsh 的机器上弹出操作系统原生通知. 关掉后浏览器通知和 webhook 不受影响.',
  browser: '浏览器通知',
  browserHint: '在打开 Web UI 的机器上弹出浏览器 Notification.',
  browserOnlyWhenHidden: '仅在标签页隐藏时弹出',
  browserOnlyWhenHiddenHint: '当前标签页可见时不弹浏览器通知.',
  minTurnDurationMs: '最短回合时长 (毫秒)',
  minTurnDurationMsHint: '短于此时长的回合不发 "跑完了" 通知, 用来跳过快速回复.',
  titleField: '通知标题',
  titleFieldHint: '桌面和浏览器通知共用的标题.',
  webhookUrl: 'Webhook URL',
  webhookUrlHint: '可选 POST 目标, Slack 兼容 text 字段. 留空即关闭.',
  webhookUrlPlaceholder: 'https://hooks.slack.com/services/...',
  overridden: '已覆盖',
  reset: '恢复默认',
  invalidNumber: '请填整数毫秒数; 留空表示使用默认值.',
  readOnly: '本部署的设置为只读.',
  unavailable: '该插件当前未加载, 暂时无法配置.',
  save: '保存',
  saving: '保存中...',
  saveFailed: '本部署没有接受这些值, 已保留供你修改.',
}

/**
 * 表单框架要的文案, 从本插件字典取.
 * @param t - 本插件字典的读取函数.
 * @returns 共享设置表单渲染的标签.
 */
export function formLabels(t: (key: NotificationLocaleKey) => string): SettingsFormLabels {
  return {
    unavailable: t('unavailable'),
    readOnly: t('readOnly'),
    saveFailed: t('saveFailed'),
    save: t('save'),
    saving: t('saving'),
  }
}
