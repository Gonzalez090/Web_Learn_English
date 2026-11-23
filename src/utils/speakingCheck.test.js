import { describe, expect, it } from 'vitest'
import {
  analyzeLevels,
  checkSchedule,
  compareStats,
  computeStats,
  findChunks,
  isTooShort,
  milestoneStatus,
} from './speakingCheck'
import gameData from '../data/game.json'
import lessonsData from '../data/lessons.json'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

// ระดับเสียงจำลอง: [ระดับ, จำนวนช่อง(100 ms)] ต่อกัน
const levelsOf = (...parts) => parts.flatMap(([level, count]) => Array(count).fill(level))

describe('checkSchedule', () => {
  it('ยังไม่เคยอัด = ถึงกำหนดเลย วันที่ 0', () => {
    expect(checkSchedule([], '2026-11-23')).toMatchObject({ count: 0, due: true, dayNumber: 0 })
  })

  it('ครั้งถัดไป = 30 วันหลังครั้งล่าสุด, นับวันจากครั้งแรก', () => {
    const checks = [
      { id: 'b', date: '2026-10-20', createdAt: 2 },
      { id: 'a', date: '2026-09-01', createdAt: 1 },
    ]
    const status = checkSchedule(checks, '2026-11-01')
    expect(status.first.id).toBe('a')
    expect(status.latest.id).toBe('b')
    expect(status.nextDate).toBe('2026-11-19')
    expect(status.daysLeft).toBe(18)
    expect(status.due).toBe(false)
    expect(status.dayNumber).toBe(62)
    expect(checkSchedule(checks, '2026-11-19').due).toBe(true)
    expect(checkSchedule(checks, '2026-12-25')).toMatchObject({ due: true, daysLeft: 0 })
  })
})

describe('milestoneStatus', () => {
  const milestones = [{ id: 'd90', day: 90 }, { id: 'd30', day: 30 }, { id: 'd180', day: 180 }]
  it('ยังไม่เริ่ม → ทุกอันยังไม่ถึง อันแรกเป็นเป้าถัดไป', () => {
    expect(milestoneStatus(milestones, 0).map((m) => m.status)).toEqual(['next', 'later', 'later'])
  })
  it('วันที่ 45 → 30 ผ่านแล้ว, 90 อีก 45 วัน', () => {
    const result = milestoneStatus(milestones, 45)
    expect(result.map((m) => [m.id, m.status, m.daysLeft])).toEqual([
      ['d30', 'reached', 0],
      ['d90', 'next', 45],
      ['d180', 'later', 135],
    ])
  })
})

describe('findChunks', () => {
  const chunks = ['there is/there are', 'i can see', 'going to', 'kind of', 'and then', 'next to']
  it('รูปย่อ/ภาษาพูดนับเป็นวลีเดียวกัน', () => {
    expect(findChunks("There's a dad. I can see two kids and then they're gonna eat", chunks)).toEqual([
      'there is/there are',
      'i can see',
      'going to',
      'and then',
    ])
  })
  it('ต้องเรียงติดกัน ไม่นับคำที่อยู่ห่างกัน', () => {
    expect(findChunks('next the tree to', chunks)).toEqual([])
    expect(findChunks('kinda happy', chunks)).toEqual(['kind of'])
  })
})

describe('analyzeLevels', () => {
  it('ไม่นับเงียบก่อนเริ่มพูดและหลังพูดจบ / นับเงียบกลางคัน ≥ 2 วินาที', () => {
    const levels = levelsOf([0.001, 30], [0.2, 20], [0.002, 25], [0.15, 10], [0.002, 10], [0.2, 10], [0.001, 40])
    const result = analyzeLevels(levels)
    expect(result.pauses).toBe(1) // เงียบ 2.5 วิ = 1 ครั้ง, เงียบ 1 วิ ไม่นับ
    expect(result.voicedMs).toBe(4000)
    expect(result.longestPauseMs).toBe(2500)
  })
  it('เงียบทั้งหมด = ไม่ได้พูด', () => {
    expect(analyzeLevels(levelsOf([0.001, 100]))).toEqual({ voicedMs: 0, pauses: 0, longestPauseMs: 0 })
    expect(analyzeLevels([])).toEqual({ voicedMs: 0, pauses: 0, longestPauseMs: 0 })
  })
})

describe('computeStats', () => {
  it('คำต่อนาทีคิดจากเวลาที่อัดจริง', () => {
    const stats = computeStats({
      transcript: 'the dad and the kids are having a picnic',
      durationMs: 30000,
      levels: levelsOf([0.2, 50]),
      chunks: ['having a picnic', 'and the'],
    })
    expect(stats).toMatchObject({ words: 9, uniqueWords: 8, wpm: 18, chunks: ['having a picnic', 'and the'], pauses: 0 })
  })
  it('ชื่อวลีที่แสดง = แบบที่พูดจริง + i เป็น I', () => {
    const chunks = ['i can see/we can see', 'on the grass/on the blanket', 'have a picnic/having a picnic']
    expect(computeStats({ transcript: 'I can see a dad', durationMs: 5000, chunks }).chunks).toEqual(['I can see'])
    expect(computeStats({ transcript: "they're having a picnic on the blanket", durationMs: 5000, chunks }).chunks).toEqual([
      'on the blanket',
      'having a picnic',
    ])
  })
  it('ถอดข้อความไม่ได้ → ไม่มีตัวเลขคำ แต่ยังมีการหยุดนาน', () => {
    const stats = computeStats({ transcript: '', durationMs: 60000, levels: levelsOf([0.2, 40], [0.001, 30], [0.2, 40]) })
    expect(stats.words).toBeNull()
    expect(stats.wpm).toBeNull()
    expect(stats.chunks).toBeNull()
    expect(compareStats({ chunks: ['there is'] }, stats).chunks.delta).toBeNull()
    expect(stats.pauses).toBe(1)
    expect(isTooShort(stats)).toBe(false)
  })
  it('พูดสั้นมาก = สั้นไป', () => {
    expect(isTooShort(computeStats({ transcript: 'hi', durationMs: 2000, levels: levelsOf([0.001, 5], [0.2, 5]) }))).toBe(true)
  })
})

describe('compareStats', () => {
  it('ยิ่งมากยิ่งดี ยกเว้นการหยุดนาน', () => {
    const result = compareStats(
      { wpm: 40, words: 40, uniqueWords: 25, chunks: ['a'], pauses: 5 },
      { wpm: 70, words: 70, uniqueWords: 25, chunks: ['a', 'b', 'c'], pauses: 2 },
    )
    expect(result.wpm).toEqual({ from: 40, to: 70, delta: 30, better: true })
    expect(result.uniqueWords.better).toBeNull()
    expect(result.chunks).toMatchObject({ from: 1, to: 3, better: true })
    expect(result.pauses).toMatchObject({ delta: -3, better: true })
  })
  it('ครั้งไหนถอดข้อความไม่ได้ → ไม่เทียบตัวเลขคำ', () => {
    expect(compareStats({ wpm: null }, { wpm: 50 }).wpm.delta).toBeNull()
  })
})

describe('game.json speakingCheck', () => {
  const { speakingCheck, milestones } = gameData
  const storyLines = new Map(
    lessonsData.lessons.filter((lesson) => lesson.type === 'story').flatMap((lesson) => lesson.items.map((item) => [item.id, item])),
  )

  it('ภาพชุดเดิม 4 ภาพ = เรื่องเล่า Stage 5 (มีภาพ + ไฟล์เสียงจากบทนั้นแล้ว)', () => {
    expect(speakingCheck.pictures).toHaveLength(4)
    for (const picture of speakingCheck.pictures) {
      const item = storyLines.get(picture.id)
      expect(item, picture.id).toBeTruthy()
      expect(picture.image).toBe(item.image)
      expect(picture.target).toBe(item.target)
      expect(existsSync(join('public', picture.image))).toBe(true)
    }
  })

  it('คำถามช่วยคิด + วลีให้นับ มีครบ ไม่ซ้ำ', () => {
    expect(speakingCheck.prompts.length).toBeGreaterThanOrEqual(3)
    for (const prompt of speakingCheck.prompts) expect(prompt.text && prompt.textTh).toBeTruthy()
    expect(speakingCheck.chunks.length).toBeGreaterThanOrEqual(30)
    expect(new Set(speakingCheck.chunks).size).toBe(speakingCheck.chunks.length)
  })

  it('milestone 30 / 90 / 180 วัน มีเป้าหมาย + ลิงก์ฝึก', () => {
    expect(milestones.map((m) => m.day)).toEqual([30, 90, 180])
    for (const milestone of milestones) {
      expect(milestone.title && milestone.titleTh).toBeTruthy()
      expect(milestone.goals.length).toBeGreaterThan(0)
      for (const goal of milestone.goals) expect(goal.text && goal.textTh && goal.to.startsWith('/')).toBeTruthy()
    }
  })
})
