# Changelog

## Unreleased

### Fixed
- Desktop notifications no longer crash the dsh host process when the
  notifier binary is missing (e.g. headless Linux without `notify-send`).
  `spawn()` failures are delivered asynchronously as an `'error'` event on
  the returned ChildProcess, so the existing try/catch could not catch them
  and Node rethrew the event as `uncaughtException` on every turn end.
  Every platform branch now attaches a no-op `'error'` listener synchronously,
  keeping the notifier strictly best-effort. (closes #1)

## 0.1.1 — 2026-08-21

### Added
- **Browser notification channel**: a web client half (`dsh.client`) that watches the
  session list and fires `Notification` popups on the machine viewing the Web UI —
  covering the remote-server topology where host desktop notifications fire out of sight.
  New config: `browser` (default `true`), `browserOnlyWhenHidden` (default `true`).
- Smoke-test suite (`npm test`) and CI on Node 20/22.

### Changed
- `@deepseek-ai/schemastery` moved from `dependencies` to `peerDependencies` — the
  runtime context supplies one shared copy.

## 0.1.0 — 2026-08-21

Initial release.

- Desktop notifications on the server host (macOS `osascript`, Linux `notify-send`,
  Windows PowerShell toast), zero dependencies.
- Optional webhook `POST` with a Slack-compatible `text` field.
- Events: turn finished (`agent/status`, gated by `minTurnDurationMs`), agent error
  (`agent/error`), approval pending (`approval/request`, observe-only).
- Effect-bound listeners: automatic cleanup on unload and hot reload.
