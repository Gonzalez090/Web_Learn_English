import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { entryOf, isNewVersion, reloadIfUpdated } from './appUpdate'

const html = (name) => `<!doctype html><head><script type="module" crossorigin src="/assets/${name}.js"></script></head>`

describe('reloadIfUpdated', () => {
  let reload
  let answer // คำตอบของ /index.html
  const stored = new Map()

  beforeEach(() => {
    reload = vi.fn()
    stored.clear()
    answer = () => Promise.resolve({ ok: true, text: async () => html('index-BBB') })
    vi.stubGlobal('document', { querySelector: () => ({ getAttribute: () => '/assets/index-AAA.js' }) })
    vi.stubGlobal('window', { location: { reload } })
    vi.stubGlobal('sessionStorage', { getItem: (key) => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value) })
    vi.stubGlobal('fetch', vi.fn((...args) => answer(...args)))
  })
  afterEach(() => vi.unstubAllGlobals())

  it('เวอร์ชันใหม่ + ยังอยู่หน้าข้อผิดพลาด → โหลดใหม่ครั้งเดียว', async () => {
    expect(await reloadIfUpdated(() => true)).toBe(true)
    expect(await reloadIfUpdated(() => true)).toBe(false)
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('ได้คำตอบตอนผู้ใช้ไปหน้าอื่นแล้ว (เน็ตช้า) → ไม่โหลดใหม่ทับงานที่ค้าง และไม่เสียสิทธิ์โหลดใหม่ครั้งหน้า', async () => {
    let onErrorPage = true
    let reply
    answer = () => new Promise((resolve) => (reply = resolve))
    const pending = reloadIfUpdated(() => onErrorPage)
    onErrorPage = false
    reply({ ok: true, text: async () => html('index-BBB') })
    expect(await pending).toBe(false)
    expect(reload).not.toHaveBeenCalled()

    answer = () => Promise.resolve({ ok: true, text: async () => html('index-BBB') })
    expect(await reloadIfUpdated(() => true)).toBe(true)
  })

  it('มีเวลาจำกัดในการเช็ก / เช็กไม่ได้ / เวอร์ชันเดิม → ไม่โหลดใหม่', async () => {
    answer = (_url, options) => {
      expect(options.signal).toBeInstanceOf(AbortSignal)
      return Promise.reject(new DOMException('timeout', 'TimeoutError'))
    }
    expect(await reloadIfUpdated(() => true)).toBe(false)
    answer = () => Promise.resolve({ ok: false, text: async () => html('index-BBB') })
    expect(await reloadIfUpdated(() => true)).toBe(false)
    answer = () => Promise.resolve({ ok: true, text: async () => html('index-AAA') })
    expect(await reloadIfUpdated(() => true)).toBe(false)
    expect(reload).not.toHaveBeenCalled()
  })
})

describe('appUpdate', () => {
  it('อ่านชื่อไฟล์หลักจาก index.html', () => {
    expect(entryOf(html('index-AAA'))).toBe('/assets/index-AAA.js')
  })
  it('ชื่อต่าง = เวอร์ชันใหม่ / เหมือนเดิม = ไม่ใช่', () => {
    expect(isNewVersion(html('index-BBB'), '/assets/index-AAA.js')).toBe(true)
    expect(isNewVersion(html('index-AAA'), '/assets/index-AAA.js')).toBe(false)
  })
  it('ไม่ใช่หน้าเว็บของเรา (หน้าล็อกอิน Wi-Fi, ว่าง) หรือโหมดพัฒนา → ไม่โหลดใหม่', () => {
    expect(isNewVersion('<html><body>Please log in</body></html>', '/assets/index-AAA.js')).toBe(false)
    expect(isNewVersion('<script src="https://evil.example/assets/x.js"></script>', '/assets/index-AAA.js')).toBe(false)
    expect(isNewVersion('', '/assets/index-AAA.js')).toBe(false)
    expect(isNewVersion(undefined, '/assets/index-AAA.js')).toBe(false)
    expect(isNewVersion(html('index-BBB'), null)).toBe(false)
  })
})
