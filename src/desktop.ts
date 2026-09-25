import { spawn } from 'node:child_process'

/**
 * 发一条系统原生通知, 不引入第三方依赖:
 * macOS 走 osascript, Linux 走 notify-send, Windows 走 PowerShell toast.
 * 失败全部吞掉, 通知器不能打断 agent 循环.
 *
 * spawn() 的失败 (找不到可执行文件, EACCES 等) 是异步地以 'error' 事件送到
 * ChildProcess 上的, 同步 try/catch 接不到; 没有 'error' 监听时 Node 会把它
 * 当 uncaughtException 抛出, 在没装 notify-send 的 headless Linux 上会直接
 * 带走整个 dsh 进程. 所以每个平台分支都同步挂一个空的 'error' 监听.
 * @param title - 通知标题.
 * @param body - 通知正文.
 */
export function desktopNotify(title: string, body: string): void {
  try {
    if (process.platform === 'darwin') {
      const esc = (s: string): string => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      spawn('osascript', ['-e', `display notification "${esc(body)}" with title "${esc(title)}"`], {
        stdio: 'ignore',
        detached: true,
      }).on('error', () => {}).unref()
      return
    }
    if (process.platform === 'linux') {
      spawn('notify-send', [title, body], { stdio: 'ignore', detached: true }).on('error', () => {}).unref()
      return
    }
    if (process.platform === 'win32') {
      const esc = (s: string): string => String(s).replace(/'/g, "''")
      const ps = [
        '[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null;',
        '$t = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02);',
        `$t.GetElementsByTagName('text').Item(0).AppendChild($t.CreateTextNode('${esc(title)}')) | Out-Null;`,
        `$t.GetElementsByTagName('text').Item(1).AppendChild($t.CreateTextNode('${esc(body)}')) | Out-Null;`,
        `[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('${esc(title)}').Show([Windows.UI.Notifications.ToastNotification]::new($t));`,
      ].join(' ')
      spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', ps], {
        stdio: 'ignore',
        detached: true,
      }).on('error', () => {}).unref()
    }
  } catch {
    // 通知失败不能冒泡进 agent 循环.
  }
}
