import { describe, it, expect } from 'vitest'
import { addMissedToQueue, dueEntries } from './review'

describe('addMissedToQueue', () => {
  it('เพิ่มข้อที่พลาด ครบกำหนดพรุ่งนี้ (รอบ 1 วัน)', () => {
    const queue = addMissedToQueue([], 'L1', ['a', 'b'], '2026-11-13')
    expect(queue).toEqual([
      { id: 'L1:a', lessonId: 'L1', itemId: 'a', box: 0, dueDate: '2026-11-14', addedAt: '2026-11-13' },
      { id: 'L1:b', lessonId: 'L1', itemId: 'b', box: 0, dueDate: '2026-11-14', addedAt: '2026-11-13' },
    ])
  })

  it('พลาดซ้ำ → ไม่เพิ่มซ้ำ แต่กลับไปรอบแรก', () => {
    const old = [{ id: 'L1:a', lessonId: 'L1', itemId: 'a', box: 2, dueDate: '2026-11-20', addedAt: '2026-11-01' }]
    const queue = addMissedToQueue(old, 'L1', ['a'], '2026-11-13')
    expect(queue).toHaveLength(1)
    expect(queue[0]).toMatchObject({ box: 0, dueDate: '2026-11-14', addedAt: '2026-11-01' })
  })

  it('ไม่แก้คิวเดิม', () => {
    const old = []
    addMissedToQueue(old, 'L1', ['a'], '2026-11-13')
    expect(old).toEqual([])
  })
})

describe('dueEntries', () => {
  it('เอาเฉพาะรายการที่ถึงกำหนดแล้ว', () => {
    const queue = [
      { id: 'x', dueDate: '2026-11-12' },
      { id: 'y', dueDate: '2026-11-13' },
      { id: 'z', dueDate: '2026-11-14' },
    ]
    expect(dueEntries(queue, '2026-11-13').map((e) => e.id)).toEqual(['x', 'y'])
  })
})
