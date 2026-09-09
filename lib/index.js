import z from "@deepseek-ai/schemastery";
import { spawn } from "node:child_process";
//#region src/desktop.ts
/**
* 发一条系统原生通知, 不引入第三方依赖:
* macOS 走 osascript, Linux 走 notify-send, Windows 走 PowerShell toast.
* 失败全部吞掉, 通知器不能打断 agent 循环.
* @param title - 通知标题.
* @param body - 通知正文.
*/
function desktopNotify(title, body) {
	try {
		if (process.platform === "darwin") {
			const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
			spawn("osascript", ["-e", `display notification "${esc(body)}" with title "${esc(title)}"`], {
				stdio: "ignore",
				detached: true
			}).unref();
			return;
		}
		if (process.platform === "linux") {
			spawn("notify-send", [title, body], {
				stdio: "ignore",
				detached: true
			}).unref();
			return;
		}
		if (process.platform === "win32") {
			const esc = (s) => String(s).replace(/'/g, "''");
			const ps = [
				"[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null;",
				"$t = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02);",
				`$t.GetElementsByTagName('text').Item(0).AppendChild($t.CreateTextNode('${esc(title)}')) | Out-Null;`,
				`$t.GetElementsByTagName('text').Item(1).AppendChild($t.CreateTextNode('${esc(body)}')) | Out-Null;`,
				`[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('${esc(title)}').Show([Windows.UI.Notifications.ToastNotification]::new($t));`
			].join(" ");
			spawn("powershell", [
				"-NoProfile",
				"-NonInteractive",
				"-Command",
				ps
			], {
				stdio: "ignore",
				detached: true
			}).unref();
		}
	} catch {}
}
//#endregion
//#region src/shared.ts
/** 插件包名, Client loader 注册 id 共用. */
const PLUGIN_ID = "dsh-notification";
/** Host Cordis 插件名. */
const PLUGIN_NAME = PLUGIN_ID;
/** 持久化 settings 命名空间, 与插件名一致. */
const SETTINGS_NAMESPACE = PLUGIN_ID;
/** 默认通知标题. */
const DEFAULT_TITLE = "DeepSeek Harness";
/** 默认最短回合时长 (毫秒). */
const DEFAULT_MIN_TURN_MS = 5e3;
/**
* 把毫秒格式化成短时长文案.
* @param ms - 经过的毫秒.
* @returns 例如 `1.2s` 不会出现, 而是 `12s` / `2m 3s`.
*/
function formatDuration(ms) {
	if (ms < 1e3) return `${Math.round(ms)}ms`;
	const s = Math.round(ms / 1e3);
	if (s < 60) return `${s}s`;
	return `${Math.floor(s / 60)}m ${s % 60}s`;
}
//#endregion
//#region src/webhook.ts
/**
* POST 一条 webhook. 失败吞掉, 不能打断 agent 循环.
* @param url - 目标 URL.
* @param payload - JSON 载荷.
*/
function postWebhook(url, payload) {
	fetch(url, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(payload)
	}).catch(() => {});
}
//#endregion
//#region src/host.ts
/**
* 按当前设置发桌面通知和 webhook.
* @param config - 当前解析后的设置.
* @param summary - 短标题.
* @param body - 详细正文.
* @param level - 级别.
*/
function notify(config, summary, body, level) {
	const text = body ? `${summary} — ${body}` : summary;
	if (config.desktop) desktopNotify(config.title, text);
	if (config.webhookUrl) postWebhook(config.webhookUrl, {
		text,
		summary,
		body,
		level,
		ts: (/* @__PURE__ */ new Date()).toISOString()
	});
}
/**
* 挂上 Host 生命周期监听. 每次通知都读取 current(), 所以 settings 热更新立刻生效.
* @param ctx - Host 插件上下文.
* @param current - 当前解析后的设置.
*/
function bindListeners(ctx, current) {
	const startedAt = /* @__PURE__ */ new Map();
	ctx.on("agent/status", ((event) => {
		const { agent, status } = event;
		if (status === "running") {
			startedAt.set(agent, Date.now());
			return;
		}
		const t0 = startedAt.get(agent);
		startedAt.delete(agent);
		const config = current();
		if (!config.notifyOnIdle || t0 == null) return;
		const elapsed = Date.now() - t0;
		if (elapsed < config.minTurnDurationMs) return;
		notify(config, "Agent finished", `done in ${formatDuration(elapsed)}`, "info");
	}));
	ctx.on("agent/error", ((event) => {
		const config = current();
		if (!config.notifyOnError) return;
		const raw = event.error;
		const message = typeof raw === "string" ? raw : raw?.message;
		const detail = String(message ?? "unknown error").slice(0, 200);
		notify(config, "Agent error", `turn ${event.turn}, step ${event.step}: ${detail}`, "error");
	}));
	ctx.on("approval/request", ((req, next) => {
		const config = current();
		if (config.notifyOnApproval) notify(config, "Approval needed", req.reason ? `${req.toolName} — ${req.reason}` : String(req.toolName ?? "tool"), "warn");
		return next();
	}));
	ctx.on("agent/disposed", ((event) => {
		startedAt.delete(event.agent);
	}));
}
//#endregion
//#region src/index.ts
const name = PLUGIN_NAME;
/** Loader / settings 共用的通知 schema. */
const Config = z.object({
	notifyOnIdle: z.boolean().default(true).description("Notify when an agent finishes a turn (status flips to idle)."),
	notifyOnError: z.boolean().default(true).description("Notify when a step or turn errors (agent/error)."),
	notifyOnApproval: z.boolean().default(true).description("Notify when a tool call is waiting for user approval."),
	minTurnDurationMs: z.number().min(0).default(DEFAULT_MIN_TURN_MS).description("Only notify for turns that ran at least this long, to skip quick replies."),
	desktop: z.boolean().default(true).description("Show a native desktop notification on the machine running the dsh server."),
	browser: z.boolean().default(true).description("Show browser Notification popups in the Web UI."),
	browserOnlyWhenHidden: z.boolean().default(true).description("Only show browser notifications while the tab is hidden."),
	webhookUrl: z.string().default("").description("Optional URL to POST a JSON payload to (Slack-compatible text field included)."),
	title: z.string().default(DEFAULT_TITLE).description("Title used for desktop and browser notifications.")
});
/**
* 注册 settings 命名空间, 并把 Loader 行配置作为 composition 底.
* @param ctx - Host 插件上下文.
* @param config - Loader 校验后的行配置, 缺省时使用 schema 默认值.
*/
function apply(ctx, config) {
	const resolved = Config(config);
	let source = () => resolved;
	ctx.logger.info("dsh-notification: host loaded, desktop=%s browser=%s", resolved.desktop, resolved.browser);
	ctx.inject(["settings"], (settingsCtx) => {
		settingsCtx.settings.installSection(ctx, SETTINGS_NAMESPACE, Config, resolved, {
			setSource: (current) => {
				source = current;
			},
			onChange: () => {
				const next = source();
				settingsCtx.logger.info("dsh-notification: settings desktop=%s browser=%s webhook=%s", next.desktop, next.browser, next.webhookUrl ? "on" : "off");
			}
		});
	});
	bindListeners(ctx, () => source());
}
//#endregion
export { Config, apply, name };

//# sourceMappingURL=index.js.map