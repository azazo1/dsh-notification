# dsh-notification

> 给 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的桌面, 浏览器和 webhook 通知:
> 知道 agent **跑完一轮**, **出错**, 或 **在等你审批**, 不用一直盯着标签页.

长回合是常态: 丢出去一个任务, 切走, 回来发现五分钟前就结束了, 或者卡在审批上. `dsh-notification` 听 harness 自己的生命周期事件, 需要你看的时候再叫你.

## 它做什么

| 事件 | 触发 | 默认 |
|---|---|---|
| **Agent finished** | `agent/status` 从 `running` 变成 `idle`, 且回合时长 >= `minTurnDurationMs` | 开 |
| **Agent error** | `agent/error` | 开 |
| **Approval needed** | `approval/request` 瀑布流 (只观察, 一定 `next()`) | 开 |

每个事件可以发到:

- **系统通知** — 零依赖: `osascript` (macOS), `notify-send` (Linux), PowerShell toast (Windows).
- **浏览器通知** — 在打开 Web UI 的那台机器上弹 `Notification`.
- **Webhook** — JSON `POST`, 带 Slack 兼容的 `text` 字段.

## 安装

Web 端装进 `web` profile:

```shell
dsh plugin --profile web add azazo1/dsh-notification
```

装完重启 `dsh web`, 浏览器里刷新一次页面.

桌面端装进 `desktop` profile. 它由 Electron 应用独占管理, `dsh plugin` 会拒绝 `--profile desktop`, 所以要用应用内的插件管理器: 在插件页的安装入口填上面命令里对应的包名或本地目录. 装上后重启应用, 窗口刷新一次.

引擎版本线要求 `@deepseek-ai/dsh-*` 不低于 `0.1.7-rc.2`, 且仍在 `0.1.x` 上 (peerDependencies 与 devDependencies 都写作 `>=0.1.7-rc.2 <0.2.0`). 更早的引擎线装不上这个版本.

web 与 desktop 两个 profile 跑的是同一套 Web 应用, 桌面端只是多起一个 Host 子进程并给 `<html>` 打上平台标记, 所以同一份包在两边通用, 不需要分别构建.

## 通知出现在哪

| 渠道 | 打在哪 | 适合 |
|---|---|---|
| Desktop (`desktop`) | 跑 `dsh` 的那台机器 | 本机 `dsh web` |
| Browser (`browser`) | 打开 Web UI 的那台机器 | 远端 server, 或任何 Web UI |
| Webhook (`webhookUrl`) | URL 指向的地方 | 手机, Slack, 无人值守 |

浏览器通知默认只在标签页隐藏时弹出. 本机同时开着系统通知和浏览器通知时, 同一事件会弹两次, 关掉其中一条即可.

## 配置

完整选项写在 `$DSH_HOME/settings.yaml`, 改完即时生效, 不用重启:

```yaml
dsh-notification:
  desktop: false
  browser: true
  minTurnDurationMs: 10000
  webhookUrl: 'https://hooks.slack.com/services/XXX/YYY/ZZZ'
  title: DSH
```

Web UI 的 **设置 > 通知** 覆盖全部字段, 改完即时生效.

| 字段 | 类型 | 默认 | 含义 |
|---|---|---|---|
| `notifyOnIdle` | boolean | `true` | 回合结束时通知 |
| `notifyOnError` | boolean | `true` | `agent/error` 时通知 |
| `notifyOnApproval` | boolean | `true` | 等待审批时通知 |
| `minTurnDurationMs` | number | `5000` | 短回合不发 "跑完了" |
| `desktop` | boolean | `true` | 系统原生通知 |
| `browser` | boolean | `true` | 浏览器 Notification |
| `browserOnlyWhenHidden` | boolean | `true` | 标签页可见时不弹浏览器通知 |
| `webhookUrl` | string | `''` | 可选 POST 目标 |
| `title` | string | `'DeepSeek Harness'` | 桌面 / 浏览器标题 |

Loader 行 config (profile `cordis.patch.yml`) 是 composition 底, `settings.yaml` 叠在上面.

```yaml
- id: notify
  config:
    minTurnDurationMs: 10000
```

id 针对性 patch 不会深合并, 会整份替换该插件 config.

### Webhook 载荷

```json
{
  "text": "Agent finished — done in 2m 14s",
  "summary": "Agent finished",
  "body": "done in 2m 14s",
  "level": "info",
  "ts": "2026-08-21T12:34:56.000Z"
}
```

## 设计要点

- 经 `ctx` 注册的都是 effect, 卸载 / 热重载会自动摘掉监听.
- `approval/request` 是瀑布流. 本插件只观察, 监听器一定调用 `next()`.
- 桌面 spawn 分离且 fire-and-forget, webhook 失败吞掉, 通知器不能冒泡进 agent 回合.

## 本地开发

复制 `dev.patch.example.yml` 为 `dev.patch.yml` (已被 gitignore), 填 checkout 绝对路径, 然后在 harness 源码目录:

```sh
pnpm dsh web --patch ./path/to/dsh-notification/dev.patch.yml
```

```sh
just verify
```

## License

MIT
