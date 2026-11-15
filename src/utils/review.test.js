import { describe, it, expect } from 'vitest'
import { addMissedToQueue, buildReviewItems, dueEntries, gradeReview, nextDueDate } from './review'

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

describe('ทบทวนแบบเว้นระยะ (ขั้นที่ 16)', () => {
  const TODAY = '2026-11-13'
  const entry = (id, box, dueDate) => ({ id, lessonId: id.split(':')[0], itemId: id.split(':')[1], box, dueDate, addedAt: '2026-11-01' })

  it('ทำได้ → เลื่อนรอบ 1 → 3 → 7 → 14 วัน แล้วออกจากคิว', () => {
    let queue = [entry('l1:a', 0, TODAY)]
    const steps = []
    for (let i = 0; i < 4; i += 1) {
      const result = gradeReview(queue, 'l1:a', true, TODAY)
      steps.push([result.outcome, result.days, result.queue[0]?.dueDate ?? null])
      queue = result.queue
    }
    expect(steps).toEqual([
      ['next', 3, '2026-11-16'],
      ['next', 7, '2026-11-20'],
      ['next', 14, '2026-11-27'],
      ['mastered', 0, null],
    ])
    expect(queue).toEqual([])
  })

  it('พลาด → กลับรอบแรก อีก 1 วัน', () => {
    const queue = [entry('l1:a', 2, TODAY), entry('l1:b', 0, TODAY)]
    const result = gradeReview(queue, 'l1:a', false, TODAY)
    expect(result.outcome).toBe('reset')
    expect(result.queue[0]).toMatchObject({ box: 0, dueDate: '2026-11-14', lastReviewedAt: TODAY })
    expect(result.queue[1]).toBe(queue[1])
    expect(queue[0].box).toBe(2) // ไม่แก้ของเดิม
  })

  it('ไม่มีรายการนั้น → ไม่เปลี่ยน', () => {
    const queue = [entry('l1:a', 0, TODAY)]
    expect(gradeReview(queue, 'nope', true, TODAY)).toEqual({ queue, outcome: null, days: 0 })
  })

  it('buildReviewItems: เฉพาะที่ถึงกำหนด + มีข้อจริง เรียงค้างนานสุดก่อน และจำกัดจำนวน', () => {
    const lessons = [{ id: 'l1', items: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] }]
    const queue = [
      entry('l1:a', 0, '2026-11-13'),
      entry('l1:b', 1, '2026-11-10'),
      entry('l1:c', 0, '2026-11-20'), // ยังไม่ถึงกำหนด
      entry('l1:gone', 0, '2026-11-01'), // ข้อถูกลบจากบทเรียนแล้ว
      entry('l9:x', 0, '2026-11-01'), // บทถูกลบแล้ว
    ]
    expect(buildReviewItems(queue, lessons, TODAY).map((r) => r.item.id)).toEqual(['b', 'a'])
    expect(buildReviewItems(queue, lessons, TODAY, 1).map((r) => r.item.id)).toEqual(['b'])
  })

  it('buildReviewItems: บรรทัดของบทสนทนาได้บรรทัดก่อนหน้า (อีกฝ่าย) เป็นตัวนำ', () => {
    const lessons = [
      {
        id: 'd1',
        type: 'dialogue',
        items: [
          { id: 'x', speaker: 'a', target: 'What can I get you?', translationTh: 'รับอะไรดี' },
          { id: 'y', speaker: 'b', target: 'A cookie, please.', translationTh: 'ขอคุกกี้' },
        ],
      },
    ]
    const [review] = buildReviewItems([entry('d1:y', 0, TODAY)], lessons, TODAY)
    expect(review.item).toMatchObject({ id: 'y', question: 'What can I get you?', questionTh: 'รับอะไรดี' })
  })

  it('nextDueDate: วันครบกำหนดถัดไปหลังวันนี้', () => {
    const queue = [entry('l1:a', 0, '2026-11-13'), entry('l1:b', 0, '2026-11-20'), entry('l1:c', 0, '2026-11-15')]
    expect(nextDueDate(queue, TODAY)).toBe('2026-11-15')
    expect(nextDueDate([entry('l1:a', 0, TODAY)], TODAY)).toBeNull()
  })
})
