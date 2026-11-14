import { describe, it, expect } from 'vitest'
import { buildLessonSteps, GAME_ROUND_XP, isPlayable, LESSON_FLOWS, XP } from './lessonSteps'
import { lessonList, miniGames } from '../data'

const items = [{ id: 'a' }, { id: 'b' }]
const describeSteps = (steps) => steps.map((step) => (step.kind === 'game' ? `game:${step.game}` : `${step.kind}:${step.item.id}`))

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
})

describe('LESSON_FLOWS', () => {
  it('ทุกบทใน Stage 1–4 และบทประโยคในบริบทมีตัวเล่นแล้ว', () => {
    for (const lesson of lessonList.filter((entry) => entry.stageId <= 4 || entry.type === 'context')) {
      expect(isPlayable(lesson), lesson.id).toBe(true)
    }
  })

  it('เกมในบทเป็นมินิเกมที่มีอยู่จริง และมี XP ต่อรอบ', () => {
    for (const flow of Object.values(LESSON_FLOWS)) {
      expect(miniGames.some((game) => game.id === flow.game), flow.game).toBe(true)
      expect(GAME_ROUND_XP[flow.game]).toBeGreaterThan(0)
    }
  })

  it('XP ตามสเปก: ฟัง 5, พูดตาม 15, พูดเองไม่ดูข้อความ 25', () => {
    expect(XP).toMatchObject({ listen: 5, speak: 15, speakOwn: 25 })
  })
})
