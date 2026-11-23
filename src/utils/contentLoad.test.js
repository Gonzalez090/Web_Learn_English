import { describe, expect, it, vi } from 'vitest'
import { ContentLoadError, forgetFailedLoads, loadOnce } from './contentLoad'

describe('loadOnce', () => {
  it('ขอซ้ำได้ promise ตัวเดิม โหลดครั้งเดียว', async () => {
    const cache = new Map()
    const start = vi.fn(() => Promise.resolve(['a']))
    expect(loadOnce(cache, 1, start)).toBe(loadOnce(cache, 1, start))
    expect(await loadOnce(cache, 1, start)).toEqual(['a'])
    expect(start).toHaveBeenCalledTimes(1)
  })

  it('ล้มเหลว → ขอซ้ำได้ promise เดิม ไม่โหลดใหม่เอง (กันวนไม่จบ) จนกว่าจะ forgetFailedLoads', async () => {
    const cache = new Map()
    const start = vi.fn().mockRejectedValueOnce(new TypeError('network')).mockResolvedValueOnce('ok')
    const first = loadOnce(cache, 's5', start)
    await expect(first).rejects.toBeInstanceOf(ContentLoadError)
    for (let i = 0; i < 50; i += 1) expect(loadOnce(cache, 's5', start)).toBe(first)
    expect(start).toHaveBeenCalledTimes(1)

    forgetFailedLoads()
    expect(await loadOnce(cache, 's5', start)).toBe('ok')
    expect(start).toHaveBeenCalledTimes(2)
  })

  it('forgetFailedLoads ไม่แตะตัวที่สำเร็จ/กำลังโหลด', async () => {
    const cache = new Map()
    const good = loadOnce(cache, 'good', () => Promise.resolve(1))
    const pending = loadOnce(cache, 'pending', () => new Promise(() => {}))
    const bad = loadOnce(cache, 'bad', () => Promise.reject(new Error('x')))
    await expect(bad).rejects.toThrow()
    forgetFailedLoads()
    expect([...cache.keys()]).toEqual(['good', 'pending'])
    expect(cache.get('good')).toBe(good)
    expect(cache.get('pending')).toBe(pending)
  })

  it('กลุ่มที่รวมตัวล้มเหลว → error ชนิดเดียวกัน และลืมทั้งกลุ่มกับตัวย่อย', async () => {
    const single = new Map()
    const group = new Map()
    const loadSingle = (id) => loadOnce(single, id, () => (id === 2 ? Promise.reject(new Error('x')) : Promise.resolve(id)))
    const all = loadOnce(group, '1,2', () => Promise.all([1, 2].map(loadSingle)))
    await expect(all).rejects.toBeInstanceOf(ContentLoadError)
    await Promise.resolve()
    forgetFailedLoads()
    expect(group.size).toBe(0)
    expect([...single.keys()]).toEqual([1])
  })
})
