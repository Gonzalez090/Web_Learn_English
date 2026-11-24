import { describe, expect, it } from 'vitest'
import { INITIAL_PROGRESS } from '../store/progressStore'
import { cleanProgress, cleanReviewQueue, createBackup } from './backup'
import { createSyncEngine, NewerDataError, SyncAborted } from './syncEngine'

const TODAY = '2026-11-24'
const clone = (value) => JSON.parse(JSON.stringify(value))
const clean = (data) => ({
  progress: createBackup(cleanProgress(data?.progress, INITIAL_PROGRESS, TODAY), []).progress,
  reviewQueue: cleanReviewQueue(data?.reviewQueue, TODAY),
})
const lesson = { completed: true, bestScore: 80, attempts: 1, completedAt: TODAY, lastPlayedAt: TODAY }

// เซิร์ฟเวอร์จำลอง (ตารางเดียวกับ supabase/schema.sql)
function createServer() {
  const rows = new Map()
  const log = []
  return {
    rows,
    log,
    failNext: 0, // กี่คำขอถัดไปที่เน็ตหลุด
    beforeUpdate: null, // ทำอะไรก่อนเขียน (จำลองอีกเครื่องเขียนแทรก)
    api() {
      const call = (name, run) => async (...args) => {
        await Promise.resolve()
        log.push(name)
        if (this.failNext > 0) {
          this.failNext -= 1
          throw new Error('network')
        }
        return run(...args)
      }
      return {
        head: call('head', (uid) => (rows.has(uid) ? { revision: rows.get(uid).revision } : null)),
        fetch: call('fetch', (uid) => (rows.has(uid) ? clone(rows.get(uid)) : null)),
        insert: call('insert', (uid, data) => {
          if (rows.has(uid)) return false
          rows.set(uid, clone({ revision: 1, data }))
          return true
        }),
        update: call('update', (uid, revision, data) => {
          const hook = this.beforeUpdate
          this.beforeUpdate = null
          hook?.()
          if (rows.get(uid)?.revision !== revision) return false
          rows.set(uid, clone({ revision: revision + 1, data }))
          return true
        }),
      }
    },
  }
}

// เครื่องจำลอง 1 เครื่อง
function createDevice(server, start = {}) {
  let state = clean({ progress: { ...INITIAL_PROGRESS, ...start } })
  let saved = {}
  const device = {
    get: () => state,
    change: (changes) => {
      state = clean({ ...state, progress: { ...state.progress, ...changes } })
    },
    setQueue: (reviewQueue) => {
      state = clean({ ...state, reviewQueue })
    },
    meta: () => saved,
    switches: 0,
  }
  device.engine = createSyncEngine({
    api: server.api(),
    meta: { read: () => clone(saved), write: (value) => (saved = clone(value)) },
    local: {
      snapshot: () => clone(state),
      apply: (next, { switched }) => {
        state = clone(next)
        if (switched) device.switches += 1
      },
    },
    clean,
    empty: () => clean({}),
  })
  return device
}

describe('ซิงก์ครั้งแรก', () => {
  it('บัญชีใหม่ → ส่งของในเครื่องขึ้นไป แล้วไม่ส่งซ้ำถ้าไม่มีอะไรเปลี่ยน', async () => {
    const server = createServer()
    const phone = createDevice(server, { xp: 120 })
    expect(await phone.engine.sync('u1')).toBe('pushed')
    expect(server.rows.get('u1').data.progress.xp).toBe(120)
    expect(phone.engine.isDirty()).toBe(false)
    server.log.length = 0
    expect(await phone.engine.sync('u1')).toBe('same')
    expect(server.log).toEqual(['head'])
    expect(await phone.engine.sync('u1', { pull: false })).toBe('same')
    expect(server.log).toEqual(['head'])
  })

  it('เครื่องที่สองล็อกอิน → ได้ของบัญชีครบ และของที่เรียนไว้ก่อนล็อกอินไม่หาย', async () => {
    const server = createServer()
    const phone = createDevice(server, { xp: 500, lessonProgress: { a: lesson } })
    const laptop = createDevice(server, { xp: 40, lessonProgress: { b: lesson } })
    await phone.engine.sync('u1')
    expect(await laptop.engine.sync('u1')).toBe('pulled')
    expect(laptop.get().progress.xp).toBe(500)
    expect(Object.keys(laptop.get().progress.lessonProgress).sort()).toEqual(['a', 'b'])
    expect(await phone.engine.sync('u1')).toBe('pulled')
    expect(Object.keys(phone.get().progress.lessonProgress).sort()).toEqual(['a', 'b'])
  })
})

describe('สองเครื่องเรียนพร้อมกัน', () => {
  async function pair() {
    const server = createServer()
    const phone = createDevice(server, { xp: 100 })
    const laptop = createDevice(server)
    await phone.engine.sync('u1')
    await laptop.engine.sync('u1')
    return { server, phone, laptop }
  }

  it('XP จากทั้งสองเครื่องนับครบ และซิงก์กี่รอบก็ไม่พุ่ง', async () => {
    const { server, phone, laptop } = await pair()
    phone.change({ xp: 150 })
    laptop.change({ xp: 130 })
    await phone.engine.sync('u1', { pull: false })
    await laptop.engine.sync('u1', { pull: false })
    for (let i = 0; i < 4; i += 1) {
      await phone.engine.sync('u1')
      await laptop.engine.sync('u1')
    }
    expect(phone.get().progress.xp).toBe(180)
    expect(laptop.get().progress.xp).toBe(180)
    expect(server.rows.get('u1').data.progress.xp).toBe(180)
  })

  it('อีกเครื่องเขียนแทรกก่อนพอดี → ไม่ทับ รวมแล้วลองใหม่เอง', async () => {
    const { server, phone, laptop } = await pair()
    phone.change({ xp: 150 })
    laptop.change({ xp: 130 })
    server.beforeUpdate = () => {
      const row = server.rows.get('u1')
      server.rows.set('u1', { revision: row.revision + 1, data: { ...row.data, progress: { ...row.data.progress, xp: 130 } } })
    }
    await phone.engine.sync('u1', { pull: false })
    expect(server.rows.get('u1').data.progress.xp).toBe(180)
  })

  it('รวมแล้วเน็ตหลุดก่อนส่ง → รอบหน้าไม่บวกซ้ำ', async () => {
    const { server, phone, laptop } = await pair()
    laptop.change({ xp: 130 })
    await laptop.engine.sync('u1')
    phone.change({ xp: 150 })
    // head + fetch ผ่าน แล้ว update ล้ม
    server.beforeUpdate = () => {
      throw new Error('network')
    }
    await expect(phone.engine.sync('u1')).rejects.toThrow('network')
    expect(phone.get().progress.xp).toBe(180)
    await phone.engine.sync('u1')
    await phone.engine.sync('u1')
    expect(phone.get().progress.xp).toBe(180)
    expect(server.rows.get('u1').data.progress.xp).toBe(180)
  })

  it('เน็ตหลุด → ของในเครื่องอยู่ครบ ต่อเน็ตแล้วส่งเอง', async () => {
    const { server, phone } = await pair()
    phone.change({ xp: 160 })
    server.failNext = 1
    await expect(phone.engine.sync('u1')).rejects.toThrow('network')
    expect(phone.get().progress.xp).toBe(160)
    expect(phone.engine.isDirty()).toBe(true)
    await phone.engine.sync('u1')
    expect(server.rows.get('u1').data.progress.xp).toBe(160)
  })

  it('ข้อทบทวนที่จำได้แล้วในเครื่องหนึ่ง ไม่ฟื้นจากอีกเครื่อง', async () => {
    const { phone, laptop } = await pair()
    const entry = { id: 'l:x', lessonId: 'l', itemId: 'x', box: 3, dueDate: '2026-11-24', addedAt: '2026-11-10' }
    phone.setQueue([entry])
    await phone.engine.sync('u1')
    await laptop.engine.sync('u1')
    expect(laptop.get().reviewQueue).toHaveLength(1)
    laptop.setQueue([])
    await laptop.engine.sync('u1')
    await phone.engine.sync('u1')
    expect(phone.get().reviewQueue).toEqual([])
    await laptop.engine.sync('u1')
    expect(laptop.get().reviewQueue).toEqual([])
  })
})

describe('รีเซ็ต / กู้คืน', () => {
  it('ล็อกอินอยู่แล้วรีเซ็ต → บัญชีถูกแทนที่ และเครื่องอื่นไม่เอาของเก่ากลับมา', async () => {
    const server = createServer()
    const phone = createDevice(server, { xp: 900, lessonProgress: { a: lesson } })
    const laptop = createDevice(server)
    await phone.engine.sync('u1')
    await laptop.engine.sync('u1')
    phone.change({ xp: 0, lessonProgress: {} })
    phone.engine.markReplaced(true)
    await phone.engine.sync('u1')
    expect(server.rows.get('u1').data.progress.xp).toBe(0)
    expect(server.rows.get('u1').data.epoch).toBe(1)
    await laptop.engine.sync('u1')
    expect(laptop.get().progress.xp).toBe(0)
    expect(laptop.get().progress.lessonProgress).toEqual({})
    // เรียนต่อหลังรีเซ็ต ซิงก์ปกติ
    laptop.change({ xp: 25 })
    await laptop.engine.sync('u1')
    await phone.engine.sync('u1')
    expect(phone.get().progress.xp).toBe(25)
  })

  it('รีเซ็ตตอนเน็ตหลุด → ต่อเน็ตแล้วยังเป็นการแทนที่ แม้บัญชีมีของใหม่กว่า', async () => {
    const server = createServer()
    const phone = createDevice(server, { xp: 900 })
    const laptop = createDevice(server)
    await phone.engine.sync('u1')
    await laptop.engine.sync('u1')
    phone.change({ xp: 0 })
    phone.engine.markReplaced(true)
    server.failNext = 1
    await expect(phone.engine.sync('u1')).rejects.toThrow()
    laptop.change({ xp: 950 })
    await laptop.engine.sync('u1')
    await phone.engine.sync('u1', { pull: false })
    expect(server.rows.get('u1').data.progress.xp).toBe(0)
    expect(phone.get().progress.xp).toBe(0)
  })

  it('กดรีเซ็ตอีกครั้งระหว่างรอส่ง → รอบหน้ายังแทนที่', async () => {
    const server = createServer()
    const phone = createDevice(server, { xp: 900 })
    await phone.engine.sync('u1')
    phone.change({ xp: 10 })
    phone.engine.markReplaced(true)
    const first = phone.meta().replace
    server.beforeUpdate = () => {
      while (Date.now() === first);
      phone.change({ xp: 0 })
      phone.engine.markReplaced(true)
    }
    await phone.engine.sync('u1')
    expect(phone.engine.isDirty()).toBe(true)
    await phone.engine.sync('u1')
    expect(server.rows.get('u1').data.progress.xp).toBe(0)
    expect(phone.engine.isDirty()).toBe(false)
  })

  it('ไม่ได้ล็อกอินแล้วรีเซ็ต → ไม่แตะบัญชี ล็อกอินใหม่ได้ของบัญชีคืน', async () => {
    const server = createServer()
    const phone = createDevice(server, { xp: 900 })
    await phone.engine.sync('u1')
    phone.change({ xp: 0 })
    phone.engine.markReplaced(false)
    phone.change({ xp: 30 })
    await phone.engine.sync('u1')
    expect(phone.get().progress.xp).toBe(900)
  })
})

describe('หลายบัญชีในเครื่องเดียว', () => {
  it('สลับบัญชี → ไม่ปนกัน และของที่ยังไม่ได้ซิงก์ของคนแรกไม่หาย', async () => {
    const server = createServer()
    const shared = createDevice(server, { xp: 300, lessonProgress: { a: lesson } })
    await shared.engine.sync('ann')
    shared.change({ xp: 340 }) // ออกจากระบบแล้วเรียนต่อ ยังไม่ได้ซิงก์
    await shared.engine.sync('bob')
    expect(shared.switches).toBe(1)
    expect(shared.get().progress.xp).toBe(0)
    expect(server.rows.get('bob')?.data.progress.lessonProgress ?? {}).toEqual({})
    shared.change({ xp: 15 })
    await shared.engine.sync('bob')
    await shared.engine.sync('ann')
    expect(shared.get().progress.xp).toBe(340)
    expect(server.rows.get('ann').data.progress.xp).toBe(340)
    expect(server.rows.get('bob').data.progress.xp).toBe(15)
  })

  it('ออกจากระบบแล้วเข้าบัญชีเดิม → รวมส่วนที่เรียนตอนออกจากระบบ', async () => {
    const server = createServer()
    const phone = createDevice(server, { xp: 300 })
    const laptop = createDevice(server)
    await phone.engine.sync('u1')
    await laptop.engine.sync('u1')
    phone.change({ xp: 320 })
    laptop.change({ xp: 350 })
    await laptop.engine.sync('u1')
    await phone.engine.sync('u1')
    expect(phone.get().progress.xp).toBe(370)
  })

  it('ออกจากระบบระหว่างรอเซิร์ฟเวอร์ → เลิกทันที ไม่เขียนข้อมูล', async () => {
    const server = createServer()
    const phone = createDevice(server, { xp: 50 })
    let current = true
    const pending = phone.engine.sync('u1', { isCurrent: () => current })
    current = false
    await expect(pending).rejects.toThrow(SyncAborted)
    expect(server.rows.size).toBe(0)
  })
})

describe('ข้อมูลในบัญชีผิดปกติ', () => {
  it('แถวเสีย → ไม่พัง ของในเครื่องยังอยู่', async () => {
    const server = createServer()
    server.rows.set('u1', { revision: 4, data: { v: 1, epoch: 'x', progress: { xp: 'lots', lessonProgress: [] }, reviewQueue: {} } })
    const phone = createDevice(server, { xp: 70 })
    await phone.engine.sync('u1')
    expect(phone.get().progress.xp).toBe(70)
    expect(server.rows.get('u1').revision).toBe(5)
    expect(server.rows.get('u1').data.epoch).toBe(0)
  })

  it('ข้อมูลรุ่นใหม่กว่าเว็บในแท็บนี้ → ไม่แตะ', async () => {
    const server = createServer()
    server.rows.set('u1', { revision: 2, data: { v: 99, epoch: 0 } })
    const phone = createDevice(server, { xp: 70 })
    await expect(phone.engine.sync('u1')).rejects.toThrow(NewerDataError)
    expect(server.rows.get('u1').revision).toBe(2)
  })

  it('แถวถูกลบ → สร้างใหม่จากของในเครื่อง', async () => {
    const server = createServer()
    const phone = createDevice(server, { xp: 70 })
    await phone.engine.sync('u1')
    server.rows.clear()
    await phone.engine.sync('u1')
    expect(server.rows.get('u1').data.progress.xp).toBe(70)
  })
})
