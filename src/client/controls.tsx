import type { KeyboardEvent } from 'react'

export interface SwitchProps {
  /** 当前是否打开. */
  checked: boolean
  /** 无障碍标签. */
  label: string
  /** 是否禁用. */
  disabled?: boolean
  /** 点击切换. */
  onToggle: () => void
}

/**
 * 主题化开关, 设置页开关行使用.
 */
export function Switch({ checked, label, disabled = false, onToggle }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      className="dsh-notification-switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        if (!disabled) onToggle()
      }}
    >
      <span className="dsh-notification-thumb" />
    </button>
  )
}

export interface TextControlProps {
  /** 关联 label 的稳定 id. */
  id: string
  /** 当前草稿或已保存值. */
  value: string
  /** 占位文案. */
  placeholder?: string
  /** 输入类型. */
  type?: 'text' | 'url'
  /** 数字键盘提示. */
  numeric?: boolean
  /** 是否禁用. */
  disabled?: boolean
  /** 输入变化. */
  onChange: (value: string) => void
  /** 失焦提交. */
  onCommit: () => void
}

/**
 * 设置页文本 / 数字输入框. 失焦或回车时提交.
 */
export function TextControl({
  id,
  value,
  placeholder,
  type = 'text',
  numeric = false,
  disabled = false,
  onChange,
  onCommit,
}: TextControlProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') event.currentTarget.blur()
  }

  return (
    <input
      id={id}
      className="dsh-notification-input"
      type={type}
      inputMode={numeric ? 'numeric' : undefined}
      value={value}
      placeholder={placeholder ?? ''}
      disabled={disabled}
      spellCheck={false}
      autoComplete="off"
      onChange={(event) => {
        onChange(event.currentTarget.value)
      }}
      onBlur={onCommit}
      onKeyDown={onKeyDown}
    />
  )
}
