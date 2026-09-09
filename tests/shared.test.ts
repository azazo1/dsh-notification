import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DEFAULT_MIN_TURN_MS,
  DEFAULT_SETTINGS,
  DEFAULT_TITLE,
  decodeNotificationSettings,
  formatDuration,
} from '../src/shared.ts'

describe('decodeNotificationSettings', () => {
  it('returns undefined for a non-object section', () => {
    assert.equal(decodeNotificationSettings(null), undefined)
    assert.equal(decodeNotificationSettings('x'), undefined)
  })

  it('fills defaults for an empty object', () => {
    assert.deepEqual(decodeNotificationSettings({}), DEFAULT_SETTINGS)
  })

  it('reads an explicit desktop override', () => {
    const decoded = decodeNotificationSettings({ desktop: false })
    assert.equal(decoded?.desktop, false)
    assert.equal(decoded?.browser, true)
  })

  it('falls back when a field is the wrong type', () => {
    const decoded = decodeNotificationSettings({
      minTurnDurationMs: 'nope',
      title: 12,
      webhookUrl: false,
    })
    assert.equal(decoded?.minTurnDurationMs, DEFAULT_MIN_TURN_MS)
    assert.equal(decoded?.title, DEFAULT_TITLE)
    assert.equal(decoded?.webhookUrl, '')
  })

  it('rejects a blank title', () => {
    assert.equal(decodeNotificationSettings({ title: '   ' })?.title, DEFAULT_TITLE)
  })
})

describe('formatDuration', () => {
  it('uses milliseconds below one second', () => {
    assert.equal(formatDuration(12), '12ms')
  })

  it('uses seconds below one minute', () => {
    assert.equal(formatDuration(1500), '2s')
  })

  it('splits minutes and seconds', () => {
    assert.equal(formatDuration(125_000), '2m 5s')
  })
})
