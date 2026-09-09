/** 发给 webhook 的 JSON 载荷, 带 Slack 兼容的 text 字段. */
export interface WebhookPayload {
  text: string
  summary: string
  body: string
  level: string
  ts: string
}

/**
 * POST 一条 webhook. 失败吞掉, 不能打断 agent 循环.
 * @param url - 目标 URL.
 * @param payload - JSON 载荷.
 */
export function postWebhook(url: string, payload: WebhookPayload): void {
  fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {})
}
