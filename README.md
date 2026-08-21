# dsh-notification

> Desktop + webhook notifications for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness):
> know when your agent **finishes a turn**, **hits an error**, or is **waiting for your approval** —
> without watching the tab.

Long agent turns are the norm: you kick off a task, switch away, and come back to find the agent
finished five minutes ago — or worse, stuck on an approval prompt the whole time. `dsh-notification`
listens to the harness's own lifecycle events and pings you the moment your attention is needed.

## What it does

| Event | Trigger | Default |
|---|---|---|
| **Agent finished** | `agent/status` flips `running → idle`, and the turn ran ≥ `minTurnDurationMs` | on |
| **Agent error** | `agent/error` (a step or turn errored) | on |
| **Approval needed** | `approval/request` waterfall (observe-only; always delegates with `next()`) | on |

Each event can go to:
- **Desktop notification** — zero dependencies: `osascript` (macOS), `notify-send` (Linux),
  PowerShell toast (Windows).
- **Webhook** — a JSON `POST` with a Slack-compatible `text` field, so a Slack/Discord/generic
  incoming-webhook URL works out of the box.

## Install

```sh
dsh plugin --profile web add dsh-notification
# or straight from git:
dsh plugin --profile web add github:nishit130/dsh-notification
```

The package ships plain ESM JavaScript — no build step, so a git install needs no
`allowBuilds` entry.

## Configuration

Override the row in your profile's `cordis.patch.yml` (or via the Settings UI):

```yaml
- insert:
    - id: notify
      name: dsh-notification
      config:
        minTurnDurationMs: 10000        # only notify for turns ≥ 10s
        webhookUrl: 'https://hooks.slack.com/services/XXX/YYY/ZZZ'
        notifyOnApproval: true
        desktop: true
        title: 'DSH'
```

| Field | Type | Default | Meaning |
|---|---|---|---|
| `notifyOnIdle` | boolean | `true` | Notify when a turn finishes |
| `notifyOnError` | boolean | `true` | Notify on `agent/error` |
| `notifyOnApproval` | boolean | `true` | Notify when a tool call awaits approval |
| `minTurnDurationMs` | number | `5000` | Skip notifications for quick turns |
| `desktop` | boolean | `true` | Native desktop notification |
| `webhookUrl` | string | `''` | Optional POST target (Slack-compatible payload) |
| `title` | string | `'DeepSeek Harness'` | Desktop notification title |

### Webhook payload

```json
{
  "text": "Agent finished — done in 2m 14s",
  "summary": "Agent finished",
  "body": "done in 2m 14s",
  "level": "info",
  "ts": "2026-08-21T12:34:56.000Z"
}
```

## Design notes

- **Everything registered through `ctx` is an effect** — the listeners are removed automatically
  on unload/hot-reload; there is no manual cleanup path (Cordis revertible effects).
- **`approval/request` is a waterfall.** This plugin only observes it, so its listener always
  calls `next()` — returning without it would claim the decision and swallow the real answerers.
- **Never break the loop.** Desktop spawns are detached and fire-and-forget; webhook failures are
  swallowed. A notifier must never surface an error into the agent's turn.

## Local development

```sh
# from a harness source checkout
pnpm dsh web --patch ./path/to/dsh-notification/dev.patch.yml
```

with a `dev.patch.yml` pointing at the absolute path of `index.js`:

```yaml
- insert:
    - id: notify
      name: '/absolute/path/to/dsh-notification/index.js'
```

## License

MIT
