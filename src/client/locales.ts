/**
 * dsh-notification locale 命名空间: 独立设置页文案. 中文为基准, 英文镜像.
 */

/** 简体中文字典 (key 集合的唯一来源). */
export const zh = {
  'page.title': '通知',
  'page.description': '回合结束, 出错或等待审批时, 发系统通知, 浏览器弹窗或 webhook.',
  'page.events': '触发事件',
  'page.channels': '通知渠道',
  'settings.desktop.title': '系统通知',
  'settings.desktop.description': '在运行 dsh 的机器上弹出操作系统原生通知. 关掉后浏览器通知和 webhook 不受影响.',
  'settings.notifyOnIdle.title': '回合结束',
  'settings.notifyOnIdle.description': 'agent 从 running 回到 idle 时通知.',
  'settings.notifyOnError.title': '出错',
  'settings.notifyOnError.description': '步骤或回合报错时通知.',
  'settings.notifyOnApproval.title': '等待审批',
  'settings.notifyOnApproval.description': '工具调用需要你确认时通知. 关掉后仍会把审批交给真正的审批器.',
  'settings.minTurnDurationMs.title': '最短回合时长 (毫秒)',
  'settings.minTurnDurationMs.description': '短于此时长的回合不发 "跑完了" 通知, 用来跳过快速回复.',
  'settings.browser.title': '浏览器通知',
  'settings.browser.description': '在打开 Web UI 的机器上弹出浏览器 Notification.',
  'settings.browserOnlyWhenHidden.title': '仅在标签页隐藏时弹出',
  'settings.browserOnlyWhenHidden.description': '当前标签页可见时不弹浏览器通知.',
  'settings.titleField.title': '通知标题',
  'settings.titleField.description': '桌面和浏览器通知共用的标题.',
  'settings.webhookUrl.title': 'Webhook URL',
  'settings.webhookUrl.description': '可选 POST 目标, Slack 兼容 text 字段. 留空即关闭.',
  'settings.webhookUrl.placeholder': 'https://hooks.slack.com/services/...',
} satisfies Record<string, string>

/** locale key 联合. */
export type NotificationLocaleKey = keyof typeof zh

/** 英文词典, 与 zh key 集合完全对齐. */
export const en = {
  'page.title': 'Notifications',
  'page.description': 'Desktop, browser, or webhook alerts when a turn finishes, errors, or waits for approval.',
  'page.events': 'Events',
  'page.channels': 'Channels',
  'settings.desktop.title': 'System notifications',
  'settings.desktop.description': 'Native OS notifications on the machine running dsh. Turning this off leaves browser popups and webhooks unchanged.',
  'settings.notifyOnIdle.title': 'Turn finished',
  'settings.notifyOnIdle.description': 'Notify when the agent flips from running back to idle.',
  'settings.notifyOnError.title': 'Errors',
  'settings.notifyOnError.description': 'Notify when a step or turn reports an error.',
  'settings.notifyOnApproval.title': 'Approval needed',
  'settings.notifyOnApproval.description': 'Notify when a tool call waits for confirmation. Turning this off still forwards the request to the real approver.',
  'settings.minTurnDurationMs.title': 'Minimum turn duration (ms)',
  'settings.minTurnDurationMs.description': 'Skip the "finished" alert for turns shorter than this, so quick replies stay quiet.',
  'settings.browser.title': 'Browser notifications',
  'settings.browser.description': 'Browser Notification popups on the machine viewing the Web UI.',
  'settings.browserOnlyWhenHidden.title': 'Only while the tab is hidden',
  'settings.browserOnlyWhenHidden.description': 'Do not show browser popups while this tab is visible.',
  'settings.titleField.title': 'Notification title',
  'settings.titleField.description': 'Shared title for desktop and browser notifications.',
  'settings.webhookUrl.title': 'Webhook URL',
  'settings.webhookUrl.description': 'Optional POST target with a Slack-compatible text field. Leave empty to disable.',
  'settings.webhookUrl.placeholder': 'https://hooks.slack.com/services/...',
} satisfies Record<NotificationLocaleKey, string>

/** Locale 命名空间 id. */
export const NS = 'dsh-notification'
