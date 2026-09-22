import { spawn as nodeSpawn } from 'node:child_process'
import Schema from '@deepseek-ai/schemastery'

export const name = 'dsh-notification'

export const Config = Schema.object({
  notifyOnIdle: Schema.boolean().default(true)
    .description('Notify when an agent finishes a turn (status flips to idle).'),
  notifyOnError: Schema.boolean().default(true)
    .description('Notify when a step or turn errors (agent/error).'),
  notifyOnApproval: Schema.boolean().default(true)
    .description('Notify when a tool call is waiting for user approval.'),
  minTurnDurationMs: Schema.number().default(5000)
    .description('Only notify for turns that ran at least this long, to skip quick replies.'),
  desktop: Schema.boolean().default(true)
    .description('Show a native desktop notification on the machine running the dsh server (macOS/Linux/Windows).'),
  browser: Schema.boolean().default(true)
    .description('Show browser Notification popups in the Web UI — fires on the machine viewing the page, so it works with a remote server.'),
  browserOnlyWhenHidden: Schema.boolean().default(true)
    .description('Only show browser notifications while the tab is hidden; a visible tab already has your attention.'),
  webhookUrl: Schema.string().default('')
    .description('Optional URL to POST a JSON payload to (Slack-compatible "text" field included).'),
  title: Schema.string().default('DeepSeek Harness')
    .description('Title used for desktop notifications.'),
})

/**
 * Fire a native desktop notification without any dependency:
 * osascript on macOS, notify-send on Linux, a PowerShell toast on Windows.
 *
 * Failures are swallowed — a notifier must never break the agent loop.
 * spawn() failures (missing binary, EACCES, …) are delivered ASYNCHRONOUSLY
 * as an `'error'` event on the returned ChildProcess, so a try/catch around
 * the synchronous spawn() call cannot catch them. Without an `'error'`
 * listener, Node rethrows the event and kills the whole dsh process — which
 * is exactly what happens on headless Linux with no `notify-send` installed.
 * We attach a no-op `'error'` listener on every platform branch to make sure
 * a missing or failing notifier binary can never take the host down.
 *
 * `deps.spawn` is injectable so the regression test can simulate an async
 * ENOENT without mutating `node:child_process` (a frozen built-in namespace).
 */
export function desktopNotify(title, body, { spawn = nodeSpawn } = {}) {
  try {
    if (process.platform === 'darwin') {
      const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      spawn('osascript', ['-e', `display notification "${esc(body)}" with title "${esc(title)}"`],
        { stdio: 'ignore', detached: true }).on('error', () => {}).unref()
    } else if (process.platform === 'linux') {
      spawn('notify-send', [title, body], { stdio: 'ignore', detached: true }).on('error', () => {}).unref()
    } else if (process.platform === 'win32') {
      const esc = (s) => String(s).replace(/'/g, "''")
      const ps = [
        "[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null;",
        "$t = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02);",
        `$t.GetElementsByTagName('text').Item(0).AppendChild($t.CreateTextNode('${esc(title)}')) | Out-Null;`,
        `$t.GetElementsByTagName('text').Item(1).AppendChild($t.CreateTextNode('${esc(body)}')) | Out-Null;`,
        `[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('${esc(title)}').Show([Windows.UI.Notifications.ToastNotification]::new($t));`,
      ].join(' ')
      spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', ps],
        { stdio: 'ignore', detached: true }).on('error', () => {}).unref()
    }
  } catch {}
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

export function apply(ctx, config) {
  // Turn timing, keyed by the live agent object; cleaned on agent/disposed.
  const startedAt = new Map()

  function notify(summary, body, level) {
    const text = body ? `${summary} — ${body}` : summary
    if (config.desktop) desktopNotify(config.title, text)
    if (config.webhookUrl) {
      fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text, summary, body, level, ts: new Date().toISOString() }),
      }).catch(() => {}) // never let a webhook failure surface into the agent loop
    }
  }

  // Turn finished: agent/status flips running -> idle (emit mode).
  ctx.on('agent/status', ({ agent, status }) => {
    if (status === 'running') {
      startedAt.set(agent, Date.now())
      return
    }
    const t0 = startedAt.get(agent)
    startedAt.delete(agent)
    if (!config.notifyOnIdle || t0 == null) return
    const elapsed = Date.now() - t0
    if (elapsed < config.minTurnDurationMs) return
    notify('Agent finished', `done in ${formatDuration(elapsed)}`, 'info')
  })

  // A step or turn errored (emit mode).
  ctx.on('agent/error', ({ error, turn, step }) => {
    if (!config.notifyOnError) return
    const detail = String(error?.message ?? error ?? 'unknown error').slice(0, 200)
    notify('Agent error', `turn ${turn}, step ${step}: ${detail}`, 'error')
  })

  // A tool call awaits approval. approval/request is a WATERFALL: this
  // listener only observes, so it must delegate with next() — returning
  // without it would claim the decision and swallow real answerers.
  ctx.on('approval/request', (req, next) => {
    if (config.notifyOnApproval) {
      const detail = req.reason ? `${req.toolName} — ${req.reason}` : req.toolName
      notify('Approval needed', detail, 'warn')
    }
    return next()
  })

  // Drop timing state for agents that leave the registry.
  ctx.on('agent/disposed', ({ agent }) => {
    startedAt.delete(agent)
  })

  // All listeners above are effects on ctx: they are removed automatically
  // when this plugin unloads or hot-reloads. No manual cleanup needed.
}
