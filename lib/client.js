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
		/** 系统原生通知字段. */
		const DESKTOP_FIELD = "desktop";
		/** 默认通知标题. */
		const DEFAULT_TITLE = "DeepSeek Harness";
		/** 默认最短回合时长 (毫秒). */
		const DEFAULT_MIN_TURN_MS = 5e3;
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
		* 把未知值收成布尔, 缺省时用 fallback.
		* @param value - settings 原始值.
		* @param fallback - 非法或缺省时的回退.
		* @returns 布尔值.
		*/
		function asBoolean(value, fallback) {
			return typeof value === "boolean" ? value : fallback;
		}
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
		* 把未知值收成字符串.
		* @param value - settings 原始值.
		* @param fallback - 非法时的回退.
		* @returns 字符串.
		*/
		function asString(value, fallback) {
			return typeof value === "string" ? value : fallback;
		}
		/**
		* 把 Host 返回的未知 section 解码成类型化设置.
		* 非对象返回 `undefined`, 保留上一次已接受值; 对象字段异常则回退默认值.
		* @param section - settings namespace 的原始 section.
		* @returns 解码后的设置, 或 `undefined`.
		*/
		function decodeNotificationSettings(section) {
			if (typeof section !== "object" || section === null) return void 0;
			const row = section;
			const title = asString(row.title, DEFAULT_TITLE).trim();
			return {
				notifyOnIdle: asBoolean(row.notifyOnIdle, DEFAULT_SETTINGS.notifyOnIdle),
				notifyOnError: asBoolean(row.notifyOnError, DEFAULT_SETTINGS.notifyOnError),
				notifyOnApproval: asBoolean(row.notifyOnApproval, DEFAULT_SETTINGS.notifyOnApproval),
				minTurnDurationMs: asNonNegativeNumber(row.minTurnDurationMs, DEFAULT_MIN_TURN_MS),
				desktop: asBoolean(row.desktop, DEFAULT_SETTINGS.desktop),
				browser: asBoolean(row.browser, DEFAULT_SETTINGS.browser),
				browserOnlyWhenHidden: asBoolean(row.browserOnlyWhenHidden, DEFAULT_SETTINGS.browserOnlyWhenHidden),
				webhookUrl: asString(row.webhookUrl, DEFAULT_SETTINGS.webhookUrl),
				title: title === "" ? DEFAULT_TITLE : title
			};
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
		* dsh-notification locale 命名空间: General 设置行文案. 中文为基准, 英文镜像.
		*/
		/** 简体中文字典 (key 集合的唯一来源). */
		const zh = {
			"settings.desktop.title": "系统通知",
			"settings.desktop.description": "在运行 dsh 的机器上弹出操作系统原生通知. 关掉后浏览器通知和 webhook 不受影响."
		};
		/** 英文词典, 与 zh key 集合完全对齐. */
		const en = {
			"settings.desktop.title": "System notifications",
			"settings.desktop.description": "Native OS notifications on the machine running dsh. Turning this off leaves browser popups and webhooks unchanged."
		};
		/** Locale 命名空间 id. */
		const NS = "dsh-notification";
		//#endregion
		//#region src/client/settings-row.tsx
		function currentDesktop(scope) {
			return scope.getSnapshot().value?.desktop ?? DEFAULT_SETTINGS.desktop;
		}
		/**
		* Settings > General 中的系统通知开关行.
		* @param props.scope - Host 命名空间的浏览器镜像.
		* @param props.t - 文案读取.
		*/
		function DesktopSettingsRow({ scope, t }) {
			const desktop = (0, react.useSyncExternalStore)((onChange) => scope.subscribe(onChange), () => currentDesktop(scope));
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsh-notification-row",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsh-notification-text",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dsh-notification-title",
						children: t("settings.desktop.title")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dsh-notification-desc",
						children: t("settings.desktop.description")
					})]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					role: "switch",
					className: "dsh-notification-switch",
					"aria-checked": desktop,
					"aria-label": t("settings.desktop.title"),
					onClick: () => {
						scope.set(DESKTOP_FIELD, !desktop);
					},
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "dsh-notification-thumb" })
				})]
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
.dsh-notification-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 16px 0;
  border-bottom: 1px solid var(--dsw-alias-border-l2);
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

@media (max-width: 640px) {
  .dsh-notification-row {
    flex-direction: column;
    align-items: stretch;
  }

  .dsh-notification-text {
    padding-right: 0;
  }

  .dsh-notification-switch {
    align-self: flex-end;
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
		* 盯着 session list 弹浏览器通知, 并在 Settings > General 挂一行系统通知开关.
		*/
		const inject = [
			"slots",
			"locale",
			"settingsScope",
			"sessions"
		];
		/**
		* 注入样式, 订阅浏览器通知, 并挂上 General 设置行.
		* @param ctx - Web Client 插件上下文.
		*/
		function apply(ctx) {
			ctx.logger.info("dsh-notification: client applying");
			injectStyles();
			const scope = ctx.settingsScope.bind({
				namespace: SETTINGS_NAMESPACE,
				decode: decodeNotificationSettings
			});
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsh-notification: dictionaries");
			ctx.effect(() => ensurePermission(), "dsh-notification: permission");
			const list = (ctx.sessions ?? ctx.get("sessions"))?.list;
			if (list) ctx.effect(() => watchSessions(list, scope), "dsh-notification: session watch");
			const t = ctx.locale.bind(NS);
			ctx.slots.inject("settings.general.item", () => ctx.slots.register({
				name: "settings.general.item",
				id: PLUGIN_ID,
				order: 90,
				locale: NS
			}, () => (0, react.createElement)(DesktopSettingsRow, {
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