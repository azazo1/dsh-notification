window.__ModuleLoader__.load({
	id: "dsh-notification",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/shared.ts
		/** 插件包名, Client loader 注册 id 共用. */
		const PLUGIN_ID = "dsh-notification";
		/** profile 条目 id: configForms 表单按它寻址, 等于 patch 里那一行的 id. */
		const ENTRY_ID = "notify";
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
		/** 本插件字典的命名空间, 与包名一致. */
		const NS = "dsh-notification";
		/** English copy. */
		const en = {
			description: "Desktop, browser, or webhook alerts when a turn finishes, errors, or waits for approval.",
			eventsGroup: "Events",
			channelsGroup: "Channels",
			notifyOnIdle: "Turn finished",
			notifyOnIdleHint: "Notify when the agent flips from running back to idle.",
			notifyOnError: "Errors",
			notifyOnErrorHint: "Notify when a step or turn reports an error.",
			notifyOnApproval: "Approval needed",
			notifyOnApprovalHint: "Notify when a tool call waits for confirmation. Turning this off still forwards the request to the real approver.",
			desktop: "System notifications",
			desktopHint: "Native OS notifications on the machine running dsh. Turning this off leaves browser popups and webhooks unchanged.",
			browser: "Browser notifications",
			browserHint: "Browser Notification popups on the machine viewing the Web UI.",
			browserOnlyWhenHidden: "Only while the tab is hidden",
			browserOnlyWhenHiddenHint: "Skip browser popups while this tab is visible.",
			minTurnDurationMs: "Minimum turn duration (ms)",
			minTurnDurationMsHint: "Skip the \"finished\" alert for turns shorter than this, so quick replies stay quiet.",
			titleField: "Notification title",
			titleFieldHint: "Shared title for desktop and browser notifications.",
			webhookUrl: "Webhook URL",
			webhookUrlHint: "Optional POST target with a Slack-compatible text field. Leave empty to disable.",
			webhookUrlPlaceholder: "https://hooks.slack.com/services/...",
			overridden: "Overridden",
			reset: "Reset to default",
			invalidNumber: "Enter a whole number of milliseconds, or leave blank to use the default.",
			readOnly: "This deployment stores settings read-only.",
			unavailable: "This plugin is not loaded, so it cannot be configured right now.",
			save: "Save",
			saving: "Saving...",
			saveFailed: "The deployment did not accept these values; they were left for you to correct."
		};
		/** Simplified Chinese copy. */
		const zh = {
			description: "回合结束, 出错或等待审批时, 发系统通知, 浏览器弹窗或 webhook.",
			eventsGroup: "触发事件",
			channelsGroup: "通知渠道",
			notifyOnIdle: "回合结束",
			notifyOnIdleHint: "agent 从 running 回到 idle 时通知.",
			notifyOnError: "出错",
			notifyOnErrorHint: "步骤或回合报错时通知.",
			notifyOnApproval: "等待审批",
			notifyOnApprovalHint: "工具调用需要你确认时通知. 关掉后仍会把审批交给真正的审批器.",
			desktop: "系统通知",
			desktopHint: "在运行 dsh 的机器上弹出操作系统原生通知. 关掉后浏览器通知和 webhook 不受影响.",
			browser: "浏览器通知",
			browserHint: "在打开 Web UI 的机器上弹出浏览器 Notification.",
			browserOnlyWhenHidden: "仅在标签页隐藏时弹出",
			browserOnlyWhenHiddenHint: "当前标签页可见时不弹浏览器通知.",
			minTurnDurationMs: "最短回合时长 (毫秒)",
			minTurnDurationMsHint: "短于此时长的回合不发 \"跑完了\" 通知, 用来跳过快速回复.",
			titleField: "通知标题",
			titleFieldHint: "桌面和浏览器通知共用的标题.",
			webhookUrl: "Webhook URL",
			webhookUrlHint: "可选 POST 目标, Slack 兼容 text 字段. 留空即关闭.",
			webhookUrlPlaceholder: "https://hooks.slack.com/services/...",
			overridden: "已覆盖",
			reset: "恢复默认",
			invalidNumber: "请填整数毫秒数; 留空表示使用默认值.",
			readOnly: "本部署的设置为只读.",
			unavailable: "该插件当前未加载, 暂时无法配置.",
			save: "保存",
			saving: "保存中...",
			saveFailed: "本部署没有接受这些值, 已保留供你修改."
		};
		/**
		* 表单框架要的文案, 从本插件字典取.
		* @param t - 本插件字典的读取函数.
		* @returns 共享设置表单渲染的标签.
		*/
		function formLabels(t) {
			return {
				unavailable: t("unavailable"),
				readOnly: t("readOnly"),
				saveFailed: t("saveFailed"),
				save: t("save"),
				saving: t("saving")
			};
		}
		//#endregion
		//#region src/client/fields.tsx
		/**
		* 配置卡片里的开关字段行与分组标题.
		*
		* 官方字段控件只覆盖文本与数字, 布尔字段由这里用官方 Switch 拼出,
		* 排版沿用官方 fields.module.css 的尺寸与间距.
		*/
		/**
		* 渲染一行开关字段.
		* @param props - 字段文案, 当前值与动作.
		* @returns 该字段行.
		*/
		function SwitchField(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsh-notif-field",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsh-notif-head",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dsh-notif-label",
							id: `${props.id}-label`,
							children: props.label
						}),
						props.overridden ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "dsh-notif-badges",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tag, {
								tone: "neutral",
								children: props.overriddenLabel
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dsh-notif-reset",
								disabled: props.disabled,
								onClick: props.onReset,
								children: props.resetLabel
							})]
						}) : null,
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Switch, {
							checked: props.checked,
							label: props.label,
							disabled: props.disabled,
							onChange: props.onToggle
						})
					]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: "dsh-notif-hint",
					children: props.hint
				})]
			});
		}
		/**
		* 字段分组标题.
		* @param props.title - 已本地化的分组名.
		* @returns 分组标题行.
		*/
		function GroupHeading({ title }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", {
				className: "dsh-notif-group",
				children: title
			});
		}
		//#endregion
		//#region src/client/settings-card.tsx
		/**
		* 渲染卡片的一行简介或配置表单, 由插件页的 view 决定.
		* @param props - 页面要的视图, 字典, 表单快照与动作.
		* @returns 简介文本或配置表单.
		*/
		function NotificationSettingsCard(props) {
			const { t } = props;
			const state = props.useNotificationCard((snapshot) => snapshot);
			if (props.view === "summary") return t("description");
			const disabled = !state.writable;
			const switchField = (id, label, hint, fieldName, fieldState) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SwitchField, {
				id,
				label,
				hint,
				checked: fieldState.text === "true",
				overridden: fieldState.overridden,
				overriddenLabel: t("overridden"),
				resetLabel: t("reset"),
				disabled,
				onToggle: (next) => {
					props.edit(fieldName, next ? "true" : "false");
				},
				onReset: () => {
					props.resetField(fieldName);
				}
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.SettingsForm, {
				labels: formLabels(t),
				state,
				onSave: props.save,
				onDiscard: props.discard,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(GroupHeading, { title: t("eventsGroup") }),
					switchField("plugin-config-notification-idle", t("notifyOnIdle"), t("notifyOnIdleHint"), SETTINGS_FIELDS.notifyOnIdle, state.notifyOnIdle),
					switchField("plugin-config-notification-error", t("notifyOnError"), t("notifyOnErrorHint"), SETTINGS_FIELDS.notifyOnError, state.notifyOnError),
					switchField("plugin-config-notification-approval", t("notifyOnApproval"), t("notifyOnApprovalHint"), SETTINGS_FIELDS.notifyOnApproval, state.notifyOnApproval),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.SettingsValueField, {
						id: "plugin-config-notification-min-turn",
						label: t("minTurnDurationMs"),
						hint: t("minTurnDurationMsHint"),
						overriddenLabel: t("overridden"),
						resetLabel: t("reset"),
						invalidLabel: t("invalidNumber"),
						numeric: true,
						disabled,
						...state.minTurnDurationMs,
						onEdit: (text) => {
							props.edit(SETTINGS_FIELDS.minTurnDurationMs, text);
						},
						onReset: () => {
							props.resetField(SETTINGS_FIELDS.minTurnDurationMs);
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(GroupHeading, { title: t("channelsGroup") }),
					switchField("plugin-config-notification-desktop", t("desktop"), t("desktopHint"), SETTINGS_FIELDS.desktop, state.desktop),
					switchField("plugin-config-notification-browser", t("browser"), t("browserHint"), SETTINGS_FIELDS.browser, state.browser),
					switchField("plugin-config-notification-hidden", t("browserOnlyWhenHidden"), t("browserOnlyWhenHiddenHint"), SETTINGS_FIELDS.browserOnlyWhenHidden, state.browserOnlyWhenHidden),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.SettingsValueField, {
						id: "plugin-config-notification-title",
						label: t("titleField"),
						hint: t("titleFieldHint"),
						overriddenLabel: t("overridden"),
						resetLabel: t("reset"),
						invalidLabel: t("invalidNumber"),
						disabled,
						...state.title,
						onEdit: (text) => {
							props.edit(SETTINGS_FIELDS.title, text);
						},
						onReset: () => {
							props.resetField(SETTINGS_FIELDS.title);
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.SettingsValueField, {
						id: "plugin-config-notification-webhook",
						label: t("webhookUrl"),
						hint: t("webhookUrlHint"),
						placeholder: t("webhookUrlPlaceholder"),
						overriddenLabel: t("overridden"),
						resetLabel: t("reset"),
						invalidLabel: t("invalidNumber"),
						disabled,
						...state.webhookUrl,
						onEdit: (text) => {
							props.edit(SETTINGS_FIELDS.webhookUrl, text);
						},
						onReset: () => {
							props.resetField(SETTINGS_FIELDS.webhookUrl);
						}
					})
				]
			});
		}
		//#endregion
		//#region src/client/settings-form.ts
		/**
		* 布尔字段的草稿编码: 官方模型只解析文本字段, 布尔值以 `true` / `false` 暂存.
		* @param field - 字段名.
		* @returns 该字段的转换描述.
		*/
		function settingsBooleanField(field) {
			return {
				field,
				format: (value) => typeof value === "boolean" ? String(value) : "",
				parse: (text) => text === "true" ? {
					kind: "set",
					value: true
				} : text === "false" ? {
					kind: "set",
					value: false
				} : void 0
			};
		}
		/** 把本插件条目的配置表单桥接成配置卡片的暂存表单. */
		var NotificationSettingsForm = class {
			form;
			store;
			/**
			* @param scope - 本插件 profile 条目的共享配置表单 (ctx.configForms.get).
			*/
			constructor(scope) {
				this.form = new _deepseek_ai_dsh_client_ui_primitives.SettingsFormModel(scope, [
					settingsBooleanField(SETTINGS_FIELDS.notifyOnIdle),
					settingsBooleanField(SETTINGS_FIELDS.notifyOnError),
					settingsBooleanField(SETTINGS_FIELDS.notifyOnApproval),
					(0, _deepseek_ai_dsh_client_ui_primitives.settingsNumberField)(SETTINGS_FIELDS.minTurnDurationMs),
					settingsBooleanField(SETTINGS_FIELDS.desktop),
					settingsBooleanField(SETTINGS_FIELDS.browser),
					settingsBooleanField(SETTINGS_FIELDS.browserOnlyWhenHidden),
					(0, _deepseek_ai_dsh_client_ui_primitives.settingsTextField)(SETTINGS_FIELDS.title),
					(0, _deepseek_ai_dsh_client_ui_primitives.settingsTextField)(SETTINGS_FIELDS.webhookUrl)
				]);
				this.store = this.form.bind(() => ({
					...this.form.shell(),
					notifyOnIdle: this.form.field(SETTINGS_FIELDS.notifyOnIdle),
					notifyOnError: this.form.field(SETTINGS_FIELDS.notifyOnError),
					notifyOnApproval: this.form.field(SETTINGS_FIELDS.notifyOnApproval),
					minTurnDurationMs: this.form.field(SETTINGS_FIELDS.minTurnDurationMs),
					desktop: this.form.field(SETTINGS_FIELDS.desktop),
					browser: this.form.field(SETTINGS_FIELDS.browser),
					browserOnlyWhenHidden: this.form.field(SETTINGS_FIELDS.browserOnlyWhenHidden),
					title: this.form.field(SETTINGS_FIELDS.title),
					webhookUrl: this.form.field(SETTINGS_FIELDS.webhookUrl)
				}));
			}
			/**
			* 构造 slot 注册要注入的面.
			* @returns 快照 hook 与表单动作.
			*/
			inject() {
				return {
					hooks: { notificationCard: this.store },
					...this.form.actions()
				};
			}
			/** 释放对配置表单的订阅. */
			dispose() {
				this.form.dispose();
			}
		};
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
		/**
		* 配置卡片字段行的样式.
		*
		* 官方 SettingsForm 只覆盖文本与数字字段, 开关字段由本插件的 SwitchField 自绘,
		* 尺寸与间距对齐官方 fields.module.css, 颜色只用 --dsw-alias-* 语义 token.
		*/
		const STYLE_ID = PLUGIN_ID;
		const CSS_TEXT = `
.dsh-notif-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 0;
}
.dsh-notif-field + .dsh-notif-field {
  border-top: 0.5px solid var(--dsw-alias-border-l2);
}
.dsh-notif-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dsh-notif-label {
  flex: 1;
  min-width: 0;
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.5;
}
.dsh-notif-badges {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.dsh-notif-reset {
  padding: 0;
  border: none;
  background: none;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 12px;
  line-height: 1.5;
  cursor: pointer;
}
.dsh-notif-reset:hover:not(:disabled) {
  color: var(--dsw-alias-label-primary);
}
.dsh-notif-reset:disabled {
  cursor: default;
}
.dsh-notif-hint {
  margin: 0;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 1.5;
}
.dsh-notif-group {
  margin: 8px 0 0;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: 0.02em;
}
`;
		/** 注入卡片字段样式一次; 重复调用为空操作. */
		function injectStyles() {
			if (typeof document === "undefined") return;
			if (document.querySelector(`style[data-plugin-css="${STYLE_ID}"]`) !== null) return;
			const style = document.createElement("style");
			style.dataset.pluginCss = STYLE_ID;
			style.textContent = CSS_TEXT;
			document.head.appendChild(style);
		}
		//#endregion
		//#region src/client/index.ts
		/** 所需服务: slots 注册, locale 字典, configForms 配置, sessions 会话列表. */
		const inject = [
			"slots",
			"locale",
			"configForms",
			"sessions"
		];
		/**
		* 注入样式, 订阅浏览器通知, 并挂上插件页的配置卡片.
		* @param ctx - Web Client 插件上下文.
		*/
		function apply(ctx) {
			ctx.logger.info("dsh-notification: client applying");
			injectStyles();
			const scope = ctx.configForms.get(ENTRY_ID);
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsh-notification: dictionaries");
			ctx.effect(() => ensurePermission(), "dsh-notification: permission");
			const list = ctx.sessions?.list;
			if (list !== void 0) ctx.effect(() => watchSessions(list, scope), "dsh-notification: session watch");
			const card = new NotificationSettingsForm(scope);
			ctx.effect(() => () => {
				card.dispose();
			}, "dsh-notification: settings form");
			ctx.effect(() => ctx.configForms.whileServed([ENTRY_ID], () => ctx.slots.inject("plugins.bundle.config", () => ctx.slots.register({
				name: "plugins.bundle.config",
				key: ENTRY_ID,
				locale: NS,
				inject: () => card.inject()
			}, NotificationSettingsCard))), "dsh-notification: plugins page card");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map