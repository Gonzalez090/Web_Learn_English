import { describe, expect, it } from 'vitest'
import { backupFileName, cleanProgress, cleanReviewQueue, createBackup, parseBackup } from './backup'
import { INITIAL_PROGRESS } from '../store/progressStore'

const TODAY = '2026-11-24'

// ความคืบหน้าจำลองที่ใช้ทุกช่อง
const FULL = {
  ...INITIAL_PROGRESS,
  xp: 3482,
  streak: { count: 3, lastActiveDate: '2026-11-23', best: 9 },
  streakFreeze: { available: 0, weekId: '2026-11-23' },
  unlockedStages: [1, 2, 3],
  unlockedPlaces: ['home', 'store'],
  lessonProgress: {
    's1-home-family': { completed: true, bestScore: 80, attempts: 2, completedAt: '2026-11-13', lastPlayedAt: '2026-11-20' },
  },
  collection: ['ph-feelings-1', 'ph-food-2'],
  room: { home: 'studio', items: { lamp: 'lamp-desk' } },
  npcFriendship: { rose: 4 },
  dailyMissions: { date: '2026-11-23', missions: [{ id: 'listen-10', progress: 3, done: false }] },
  speakingMinutes: { '2026-11-23': 1.25 },
  bossWeek: { weekId: '2026-11-23', scenarioId: 'cafe', done: true },
  dailyPlan: { date: '2026-11-23', goal: 10, tasks: [] },
  lastVisitDate: '2026-11-23',
  welcomeBack: null,
}
const QUEUE = [
  { id: 's1-home-family:s1-dog', lessonId: 's1-home-family', itemId: 's1-dog', box: 2, dueDate: '2026-11-25', addedAt: '2026-11-20', lastReviewedAt: '2026-11-22' },
]
const file = (changes = {}) => JSON.stringify({ ...createBackup(FULL, QUEUE, new Date('2026-11-24T05:00:00Z')), ...changes })

describe('สำรองแล้วกู้คืน', () => {
  it('ได้ค่าเดิมครบ (ภารกิจ/แผนของวันนี้ไม่สำรอง = ค่าเริ่มต้น)', () => {
    const result = parseBackup(file(), INITIAL_PROGRESS, TODAY)
    expect(result.ok).toBe(true)
    expect(result.progress).toEqual({
      ...FULL,
      dailyMissions: INITIAL_PROGRESS.dailyMissions,
      dailyPlan: null,
    })
    expect(result.reviewQueue).toEqual(QUEUE)
    expect(result.createdAt.toISOString()).toBe('2026-11-24T05:00:00.000Z')
    expect(result.summary).toEqual({ xp: 3482, lessons: 1, cards: 2, review: 1 })
  })

  it('ทุกช่องของ INITIAL_PROGRESS ถูกสำรอง ยกเว้นของที่สร้างใหม่ทุกวัน (เพิ่มช่องใหม่ต้องตัดสินใจที่นี่)', () => {
    const saved = Object.keys(createBackup(FULL, QUEUE).progress)
    expect([...saved, 'dailyMissions', 'dailyPlan', 'welcomeBack'].sort()).toEqual(Object.keys(INITIAL_PROGRESS).sort())
  })

  it('ชื่อไฟล์มีวันที่', () => {
    expect(backupFileName('2026-11-24')).toBe('english-town-2026-11-24.json')
  })
})

describe('ไฟล์ที่ใช้ไม่ได้', () => {
  it.each([
    ['ไม่ใช่ JSON', 'hello'],
    ['ว่าง', ''],
    ['null', 'null'],
    ['array', '[]'],
    ['ของเว็บอื่น', JSON.stringify({ app: 'other', version: 1, progress: {} })],
    ['ไม่มี progress', JSON.stringify({ app: 'english-town', version: 1 })],
    ['ไม่มีเวอร์ชัน', JSON.stringify({ app: 'english-town', progress: {} })],
  ])('%s → invalid', (_name, text) => {
    expect(parseBackup(text, INITIAL_PROGRESS, TODAY)).toEqual({ ok: false, error: 'invalid' })
  })

  it('ไฟล์จากเว็บรุ่นใหม่กว่า → newer', () => {
    expect(parseBackup(file({ version: 2 }), INITIAL_PROGRESS, TODAY)).toEqual({ ok: false, error: 'newer' })
  })
})

describe('ไฟล์เสียหาย/แก้มือ → ไม่พัง ใช้ค่าเริ่มต้นเฉพาะช่องที่เสีย', () => {
  it.each([undefined, null, 'x', 5, [], { xp: 'lots' }])('progress = %j → เหมือนผู้เรียนใหม่', (raw) => {
    expect(cleanProgress(raw, INITIAL_PROGRESS, TODAY)).toEqual(INITIAL_PROGRESS)
  })

  it('ทุกช่องผิดชนิด', () => {
    const broken = Object.fromEntries(Object.keys(INITIAL_PROGRESS).map((key) => [key, 'broken']))
    expect(cleanProgress(broken, INITIAL_PROGRESS, TODAY)).toEqual(INITIAL_PROGRESS)
    const numbers = Object.fromEntries(Object.keys(INITIAL_PROGRESS).map((key) => [key, [1, null, {}]]))
    expect(cleanProgress(numbers, INITIAL_PROGRESS, TODAY)).toEqual(INITIAL_PROGRESS)
  })

  it('วันที่อนาคต → ไม่เกินวันนี้ (streak ไม่ค้าง) / ข้อทบทวนไม่เกินรอบยาวสุด 14 วัน', () => {
    const clean = cleanProgress(
      { streak: { count: 50, best: 50, lastActiveDate: '2099-01-01' }, lastVisitDate: '2099-01-01' },
      INITIAL_PROGRESS,
      TODAY,
    )
    expect(clean.streak.lastActiveDate).toBe(TODAY)
    expect(clean.lastVisitDate).toBe(TODAY)
    expect(cleanReviewQueue([{ lessonId: 'a', itemId: 'b', dueDate: '2099-01-01' }], TODAY)[0].dueDate).toBe('2026-12-08')
  })

  it('ค่าเกินขอบเขต/ปนของแปลก ถูกตัดทิ้งทีละชิ้น', () => {
    const clean = cleanProgress(
      {
        xp: -5,
        streak: { count: 4, best: 1, lastActiveDate: 'yesterday' },
        unlockedStages: [3, 'x', 99, 3, 0],
        lessonProgress: { good: { completed: true, bestScore: 999 }, bad: 'x', '__proto__x': { completed: true } },
        collection: ['a', 'a', 5, null, '<script>'],
        room: { home: {}, items: { lamp: 'lamp-desk', plant: 7 } },
        npcFriendship: { rose: 2, sam: 'many', mia: -1 },
        speakingMinutes: { '2026-11-23': 2, tomorrow: 5, '2026-11-24': 99999 },
        bossWeek: { weekId: 'x', scenarioId: 'cafe' },
      },
      INITIAL_PROGRESS,
      TODAY,
    )
    expect(clean.xp).toBe(0)
    expect(clean.streak).toEqual({ count: 4, lastActiveDate: null, best: 4 })
    expect(clean.unlockedStages).toEqual([1, 3])
    expect(Object.keys(clean.lessonProgress)).toEqual(['good'])
    expect(clean.lessonProgress.good.bestScore).toBe(100)
    expect(clean.collection).toEqual(['a'])
    expect(clean.room).toEqual({ home: null, items: { lamp: 'lamp-desk' } })
    expect(clean.npcFriendship).toEqual({ rose: 2 })
    expect(clean.speakingMinutes).toEqual({ '2026-11-23': 2 })
    expect(clean.bossWeek).toBeNull()
  })

  it('JSON ที่มี __proto__ ไม่ปนเข้าไปใน object', () => {
    const text = file().replace('"xp":3482', '"__proto__":{"hacked":true},"xp":3482')
    const result = parseBackup(text, INITIAL_PROGRESS, TODAY)
    expect(result.progress.hacked).toBeUndefined()
    expect({}.hacked).toBeUndefined()
  })

  it('รายการทบทวน: ขาดช่อง/ซ้ำ/กล่องเกิน', () => {
    expect(cleanReviewQueue('x', TODAY)).toEqual([])
    expect(
      cleanReviewQueue(
        [
          null,
          { lessonId: 'a' },
          { lessonId: 'a', itemId: 'b', dueDate: 'soon' },
          { lessonId: 'a', itemId: 'b', dueDate: '2026-11-25', box: 99 },
          { lessonId: 'a', itemId: 'b', dueDate: '2026-11-26', box: 0 },
        ],
        TODAY,
      ),
    ).toEqual([{ id: 'a:b', lessonId: 'a', itemId: 'b', box: 3, dueDate: '2026-11-25', addedAt: '2026-11-25' }])
  })
})
