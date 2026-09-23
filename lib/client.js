window.__ModuleLoader__.load({
	id: "dsh-notification",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/shared.ts
		/** 插件包名, Client loader 注册 id 共用. */
		const PLUGIN_ID = "dsh-notification";
		/** 持久化 settings 命名空间, 与插件名一致. */
		const SETTINGS_NAMESPACE = PLUGIN_ID;
		/** 默认通知标题. */
		const DEFAULT_TITLE = "DeepSeek Harness";
		/** 默认最短回合时长 (毫秒). */
		const DEFAULT_MIN_TURN_MS = 5e3;
		/** settings 字段名, 给 Client `scope.set` 用. */
		const SETTINGS_FIELDS = {
			notifyOnIdle: "notifyOnIdle",
			notifyOnError: "notifyOnError",
			notifyOnApproval: "notifyOnApproval",
			minTurnDurationMs: "minTurnDurationMs",
			desktop: "desktop",
			browser: "browser",
			browserOnlyWhenHidden: "browserOnlyWhenHidden",
			webhookUrl: "webhookUrl",
			title: "title"
		};
		/** schema / 解码共用的默认值. */
		const DEFAULT_SETTINGS = {
			notifyOnIdle: true,
			notifyOnError: true,
			notifyOnApproval: true,
			minTurnDurationMs: DEFAULT_MIN_TURN_MS,
			desktop: true,
			browser: true,
			browserOnlyWhenHidden: true,
			webhookUrl: "",
			title: DEFAULT_TITLE
		};
		/**
		* 把未知值收成非负有限数字.
		* @param value - settings 原始值.
		* @param fallback - 非法时的回退.
		* @returns 非负有限数字.
		*/
		function asNonNegativeNumber(value, fallback) {
			const n = typeof value === "number" ? value : Number(value);
			if (!Number.isFinite(n) || n < 0) return fallback;
			return n;
		}
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
		//#region src/client/locales.ts
		/**
		* dsh-notification locale 命名空间: 独立设置页文案. 中文为基准, 英文镜像.
		*/
		/** 简体中文字典 (key 集合的唯一来源). */
		const zh = {
			"page.title": "通知",
			"page.description": "回合结束, 出错或等待审批时, 发系统通知, 浏览器弹窗或 webhook.",
			"page.events": "触发事件",
			"page.channels": "通知渠道",
			"settings.desktop.title": "系统通知",
			"settings.desktop.description": "在运行 dsh 的机器上弹出操作系统原生通知. 关掉后浏览器通知和 webhook 不受影响.",
			"settings.notifyOnIdle.title": "回合结束",
			"settings.notifyOnIdle.description": "agent 从 running 回到 idle 时通知.",
			"settings.notifyOnError.title": "出错",
			"settings.notifyOnError.description": "步骤或回合报错时通知.",
			"settings.notifyOnApproval.title": "等待审批",
			"settings.notifyOnApproval.description": "工具调用需要你确认时通知. 关掉后仍会把审批交给真正的审批器.",
			"settings.minTurnDurationMs.title": "最短回合时长 (毫秒)",
			"settings.minTurnDurationMs.description": "短于此时长的回合不发 \"跑完了\" 通知, 用来跳过快速回复.",
			"settings.browser.title": "浏览器通知",
			"settings.browser.description": "在打开 Web UI 的机器上弹出浏览器 Notification.",
			"settings.browserOnlyWhenHidden.title": "仅在标签页隐藏时弹出",
			"settings.browserOnlyWhenHidden.description": "当前标签页可见时不弹浏览器通知.",
			"settings.titleField.title": "通知标题",
			"settings.titleField.description": "桌面和浏览器通知共用的标题.",
			"settings.webhookUrl.title": "Webhook URL",
			"settings.webhookUrl.description": "可选 POST 目标, Slack 兼容 text 字段. 留空即关闭.",
			"settings.webhookUrl.placeholder": "https://hooks.slack.com/services/..."
		};
		/** 英文词典, 与 zh key 集合完全对齐. */
		const en = {
			"page.title": "Notifications",
			"page.description": "Desktop, browser, or webhook alerts when a turn finishes, errors, or waits for approval.",
			"page.events": "Events",
			"page.channels": "Channels",
			"settings.desktop.title": "System notifications",
			"settings.desktop.description": "Native OS notifications on the machine running dsh. Turning this off leaves browser popups and webhooks unchanged.",
			"settings.notifyOnIdle.title": "Turn finished",
			"settings.notifyOnIdle.description": "Notify when the agent flips from running back to idle.",
			"settings.notifyOnError.title": "Errors",
			"settings.notifyOnError.description": "Notify when a step or turn reports an error.",
			"settings.notifyOnApproval.title": "Approval needed",
			"settings.notifyOnApproval.description": "Notify when a tool call waits for confirmation. Turning this off still forwards the request to the real approver.",
			"settings.minTurnDurationMs.title": "Minimum turn duration (ms)",
			"settings.minTurnDurationMs.description": "Skip the \"finished\" alert for turns shorter than this, so quick replies stay quiet.",
			"settings.browser.title": "Browser notifications",
			"settings.browser.description": "Browser Notification popups on the machine viewing the Web UI.",
			"settings.browserOnlyWhenHidden.title": "Only while the tab is hidden",
			"settings.browserOnlyWhenHidden.description": "Do not show browser popups while this tab is visible.",
			"settings.titleField.title": "Notification title",
			"settings.titleField.description": "Shared title for desktop and browser notifications.",
			"settings.webhookUrl.title": "Webhook URL",
			"settings.webhookUrl.description": "Optional POST target with a Slack-compatible text field. Leave empty to disable.",
			"settings.webhookUrl.placeholder": "https://hooks.slack.com/services/..."
		};
		/** Locale 命名空间 id. */
		const NS = "dsh-notification";
		//#endregion
		//#region src/client/controls.tsx
		/**
		* 主题化开关, 设置页开关行使用.
		*/
		function Switch({ checked, label, disabled = false, onToggle }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				role: "switch",
				className: "dsh-notification-switch",
				"aria-checked": checked,
				"aria-label": label,
				disabled,
				onClick: () => {
					if (!disabled) onToggle();
				},
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "dsh-notification-thumb" })
			});
		}
		/**
		* 设置页文本 / 数字输入框. 失焦或回车时提交.
		*/
		function TextControl({ id, value, placeholder, type = "text", numeric = false, disabled = false, onChange, onCommit }) {
			const onKeyDown = (event) => {
				if (event.key === "Enter") event.currentTarget.blur();
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
				id,
				className: "dsh-notification-input",
				type,
				inputMode: numeric ? "numeric" : void 0,
				value,
				placeholder: placeholder ?? "",
				disabled,
				spellCheck: false,
				autoComplete: "off",
				onChange: (event) => {
					onChange(event.currentTarget.value);
				},
				onBlur: onCommit,
				onKeyDown
			});
		}
		//#endregion
		//#region src/client/settings-section.tsx
		function liveSettings$1(scope) {
			return scope.getSnapshot().value ?? DEFAULT_SETTINGS;
		}
		function Panel({ title, children }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsh-notification-panel",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dsh-notification-panel-title",
					children: title
				}), children]
			});
		}
		function SwitchField({ scope, settings, field, title, description, disabled = false }) {
			const checked = settings[field];
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsh-notification-switch-row",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsh-notification-text",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dsh-notification-title",
						children: title
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dsh-notification-desc",
						children: description
					})]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Switch, {
					checked,
					label: title,
					disabled,
					onToggle: () => {
						scope.set(SETTINGS_FIELDS[field], !checked);
					}
				})]
			});
		}
		function DraftField({ id, title, description, saved, placeholder, type, numeric, disabled, onCommit }) {
			const [draft, setDraft] = (0, react.useState)(null);
			const value = draft ?? saved;
			const commit = () => {
				if (draft === null || draft === saved) {
					setDraft(null);
					return;
				}
				onCommit(draft);
				setDraft(null);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsh-notification-field",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
						className: "dsh-notification-title",
						htmlFor: id,
						children: title
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(TextControl, {
						id,
						value,
						placeholder,
						type,
						numeric,
						disabled,
						onChange: setDraft,
						onCommit: commit
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "dsh-notification-desc",
						children: description
					})
				]
			});
		}
		/**
		* Settings 侧栏里的通知页, 覆盖全部可调字段, 写入即时生效.
		*/
		function NotificationSettingsSection({ scope, t }) {
			const settings = (0, react.useSyncExternalStore)((onChange) => scope.subscribe(onChange), () => liveSettings$1(scope));
			const commitMinTurn = (raw) => {
				const trimmed = raw.trim();
				const next = trimmed === "" ? DEFAULT_MIN_TURN_MS : asNonNegativeNumber(trimmed, settings.minTurnDurationMs);
				scope.set(SETTINGS_FIELDS.minTurnDurationMs, next);
			};
			const commitTitle = (raw) => {
				const next = raw.trim();
				scope.set(SETTINGS_FIELDS.title, next === "" ? DEFAULT_TITLE : next);
			};
			const commitWebhook = (raw) => {
				scope.set(SETTINGS_FIELDS.webhookUrl, raw.trim());
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: "dsh-notification-section",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						className: "dsh-notification-heading",
						children: t("page.title")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "dsh-notification-intro",
						children: t("page.description")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Panel, {
						title: t("page.events"),
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SwitchField, {
								scope,
								settings,
								field: "notifyOnIdle",
								title: t("settings.notifyOnIdle.title"),
								description: t("settings.notifyOnIdle.description")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SwitchField, {
								scope,
								settings,
								field: "notifyOnError",
								title: t("settings.notifyOnError.title"),
								description: t("settings.notifyOnError.description")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SwitchField, {
								scope,
								settings,
								field: "notifyOnApproval",
								title: t("settings.notifyOnApproval.title"),
								description: t("settings.notifyOnApproval.description")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(DraftField, {
								id: "dsh-notification-min-turn",
								title: t("settings.minTurnDurationMs.title"),
								description: t("settings.minTurnDurationMs.description"),
								saved: String(settings.minTurnDurationMs),
								numeric: true,
								disabled: !settings.notifyOnIdle,
								onCommit: commitMinTurn
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Panel, {
						title: t("page.channels"),
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SwitchField, {
								scope,
								settings,
								field: "desktop",
								title: t("settings.desktop.title"),
								description: t("settings.desktop.description")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SwitchField, {
								scope,
								settings,
								field: "browser",
								title: t("settings.browser.title"),
								description: t("settings.browser.description")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SwitchField, {
								scope,
								settings,
								field: "browserOnlyWhenHidden",
								title: t("settings.browserOnlyWhenHidden.title"),
								description: t("settings.browserOnlyWhenHidden.description"),
								disabled: !settings.browser
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(DraftField, {
								id: "dsh-notification-title",
								title: t("settings.titleField.title"),
								description: t("settings.titleField.description"),
								saved: settings.title,
								onCommit: commitTitle
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(DraftField, {
								id: "dsh-notification-webhook",
								title: t("settings.webhookUrl.title"),
								description: t("settings.webhookUrl.description"),
								saved: settings.webhookUrl,
								placeholder: t("settings.webhookUrl.placeholder"),
								type: "url",
								onCommit: commitWebhook
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region src/client/session-watch.ts
		function canNotify() {
			return typeof Notification !== "undefined";
		}
		/**
		* 在第一次用户手势上申请 Notification 权限, 不阻塞.
		* @returns 取消手势监听的 disposer.
		*/
		function ensurePermission() {
			if (!canNotify() || Notification.permission !== "default") return () => {};
			const ask = () => {
				window.removeEventListener("pointerdown", ask, true);
				window.removeEventListener("keydown", ask, true);
				try {
					Notification.requestPermission().catch(() => {});
				} catch {}
			};
			window.addEventListener("pointerdown", ask, true);
			window.addEventListener("keydown", ask, true);
			return () => {
				window.removeEventListener("pointerdown", ask, true);
				window.removeEventListener("keydown", ask, true);
			};
		}
		function liveSettings(scope) {
			return scope.getSnapshot().value ?? DEFAULT_SETTINGS;
		}
		function snapshotRow(row) {
			return {
				pending: row.pendingInteraction,
				running: Boolean(row.running),
				runningSince: 0
			};
		}
		function show(config, body) {
			if (!config.browser) return;
			if (!canNotify() || Notification.permission !== "granted") return;
			if (config.browserOnlyWhenHidden && document.visibilityState === "visible") return;
			try {
				const popup = new Notification(config.title, {
					body,
					tag: PLUGIN_ID
				});
				popup.onclick = () => {
					try {
						window.focus();
					} catch {}
					popup.close();
				};
			} catch {}
		}
		/**
		* 盯着 client session list, 在回合结束或等待用户时弹浏览器通知.
		* @param list - sessions.list.
		* @param scope - 已绑定的 settings scope.
		* @returns 取消订阅函数.
		*/
		function watchSessions(list, scope) {
			const prev = /* @__PURE__ */ new Map();
			const seed = () => {
				prev.clear();
				const snap = list.getSnapshot();
				for (const id of snap.ids ?? []) {
					const row = snap.byId?.[id];
					if (row) prev.set(id, snapshotRow(row));
				}
			};
			seed();
			return list.subscribe(() => {
				const config = liveSettings(scope);
				const snap = list.getSnapshot();
				for (const id of snap.ids ?? []) {
					const row = snap.byId?.[id];
					if (!row) continue;
					if (row.origin === "subagent") continue;
					let tracked = prev.get(id);
					if (!tracked) {
						prev.set(id, snapshotRow(row));
						continue;
					}
					if (!tracked.running && row.running) tracked.runningSince = Date.now();
					if (config.notifyOnApproval && tracked.pending === void 0 && row.pendingInteraction !== void 0) show(config, `Waiting for you — ${typeof row.pendingInteraction === "string" ? row.pendingInteraction : "input"}`);
					if (config.notifyOnIdle && tracked.running && !row.running && row.pendingInteraction === void 0) {
						const elapsed = tracked.runningSince ? Date.now() - tracked.runningSince : null;
						if (elapsed === null || elapsed >= config.minTurnDurationMs) show(config, elapsed === null ? "Agent finished" : `Agent finished — ${formatDuration(elapsed)}`);
					}
					tracked = {
						pending: row.pendingInteraction,
						running: Boolean(row.running),
						runningSince: tracked.runningSince
					};
					prev.set(id, tracked);
				}
			});
		}
		//#endregion
		//#region src/client/styles.ts
		const CSS_TEXT = `
.dsh-notification-section {
  max-width: 760px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dsh-notification-heading {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary);
}

.dsh-notification-intro {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--dsw-alias-label-tertiary);
}

.dsh-notification-panel {
  display: flex;
  flex-direction: column;
  background: var(--dsw-alias-bg-layer-3);
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 12px;
  padding: 4px 12px 8px;
}

.dsh-notification-panel-title {
  padding: 12px 0 4px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--dsw-alias-label-primary);
}

.dsh-notification-panel > * + * {
  border-top: 1px solid var(--dsw-alias-border-l2);
}

.dsh-notification-switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 12px 0;
}

.dsh-notification-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 48px;
}

.dsh-notification-title {
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
}

.dsh-notification-desc {
  margin: 0;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
}

.dsh-notification-switch {
  box-sizing: border-box;
  position: relative;
  flex: 0 0 auto;
  width: 36px;
  height: 20px;
  padding: 2px;
  border: 0;
  border-radius: 10px;
  background: var(--dsw-alias-border-l3);
  cursor: pointer;
}

.dsh-notification-switch[aria-checked='true'] {
  background: var(--dsw-alias-brand-primary);
}

.dsh-notification-switch:hover:not(:disabled) {
  filter: brightness(1.05);
}

.dsh-notification-switch:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 2px;
}

.dsh-notification-switch:disabled {
  cursor: default;
  opacity: 0.5;
}

.dsh-notification-thumb {
  display: block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--dsw-alias-label-primary-foreground, #fff);
  transition: transform 120ms ease;
}

.dsh-notification-switch[aria-checked='true'] .dsh-notification-thumb {
  transform: translateX(16px);
}

.dsh-notification-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 0;
}

.dsh-notification-field .dsh-notification-title {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.5;
}

.dsh-notification-input {
  height: 34px;
  padding: 0 12px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-3);
  font: inherit;
  font-size: 13px;
  line-height: 1.5;
  color: var(--dsw-alias-label-primary);
}

.dsh-notification-input:focus-visible {
  outline: none;
  border-color: var(--dsw-alias-brand-primary);
}

.dsh-notification-input:disabled {
  color: var(--dsw-alias-label-tertiary);
  cursor: default;
}

@media (max-width: 640px) {
  .dsh-notification-switch-row {
    flex-direction: column;
    align-items: stretch;
  }

  .dsh-notification-text {
    padding-right: 0;
  }

  .dsh-notification-switch {
    align-self: flex-end;
  }

  .dsh-notification-input {
    width: 100%;
  }
}
`.trim();
		/**
		* 把插件样式注入 document, 重复调用是空操作.
		*/
		function injectStyles() {
			if (typeof document === "undefined") return;
			if (document.querySelector(`style[data-plugin-css="dsh-notification"]`) !== null) return;
			const style = document.createElement("style");
			style.dataset.pluginCss = PLUGIN_ID;
			style.textContent = CSS_TEXT;
			document.head.appendChild(style);
		}
		//#endregion
		//#region src/client/index.ts
		/**
		* dsh-notification 浏览器半区.
		*
		* 盯着 session list 弹浏览器通知, 并在 Settings 侧栏挂独立通知页.
		*/
		const inject = [
			"slots",
			"locale",
			"configForms",
			"sessions"
		];
		/**
		* 注入样式, 订阅浏览器通知, 并挂上独立设置页.
		* @param ctx - Web Client 插件上下文.
		*/
		function apply(ctx) {
			ctx.logger.info("dsh-notification: client applying");
			injectStyles();
			const scope = ctx.configForms.get(SETTINGS_NAMESPACE);
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsh-notification: dictionaries");
			ctx.effect(() => ensurePermission(), "dsh-notification: permission");
			const list = (ctx.sessions ?? ctx.get("sessions"))?.list;
			if (list) ctx.effect(() => watchSessions(list, scope), "dsh-notification: session watch");
			const t = ctx.locale.bind(NS);
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: PLUGIN_ID,
				order: 40,
				label: () => t("page.title"),
				locale: NS
			}, () => (0, react.createElement)(NotificationSettingsSection, {
				scope,
				t
			})));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map