import { describe, it, expect } from 'vitest'
import lessonsData from '../data/lessons.json' // เนื้อหาเต็ม (มี items) — ในเว็บโหลดแยกราย Stage
import {
  cumulativeVocabulary,
  firstHearings,
  lessonFirstHearingShare,
  lessonNovelty,
  targetWords,
  textCountByWord,
  wordsOf,
} from './vocabulary'

const { lessons } = lessonsData

// ---------- ตัวนับคำ (ข้อมูลตัวอย่างเล็ก ๆ) ----------
const sample = [
  { id: 'a', stageId: 1, items: [{ word: 'dog', parentese: ['Look! A dog.', "It's a big dog."] }] },
  { id: 'b', stageId: 2, items: [{ word: 'cat', target: 'cat', parentese: ['Look! A cat.', 'Big cat!'] }] },
]

describe('vocabulary (ตัวนับคำ)', () => {
  it('ตัดเครื่องหมาย ตัวพิมพ์เล็ก และขยายรูปย่อ', () => {
    expect(wordsOf("It's a BIG dog!")).toEqual(['it', 'is', 'a', 'big', 'dog'])
    expect(wordsOf('Bye-bye, dog.')).toEqual(['bye', 'bye', 'dog'])
  })

  it('คำสะสมตาม Stage + คำใหม่ต่อบท', () => {
    expect(cumulativeVocabulary(sample)).toEqual({ 1: 6, 2: 7 }) // dog look a it is big + cat
    expect(lessonNovelty(sample)[1].newWords).toEqual(['cat'])
  })

  it('คำสะสมนับคำแทนในขั้นสลับคำ + แบบอื่น (alsoSay) ด้วย แต่การตรวจ i+1 นับแค่ข้อความที่ฟัง', () => {
    const withSwap = [
      {
        id: 'c',
        stageId: 5,
        items: [
          {
            target: 'I want juice.',
            keywords: [{ word: 'juice', alternatives: [{ word: 'milk' }, { word: 'hot cocoa' }] }],
            alsoSay: [{ text: 'May I have juice?' }],
          },
        ],
      },
    ]
    expect(cumulativeVocabulary(withSwap)[5]).toBe(8) // i want juice + milk hot cocoa + may have
    expect(firstHearings(withSwap)[0].newWords).toEqual(['i', 'want', 'juice'])
  })

  it('นับจำนวนข้อความที่มีคำนั้น และคำที่ได้ยินครั้งแรกในแต่ละข้อความ', () => {
    const counts = textCountByWord(sample)
    expect(counts.get('dog')).toBe(3)
    expect(counts.get('cat')).toBe(3)
    expect(firstHearings(sample).map((entry) => entry.newWords.length)).toEqual([1, 2, 3, 1, 0, 0])
    expect(lessonFirstHearingShare(sample)[1].share).toBeCloseTo(1 / 6)
  })
})

// ---------- ตรวจเนื้อหา Stage 1–3 ตามหลักการเรียนแบบเจ้าของภาษา ----------
const early = lessons.filter((lesson) => lesson.stageId <= 3)

describe('เนื้อหา Stage 1–3 (ขั้นที่ 22)', () => {
  it('จำนวนข้อ: Stage 1 = 100 คำ, Stage 2 = 50 คำ, Stage 3 = 150 คำคู่', () => {
    const count = (stageId) => early.filter((l) => l.stageId === stageId).reduce((sum, l) => sum + l.items.length, 0)
    expect([count(1), count(2), count(3)]).toEqual([100, 50, 150])
  })

  it('คำสะสมถึงเป้า: ~100 / ~130 / ~300 คำ', () => {
    const cumulative = cumulativeVocabulary(early)
    expect(cumulative[1]).toBeGreaterThanOrEqual(100)
    expect(cumulative[2]).toBeGreaterThanOrEqual(130)
    expect(cumulative[3]).toBeGreaterThanOrEqual(300)
  })

  it('คำเป้าหมายทุกคำเจอใน 6 ข้อความต่างกันขึ้นไป (ซ้ำในหลายบริบท)', () => {
    const counts = textCountByWord(early)
    const tooFew = early
      .flatMap((lesson) => lesson.items)
      .flatMap((item) => targetWords(item).map((word) => ({ word, id: item.id, count: counts.get(word) ?? 0 })))
      .filter((entry) => entry.count < 6)
    expect(tooFew).toEqual([])
  })

  it('i+1: หลังบทแรก ทุกประโยคมีคำที่เพิ่งได้ยินครั้งแรกไม่เกิน 2 คำ', () => {
    const firstLesson = early[0].id
    const heavy = firstHearings(early)
      .filter((entry) => entry.lessonId !== firstLesson && entry.newWords.length > 2)
      .map((entry) => `${entry.lessonId}: ${entry.text}`)
    expect(heavy).toEqual([])
  })

  it('i+1: คำที่ได้ยินครั้งแรกไม่เกิน 30% ของคำที่ฟังในบท และเฉลี่ยทั้ง Stage ไม่เกิน 20%', () => {
    const shares = lessonFirstHearingShare(early).slice(1) // บทแรกของคอร์สเป็นของใหม่ทั้งหมดเสมอ
    expect(shares.filter((entry) => entry.share > 0.3)).toEqual([])
    for (const stageId of [1, 2, 3]) {
      const inStage = shares.filter((entry) => entry.stageId === stageId)
      const average = inStage.reduce((sum, entry) => sum + entry.share, 0) / inStage.length
      expect(average, `Stage ${stageId}`).toBeLessThanOrEqual(0.2)
    }
  })

  it('ในบทเดียวกัน คำเป้าหมายไม่ซ้ำกัน (เกม Listen & Tap ต้องแยกภาพได้)', () => {
    for (const lesson of early) {
      const targets = lesson.items.map((item) => (item.target ?? item.word).toLowerCase())
      expect(new Set(targets).size, lesson.id).toBe(targets.length)
    }
  })
})

// ---------- ตรวจเนื้อหา Stage 4 (ถาม-ตอบประโยคสั้น) ----------
// ไล่ฟังต่อจาก Stage 1–3 → ต้องคิดรวมตั้งแต่ Stage 1 เพื่อรู้ว่าคำไหน "ได้ยินแล้ว"
const throughStage4 = lessons.filter((lesson) => lesson.stageId <= 4)
const stage4 = lessons.filter((lesson) => lesson.stageId === 4)

describe('เนื้อหา Stage 4 (ขั้นที่ 23)', () => {
  it('ประโยคสั้น 500 ประโยค (100 บท บทละ 5 ข้อ)', () => {
    expect(stage4).toHaveLength(100)
    expect(stage4.reduce((sum, lesson) => sum + lesson.items.length, 0)).toBe(500)
  })

  it('คำสะสมเมื่อจบ Stage 4 ถึง ~1,000 คำ (เด็กเจ้าของภาษาวัย 3 ขวบ)', () => {
    expect(cumulativeVocabulary(throughStage4)[4]).toBeGreaterThanOrEqual(1000)
  })

  it('i+1: ทุกข้อความ (คำถามของพ่อแม่ + ประโยคที่พูด) มีคำที่เพิ่งได้ยินครั้งแรกไม่เกิน 2 คำ', () => {
    const heavy = firstHearings(throughStage4)
      .filter((entry) => entry.stageId === 4 && entry.newWords.length > 2)
      .map((entry) => `${entry.lessonId}: ${entry.text}`)
    expect(heavy).toEqual([])
  })

  it('i+1: คำที่ได้ยินครั้งแรกไม่เกิน 30% ของคำที่ฟังในบท และเฉลี่ยทั้ง Stage ไม่เกิน 20%', () => {
    const shares = lessonFirstHearingShare(throughStage4).filter((entry) => entry.stageId === 4)
    expect(shares.filter((entry) => entry.share > 0.3)).toEqual([])
    const average = shares.reduce((sum, entry) => sum + entry.share, 0) / shares.length
    expect(average).toBeLessThanOrEqual(0.2)
  })

  // Stage 4 มีแค่คำถาม + ประโยคตอบต่อข้อ (ไม่มี parentese) → เกณฑ์ 6+ ครั้งของ Stage 1–3 ทำไม่ได้กับคำ ~600 คำ
  // จึงบังคับขั้นต่ำว่าทุกคำที่ผู้เรียนต้องพูด ต้องได้ยินในข้อความอื่นด้วย (คำถามของพ่อแม่ข้ออื่นพูดถึงซ้ำ)
  // ส่วนการเจอซ้ำเพิ่มมาจากรอบทบทวน (ขั้นที่ 16) และ Stage 5 ที่ใช้คำเดิมในบทสนทนา
  it('ทุกคำในประโยคที่ต้องพูด ได้ยินอย่างน้อย 2 ข้อความต่างกัน', () => {
    const counts = textCountByWord(throughStage4)
    const once = stage4
      .flatMap((lesson) => lesson.items)
      .flatMap((item) => targetWords(item).map((word) => ({ word, id: item.id, count: counts.get(word) ?? 0 })))
      .filter((entry) => entry.count < 2)
    expect(once).toEqual([])
  })

  it('ในบทเดียวกัน ประโยคที่พูดไม่ซ้ำกัน (เกมคาราโอเกะ)', () => {
    for (const lesson of stage4) {
      const targets = lesson.items.map((item) => item.target.toLowerCase())
      expect(new Set(targets).size, lesson.id).toBe(targets.length)
    }
  })
})

// ---------- ตรวจเนื้อหา Stage 5 (ประโยคบริบท บทสนทนา เรื่องเล่า คำคล้องจอง) ----------
// ข้อความที่ฟัง = ประโยค/บรรทัดของแต่ละข้อ (คำแทนในขั้นสลับคำมีความหมายไทยกำกับ → นับเป็นคำสะสม แต่ไม่นับใน i+1)
const throughStage5 = lessons.filter((lesson) => lesson.stageId <= 5)

describe('เนื้อหา Stage 5 (ขั้นที่ 24)', () => {
  it('i+1: ทุกประโยค/บรรทัด มีคำที่เพิ่งได้ยินครั้งแรกไม่เกิน 2 คำ', () => {
    const heavy = firstHearings(throughStage5)
      .filter((entry) => entry.stageId === 5 && entry.newWords.length > 2)
      .map((entry) => `${entry.lessonId}: ${entry.text}`)
    expect(heavy).toEqual([])
  })

  it('i+1: คำที่ได้ยินครั้งแรกไม่เกิน 30% ของคำที่ฟังในบท และเฉลี่ยทั้ง Stage ไม่เกิน 20%', () => {
    const shares = lessonFirstHearingShare(throughStage5).filter((entry) => entry.stageId === 5)
    expect(shares.filter((entry) => entry.share > 0.3)).toEqual([])
    const average = shares.reduce((sum, entry) => sum + entry.share, 0) / shares.length
    expect(average).toBeLessThanOrEqual(0.2)
  })

  // ระหว่างขยายเนื้อหาเป็นช่วง ๆ (หน่วย 1–10 → 11–20 → 21–30) — เป้า ~2,500 คำ ตรวจเมื่อครบ 30 หน่วย
  it('คำสะสมเพิ่มจาก Stage 4 อย่างน้อย 300 คำ (หน่วย 1–10)', () => {
    const cumulative = cumulativeVocabulary(throughStage5)
    expect(cumulative[5] - cumulative[4]).toBeGreaterThanOrEqual(300)
  })
})
