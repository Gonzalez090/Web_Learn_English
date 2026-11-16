import { describe, it, expect } from 'vitest'
import {
  buildLessonSteps,
  flowGames,
  GAME_BASE,
  GAME_ROUND_XP,
  isPlayable,
  LESSON_FLOWS,
  readVariantOf,
  reviewKindsOf,
  XP,
} from './lessonSteps'
import { lessonList, miniGames } from '../data'

const items = [{ id: 'a' }, { id: 'b' }]
const describeSteps = (steps) =>
  steps.map((step) => {
    if (step.kind === 'game') return `game:${step.game}`
    return step.whole ? step.kind : `${step.kind}:${step.item.id}`
  })

describe('buildLessonSteps', () => {
  it('Stage 2–3: ทีละข้อ ฟัง → พูดตาม แล้วจบด้วยเกม', () => {
    expect(describeSteps(buildLessonSteps(LESSON_FLOWS.word, items))).toEqual([
      'lookListen:a',
      'speak:a',
      'lookListen:b',
      'speak:b',
      'game:listen-tap',
    ])
  })

  it('Stage 4: ฟัง → พูดตาม → สลับคำ ทีละข้อ → เกมคาราโอเกะ → รอบใช้เองทุกข้อ', () => {
    expect(describeSteps(buildLessonSteps(LESSON_FLOWS.sentence, items))).toEqual([
      'listenSentence:a',
      'speak:a',
      'swap:a',
      'listenSentence:b',
      'speak:b',
      'swap:b',
      'game:shadow-karaoke',
      'speakOwn:a',
      'speakOwn:b',
    ])
  })

  it('ประโยคในบริบท (Stage 5): ฟัง → พูดตาม → สลับคำ → เกม Word Swap Race → รอบใช้เอง', () => {
    expect(describeSteps(buildLessonSteps(LESSON_FLOWS.context, items))).toEqual([
      'listenContext:a',
      'speak:a',
      'swap:a',
      'listenContext:b',
      'speak:b',
      'swap:b',
      'game:word-swap-race',
      'speakOwn:a',
      'speakOwn:b',
    ])
  })

  it('คำคล้องจอง: ฟังทั้งเพลง → เติมคำเฉพาะบรรทัดที่ 2 ของคู่ → คาราโอเกะ → ร้องต่อเองทุกบรรทัด', () => {
    const lines = [{ id: 'a' }, { id: 'b', rhymeFill: { word: 'head' } }]
    expect(describeSteps(buildLessonSteps(LESSON_FLOWS.rhyme, lines))).toEqual([
      'listenRhyme',
      'rhymeFill:b',
      'game:shadow-karaoke',
      'speakOwn:a',
      'speakOwn:b',
    ])
  })

  it('บทสนทนา: ฟังทั้งบท → เลือกบท → เล่นบทบาท 2 รอบ / ฝึกซ้ำ = พูดตาม → พูดเองเฉพาะบรรทัดที่พลาด', () => {
    expect(describeSteps(buildLessonSteps(LESSON_FLOWS.dialogue, items))).toEqual([
      'listenDialogue',
      'chooseRole',
      'rolePlay',
      'rolePlayOwn',
    ])
    expect(describeSteps(buildLessonSteps(LESSON_FLOWS.dialogue, items, { retry: true }))).toEqual([
      'speak:a',
      'speak:b',
      'speakOwn:a',
      'speakOwn:b',
    ])
  })

  it('เรื่องเล่า: ฟังทั้งเรื่อง → พูดตามทีละภาพ → เกม Listen & Tap → เล่าเองทีละภาพ (ฝึกซ้ำใช้ลำดับเดิม)', () => {
    const expected = ['listenStory', 'speak:a', 'speak:b', 'game:listen-tap', 'tellStory:a', 'tellStory:b']
    expect(describeSteps(buildLessonSteps(LESSON_FLOWS.story, items))).toEqual(expected)
    expect(describeSteps(buildLessonSteps(LESSON_FLOWS.story, items, { retry: true }))).toEqual(expected)
  })
})

describe('LESSON_FLOWS', () => {
  it('ทุกบทใน Stage 1–6 มีตัวเล่นแล้ว', () => {
    for (const lesson of lessonList.filter((entry) => entry.stageId <= 6)) {
      expect(isPlayable(lesson), lesson.id).toBe(true)
    }
  })

  it('เกมในบทเป็นมินิเกมที่มีอยู่จริง และมี XP ต่อรอบ', () => {
    for (const flow of Object.values(LESSON_FLOWS)) {
      for (const id of flowGames(flow)) {
        expect(miniGames.some((game) => game.id === (GAME_BASE[id] ?? id)), id).toBe(true)
        expect(GAME_ROUND_XP[id], id).toBeGreaterThan(0)
      }
    }
  })

  it('Stage 6: phonics = เสียงใหม่ → อ่านทีละคำ → Minimal Pair Duel → Read & Tap', () => {
    const steps = buildLessonSteps(LESSON_FLOWS.phonics, items)
    expect(describeSteps(steps)).toEqual(['phonicsIntro', 'blend:a', 'blend:b', 'game:minimal-pair-duel', 'game:read-tap'])
    expect(readVariantOf({ type: 'phonics' })).toBe('blend')
    expect(readVariantOf({ type: 'sightWords' })).toBe('sight')
    expect(readVariantOf({ type: 'reading' })).toBe('page')
  })

  it('ทุกประเภทบทมีขั้นทบทวน — บทที่ใช้ภาพฉากเดียวกันทั้งบทห้ามใช้เกมแตะภาพ', () => {
    for (const [type, flow] of Object.entries(LESSON_FLOWS)) {
      const kinds = reviewKindsOf({ type })
      expect(kinds.length, type).toBeGreaterThan(0)
      if (flow.sharedImage) expect(kinds, type).not.toContain('tap')
    }
    expect(reviewKindsOf({ type: 'ไม่มี' })).toEqual([])
  })

  it('XP ตามสเปก: ฟัง 5, พูดตาม 15, พูดเองไม่ดูข้อความ 25', () => {
    expect(XP).toMatchObject({ listen: 5, speak: 15, speakOwn: 25 })
  })
})
