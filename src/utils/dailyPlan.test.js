import { describe, it, expect } from 'vitest'
import { applyPlanEvent, buildDailyPlan, ensureDailyPlan, isPlanDone, nextPlanTask, planStepsLeft } from './dailyPlan'

const today = '2026-11-22'
const kinds = (plan) => plan.tasks.map((task) => `${task.kind}:${task.target}`)
const progress = (plan) => plan.tasks.map((task) => `${task.kind}:${task.progress}/${task.target}`)

describe('buildDailyPlan (ทบทวน → บทใหม่ → บทสนทนา → มินิเกม)', () => {
  it('จัดชุดตามเป้าหมาย 5 / 10 / 15 / 20 นาที', () => {
    const base = { today, reviewDue: 30, talkReady: true }
    expect(kinds(buildDailyPlan({ ...base, goal: 5 }))).toEqual(['review:5', 'lesson:1'])
    expect(kinds(buildDailyPlan({ ...base, goal: 10 }))).toEqual(['review:10', 'lesson:1', 'game:1'])
    expect(kinds(buildDailyPlan({ ...base, goal: 15 }))).toEqual(['review:10', 'lesson:1', 'talk:1', 'game:1'])
    expect(kinds(buildDailyPlan({ ...base, goal: 20 }))).toEqual(['review:10', 'lesson:2', 'talk:1', 'game:1'])
  })

  it('ไม่มีรายการทบทวน → ไม่มีขั้นทบทวน / ทบทวนน้อยกว่าเพดาน → เป้า = จำนวนที่มี', () => {
    expect(kinds(buildDailyPlan({ goal: 10, today, reviewDue: 0 }))).toEqual(['lesson:1', 'game:1'])
    expect(kinds(buildDailyPlan({ goal: 10, today, reviewDue: 3 }))).toEqual(['review:3', 'lesson:1', 'game:1'])
  })

  it('ยังไม่ผ่าน Stage 4 → แทนบทสนทนาสุ่มด้วยบทใหม่อีก 1 บท', () => {
    expect(kinds(buildDailyPlan({ goal: 15, today, talkReady: false }))).toEqual(['lesson:2', 'game:1'])
    expect(kinds(buildDailyPlan({ goal: 20, today, talkReady: false }))).toEqual(['lesson:3', 'game:1'])
  })

  it('เป้าแปลก ๆ → ใช้ 10 นาที', () => {
    expect(buildDailyPlan({ goal: 7, today }).goal).toBe(10)
  })
})

describe('ensureDailyPlan / applyPlanEvent', () => {
  it('วันเดิมเป้าเดิม → แผนเดิม (เป้าทบทวนคงที่ระหว่างวัน) / วันใหม่ → แผนใหม่ นับ 0', () => {
    const plan = buildDailyPlan({ goal: 10, today, reviewDue: 2 })
    expect(ensureDailyPlan(plan, { goal: 10, today, reviewDue: 2 })).toBe(plan)
    expect(ensureDailyPlan(plan, { goal: 10, today, reviewDue: 9 })).toBe(plan)
    const done = applyPlanEvent(plan, 'review', 2, today).plan
    const tomorrow = ensureDailyPlan(done, { goal: 10, today: '2026-11-23', reviewDue: 0 })
    expect(tomorrow.date).toBe('2026-11-23')
    expect(tomorrow.tasks.every((task) => task.progress === 0)).toBe(true)
  })

  it('เปลี่ยนเป้ากลางวัน: ทบทวนครบแล้วขั้นทบทวนยังอยู่ / ขั้นที่หายไปแล้วกลับมาไม่เสียความคืบหน้า / ทบทวนบางส่วนไม่ถือว่าครบ', () => {
    // ทบทวนครบ 4/4 (ไม่เหลือค้าง) แล้วเปลี่ยน 15 → 20
    let plan = buildDailyPlan({ goal: 15, today, reviewDue: 4, talkReady: true })
    plan = applyPlanEvent(plan, 'review', 4, today).plan
    plan = applyPlanEvent(plan, 'miniGame', 1, today).plan
    plan = ensureDailyPlan(plan, { goal: 20, today, reviewDue: 0, talkReady: true })
    expect(progress(plan)).toEqual(['review:4/4', 'lesson:0/2', 'talk:0/1', 'game:1/1'])
    // 20 → 5 (ไม่มีขั้นมินิเกม) → 15: มินิเกมยังนับว่าเล่นแล้ว
    plan = ensureDailyPlan(plan, { goal: 5, today, reviewDue: 0, talkReady: true })
    plan = ensureDailyPlan(plan, { goal: 15, today, reviewDue: 0, talkReady: true })
    expect(progress(plan)).toEqual(['review:4/4', 'lesson:0/1', 'talk:0/1', 'game:1/1'])
    // ทบทวนไป 3 จาก 5 แล้วเปลี่ยนเป้า → เป้า 5 (3 ที่ทำ + 2 ที่ค้าง) ยังไม่ครบ
    let partial = applyPlanEvent(buildDailyPlan({ goal: 10, today, reviewDue: 5 }), 'review', 3, today).plan
    partial = ensureDailyPlan(partial, { goal: 15, today, reviewDue: 2, talkReady: true })
    expect(partial.tasks[0]).toMatchObject({ kind: 'review', target: 5, progress: 3 })
  })

  it('ขั้นที่ทำไม่ได้แล้ว (ความคืบหน้าจากบัญชีมาแทน) → จัดใหม่ / ขั้นที่ทำเสร็จแล้วยังอยู่', () => {
    const plan = buildDailyPlan({ goal: 20, today, reviewDue: 5, talkReady: true })
    const fixed = ensureDailyPlan(plan, { goal: 20, today, reviewDue: 0, talkReady: false })
    expect(progress(fixed)).toEqual(['lesson:0/3', 'game:0/1'])
    expect(ensureDailyPlan(fixed, { goal: 20, today, reviewDue: 0, talkReady: false })).toBe(fixed)
    // ทำไป 3 จาก 5 แล้วรายการที่ค้างหายไป → เป้าเหลือเท่าที่ทำ
    const partial = applyPlanEvent(plan, 'review', 3, today).plan
    expect(progress(ensureDailyPlan(partial, { goal: 20, today, reviewDue: 0, talkReady: true }))[0]).toBe('review:3/3')
    // คุยจบแล้ว → ขั้นบทสนทนายังอยู่
    const talked = applyPlanEvent(plan, 'conversation', 1, today).plan
    expect(ensureDailyPlan(talked, { goal: 20, today, reviewDue: 5, talkReady: false })).toBe(talked)
  })

  it('บทที่จบวันนี้ในเครื่องอื่น (ซิงก์มา) นับในแผน ไม่บวกซ้ำ / เหลือกี่ขั้น', () => {
    const plan = applyPlanEvent(buildDailyPlan({ goal: 20, today, talkReady: true }), 'lessonComplete', 1, today).plan
    expect(planStepsLeft(plan)).toBe(3)
    expect(ensureDailyPlan(plan, { goal: 20, today, talkReady: true, lessonsToday: 1 })).toBe(plan)
    const synced = ensureDailyPlan(plan, { goal: 20, today, talkReady: true, lessonsToday: 11 })
    expect(progress(synced)).toEqual(['lesson:2/2', 'talk:0/1', 'game:0/1'])
    expect(planStepsLeft(synced)).toBe(2)
    expect(progress(ensureDailyPlan(null, { goal: 10, today, lessonsToday: 1 }))).toEqual(['lesson:1/1', 'game:0/1'])
  })

  it('เกมในบทเรียน/ทบทวน (gamePlay) ไม่ทำให้ขั้นมินิเกมเสร็จ — นับเฉพาะ miniGame (เกมที่เล่นแยก)', () => {
    const plan = buildDailyPlan({ goal: 10, today })
    expect(applyPlanEvent(plan, 'gamePlay', 1, today).plan).toBe(plan)
    expect(applyPlanEvent(plan, 'miniGame', 1, today).plan.tasks.at(-1).progress).toBe(1)
  })

  it('เหตุการณ์ทำให้ขั้นคืบหน้า (ไม่เกินเป้า) / แผนครบ → completed ครั้งเดียว / แผนของวันอื่นไม่ขยับ', () => {
    let plan = buildDailyPlan({ goal: 10, today, reviewDue: 2 })
    expect(nextPlanTask(plan).kind).toBe('review')
    plan = applyPlanEvent(plan, 'review', 5, today).plan
    expect(plan.tasks[0].progress).toBe(2)
    plan = applyPlanEvent(plan, 'lessonComplete', 1, today).plan
    expect(applyPlanEvent(plan, 'speakPass', 1, today).plan).toBe(plan)
    const last = applyPlanEvent(plan, 'miniGame', 1, today)
    expect(last.completed).toBe(true)
    expect(isPlanDone(last.plan)).toBe(true)
    expect(nextPlanTask(last.plan)).toBeNull()
    expect(applyPlanEvent(last.plan, 'miniGame', 1, today).completed).toBe(false)
    expect(applyPlanEvent(plan, 'miniGame', 1, '2026-11-23').plan).toBe(plan)
  })

  it('แผนรุ่นแรก (ไม่มี counts) ของวันนี้ → สร้างใหม่โดยนับจากความคืบหน้าเดิม', () => {
    const old = { date: today, goal: 10, tasks: [{ kind: 'lesson', target: 1, progress: 1 }, { kind: 'game', target: 1, progress: 0 }] }
    const plan = ensureDailyPlan(old, { goal: 10, today, reviewDue: 0 })
    expect(progress(plan)).toEqual(['lesson:1/1', 'game:0/1'])
    expect(plan.counts.lessonComplete).toBe(1)
  })
})
