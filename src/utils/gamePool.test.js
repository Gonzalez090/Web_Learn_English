import { describe, expect, it } from 'vitest'
import { gameAvailability, LESSON_GAMES, pickOther, playableLessons } from './gamePool'
import { swapRaceRounds } from './swap'
import lessonsData from '../data/lessons.json'
import gameData from '../data/game.json'

const { lessons } = lessonsData
const done = (...ids) => Object.fromEntries(ids.map((id) => [id, { completed: true }]))
const byType = (type) => lessons.find((lesson) => lesson.type === type)

describe('playableLessons', () => {
  it('เฉพาะบทที่เรียนจบแล้ว และชนิดที่เกมนี้ใช้ได้', () => {
    const progress = { ...done(byType('word').id, byType('sentence').id, byType('writing').id), [byType('listen').id]: { completed: false } }
    expect(playableLessons('listen-tap', lessons, progress).map((lesson) => lesson.id)).toEqual([byType('word').id])
    expect(playableLessons('shadow-karaoke', lessons, progress).map((lesson) => lesson.id)).toEqual([byType('sentence').id])
    expect(playableLessons('real-or-textbook', lessons, progress)).toEqual([])
    expect(playableLessons('listen-tap', lessons, {})).toEqual([])
  })
})

describe('ทุกบทที่เกมใช้ได้ เล่นได้จริง', () => {
  const usable = (gameId) => lessons.filter((lesson) => LESSON_GAMES[gameId].types.includes(lesson.type))

  it('Listen & Tap: ≥ 3 ข้อ มีภาพและคำ ภาพในบทไม่ซ้ำ', () => {
    for (const lesson of usable('listen-tap')) {
      expect(lesson.items.length, lesson.id).toBeGreaterThanOrEqual(3)
      expect(new Set(lesson.items.map((item) => item.image)).size, lesson.id).toBe(lesson.items.length)
      for (const item of lesson.items) expect(item.image && (item.target ?? item.word), item.id).toBeTruthy()
    }
  })

  it('Shadow Karaoke: ทุกข้อมีประโยคและภาพ', () => {
    for (const lesson of usable('shadow-karaoke')) for (const item of lesson.items) expect(item.target && item.image, item.id).toBeTruthy()
  })

  it('Word Swap Race: ทุกบทมีอย่างน้อย 4 รอบ', () => {
    for (const lesson of usable('word-swap-race')) expect(swapRaceRounds(lesson.items).length, lesson.id).toBeGreaterThanOrEqual(4)
  })

  it('Stage ที่บอกผู้เรียน = Stage แรกที่มีบทชนิดนั้นจริง', () => {
    for (const [gameId, game] of Object.entries(LESSON_GAMES)) {
      expect(Math.min(...usable(gameId).map((lesson) => lesson.stageId)), gameId).toBe(game.stage)
    }
  })
})

describe('pickOther', () => {
  const list = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  it('ไม่ซ้ำตัวล่าสุดถ้ามีตัวอื่น', () => {
    for (let i = 0; i < 20; i += 1) expect(pickOther(list, 'b', () => i / 20).id).not.toBe('b')
    expect(pickOther([{ id: 'a' }], 'a').id).toBe('a')
    expect(pickOther([], 'a')).toBeNull()
  })
})

describe('gameAvailability', () => {
  const base = { lessonList: lessons, lessonProgress: {}, speedScenarios: [] }
  it('ผู้เรียนใหม่: เล่นได้ 2 เกม ที่เหลือบอก Stage', () => {
    const status = Object.fromEntries(gameData.miniGames.map((game) => [game.id, gameAvailability(game.id, base)]))
    expect(status['minimal-pair-duel']).toEqual({ ready: true, stage: null })
    expect(status['real-or-textbook']).toEqual({ ready: true, stage: null })
    expect(status['listen-tap']).toEqual({ ready: false, stage: 1 })
    expect(status['shadow-karaoke']).toEqual({ ready: false, stage: 4 })
    expect(status['word-swap-race']).toEqual({ ready: false, stage: 4 })
    expect(status['speed-order']).toEqual({ ready: false, stage: 1 })
  })
  it('เรียนจบบท / มีบทสนทนาที่เปิดแล้ว → เล่นได้', () => {
    expect(gameAvailability('listen-tap', { ...base, lessonProgress: done(byType('listen').id) }).ready).toBe(true)
    expect(gameAvailability('speed-order', { ...base, speedScenarios: [{ id: 'store' }] }).ready).toBe(true)
  })
})
