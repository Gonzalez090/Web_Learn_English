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
