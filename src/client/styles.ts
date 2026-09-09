import { PLUGIN_ID } from '../shared.ts'

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
`.trim()

/**
 * 把插件样式注入 document, 重复调用是空操作.
 */
export function injectStyles(): void {
  if (typeof document === 'undefined') return
  if (document.querySelector(`style[data-plugin-css="${PLUGIN_ID}"]`) !== null) return
  const style = document.createElement('style')
  style.dataset.pluginCss = PLUGIN_ID
  style.textContent = CSS_TEXT
  document.head.appendChild(style)
}
