/**
 * dsh-notification locale 命名空间: General 设置行文案. 中文为基准, 英文镜像.
 */

/** 简体中文字典 (key 集合的唯一来源). */
export const zh = {
  'settings.desktop.title': '系统通知',
  'settings.desktop.description': '在运行 dsh 的机器上弹出操作系统原生通知. 关掉后浏览器通知和 webhook 不受影响.',
} satisfies Record<string, string>

/** locale key 联合. */
export type NotificationLocaleKey = keyof typeof zh

/** 英文词典, 与 zh key 集合完全对齐. */
export const en = {
  'settings.desktop.title': 'System notifications',
  'settings.desktop.description': 'Native OS notifications on the machine running dsh. Turning this off leaves browser popups and webhooks unchanged.',
} satisfies Record<NotificationLocaleKey, string>

/** Locale 命名空间 id. */
export const NS = 'dsh-notification'
