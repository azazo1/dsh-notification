import type { ConfigForm } from '@deepseek-ai/dsh-client-ui-settings/client'
import { DEFAULT_SETTINGS, formatDuration, PLUGIN_ID, type NotificationSettings } from '../shared.ts'

interface SessionRow {
  origin?: string
  pendingInteraction?: unknown
  running?: boolean
}

interface SessionListSnapshot {
  ids?: string[]
  byId?: Record<string, SessionRow | undefined>
}

export interface SessionList {
  getSnapshot(): SessionListSnapshot
  subscribe(listener: () => void): () => void
}

interface TrackedRow {
  pending: unknown
  running: boolean
  runningSince: number
}

function canNotify(): boolean {
  return typeof Notification !== 'undefined'
}

/**
 * 在第一次用户手势上申请 Notification 权限, 不阻塞.
 * @returns 取消手势监听的 disposer.
 */
export function ensurePermission(): () => void {
  if (!canNotify() || Notification.permission !== 'default') return () => {}
  const ask = (): void => {
    window.removeEventListener('pointerdown', ask, true)
    window.removeEventListener('keydown', ask, true)
    try {
      void Notification.requestPermission().catch(() => {})
    } catch {
      // 权限申请失败时保持静默.
    }
  }
  window.addEventListener('pointerdown', ask, true)
  window.addEventListener('keydown', ask, true)
  return () => {
    window.removeEventListener('pointerdown', ask, true)
    window.removeEventListener('keydown', ask, true)
  }
}

function liveSettings(scope: ConfigForm<NotificationSettings>): NotificationSettings {
  return scope.getSnapshot().value ?? DEFAULT_SETTINGS
}

function snapshotRow(row: SessionRow): TrackedRow {
  return { pending: row.pendingInteraction, running: Boolean(row.running), runningSince: 0 }
}

function show(config: NotificationSettings, body: string): void {
  if (!config.browser) return
  if (!canNotify() || Notification.permission !== 'granted') return
  if (config.browserOnlyWhenHidden && document.visibilityState === 'visible') return
  try {
    const popup = new Notification(config.title, { body, tag: PLUGIN_ID })
    popup.onclick = () => {
      try {
        window.focus()
      } catch {
        // 聚焦失败忽略.
      }
      popup.close()
    }
  } catch {
    // 弹出失败忽略.
  }
}

/**
 * 盯着 client session list, 在回合结束或等待用户时弹浏览器通知.
 * @param list - sessions.list.
 * @param scope - 已绑定的 settings scope.
 * @returns 取消订阅函数.
 */
export function watchSessions(
  list: SessionList,
  scope: ConfigForm<NotificationSettings>,
): () => void {
  const prev = new Map<string, TrackedRow>()

  const seed = (): void => {
    prev.clear()
    const snap = list.getSnapshot()
    for (const id of snap.ids ?? []) {
      const row = snap.byId?.[id]
      if (row) prev.set(id, snapshotRow(row))
    }
  }
  seed()

  return list.subscribe(() => {
    const config = liveSettings(scope)
    const snap = list.getSnapshot()
    for (const id of snap.ids ?? []) {
      const row = snap.byId?.[id]
      if (!row) continue
      if (row.origin === 'subagent') continue
      let tracked = prev.get(id)
      if (!tracked) {
        prev.set(id, snapshotRow(row))
        continue
      }
      if (!tracked.running && row.running) tracked.runningSince = Date.now()
      if (config.notifyOnApproval && tracked.pending === undefined && row.pendingInteraction !== undefined) {
        const kind = typeof row.pendingInteraction === 'string' ? row.pendingInteraction : 'input'
        show(config, `Waiting for you — ${kind}`)
      }
      if (config.notifyOnIdle && tracked.running && !row.running && row.pendingInteraction === undefined) {
        const elapsed = tracked.runningSince ? Date.now() - tracked.runningSince : null
        if (elapsed === null || elapsed >= config.minTurnDurationMs) {
          show(
            config,
            elapsed === null ? 'Agent finished' : `Agent finished — ${formatDuration(elapsed)}`,
          )
        }
      }
      tracked = {
        pending: row.pendingInteraction,
        running: Boolean(row.running),
        runningSince: tracked.runningSince,
      }
      prev.set(id, tracked)
    }
  })
}
