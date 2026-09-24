/**
 * 配置卡片字段行的样式.
 *
 * 官方 SettingsForm 只覆盖文本与数字字段, 开关字段由本插件的 SwitchField 自绘,
 * 尺寸与间距对齐官方 fields.module.css, 颜色只用 --dsw-alias-* 语义 token.
 */
import { PLUGIN_ID } from '../shared.ts'

const STYLE_ID = PLUGIN_ID

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
`

/** 注入卡片字段样式一次; 重复调用为空操作. */
export function injectStyles(): void {
  if (typeof document === 'undefined') return
  if (document.querySelector(`style[data-plugin-css="${STYLE_ID}"]`) !== null) return
  const style = document.createElement('style')
  style.dataset.pluginCss = STYLE_ID
  style.textContent = CSS_TEXT
  document.head.appendChild(style)
}
