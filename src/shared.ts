/** 插件包名, Client loader 注册 id 共用. */
export const PLUGIN_ID = 'dsh-notification'

/** Host Cordis 插件名. */
export const PLUGIN_NAME = PLUGIN_ID

/** 持久化 settings 命名空间, 与插件名一致. */
export const SETTINGS_NAMESPACE = PLUGIN_ID

/** Loader 行 id, 已发布, 不要改. */
export const LOADER_ID = 'notify'

/** 系统原生通知字段. */
export const DESKTOP_FIELD = 'desktop'

/** 默认通知标题. */
export const DEFAULT_TITLE = 'DeepSeek Harness'

/** 默认最短回合时长 (毫秒). */
export const DEFAULT_MIN_TURN_MS = 5000

/** 用户可调的通知设置. */
export interface NotificationSettings {
  /** 回合跑完时通知. */
  notifyOnIdle: boolean
  /** 步骤或回合出错时通知. */
  notifyOnError: boolean
  /** 工具调用等待审批时通知. */
  notifyOnApproval: boolean
  /** 短于此时长的回合不发 "跑完了" 通知. */
  minTurnDurationMs: number
  /** 在运行 dsh 的机器上弹出系统原生通知. */
  desktop: boolean
  /** 在查看 Web UI 的机器上弹出浏览器 Notification. */
  browser: boolean
  /** 标签页可见时不弹浏览器通知. */
  browserOnlyWhenHidden: boolean
  /** 可选 webhook URL, 空字符串表示关闭. */
  webhookUrl: string
  /** 桌面和浏览器通知标题. */
  title: string
}

/** schema / 解码共用的默认值. */
export const DEFAULT_SETTINGS: NotificationSettings = {
  notifyOnIdle: true,
  notifyOnError: true,
  notifyOnApproval: true,
  minTurnDurationMs: DEFAULT_MIN_TURN_MS,
  desktop: true,
  browser: true,
  browserOnlyWhenHidden: true,
  webhookUrl: '',
  title: DEFAULT_TITLE,
}

/**
 * 把未知值收成布尔, 缺省时用 fallback.
 * @param value - settings 原始值.
 * @param fallback - 非法或缺省时的回退.
 * @returns 布尔值.
 */
export function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

/**
 * 把未知值收成非负有限数字.
 * @param value - settings 原始值.
 * @param fallback - 非法时的回退.
 * @returns 非负有限数字.
 */
export function asNonNegativeNumber(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n < 0) return fallback
  return n
}

/**
 * 把未知值收成字符串.
 * @param value - settings 原始值.
 * @param fallback - 非法时的回退.
 * @returns 字符串.
 */
export function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

/**
 * 把 Host 返回的未知 section 解码成类型化设置.
 * 非对象返回 `undefined`, 保留上一次已接受值; 对象字段异常则回退默认值.
 * @param section - settings namespace 的原始 section.
 * @returns 解码后的设置, 或 `undefined`.
 */
export function decodeNotificationSettings(
  section: unknown,
): NotificationSettings | undefined {
  if (typeof section !== 'object' || section === null) return undefined
  const row = section as Record<string, unknown>
  const title = asString(row.title, DEFAULT_TITLE).trim()
  return {
    notifyOnIdle: asBoolean(row.notifyOnIdle, DEFAULT_SETTINGS.notifyOnIdle),
    notifyOnError: asBoolean(row.notifyOnError, DEFAULT_SETTINGS.notifyOnError),
    notifyOnApproval: asBoolean(row.notifyOnApproval, DEFAULT_SETTINGS.notifyOnApproval),
    minTurnDurationMs: asNonNegativeNumber(row.minTurnDurationMs, DEFAULT_MIN_TURN_MS),
    desktop: asBoolean(row.desktop, DEFAULT_SETTINGS.desktop),
    browser: asBoolean(row.browser, DEFAULT_SETTINGS.browser),
    browserOnlyWhenHidden: asBoolean(
      row.browserOnlyWhenHidden,
      DEFAULT_SETTINGS.browserOnlyWhenHidden,
    ),
    webhookUrl: asString(row.webhookUrl, DEFAULT_SETTINGS.webhookUrl),
    title: title === '' ? DEFAULT_TITLE : title,
  }
}

/**
 * 把毫秒格式化成短时长文案.
 * @param ms - 经过的毫秒.
 * @returns 例如 `1.2s` 不会出现, 而是 `12s` / `2m 3s`.
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}
