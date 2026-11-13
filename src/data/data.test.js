// ตรวจความถูกต้องของไฟล์ข้อมูลบทเรียน — กันพิมพ์ข้อมูลผิดตอนเพิ่มเนื้อหาใหม่
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { stages, lessons, miniGames, imageCredits } from './index.js'
import { collectSpeechTexts } from './speechTexts.js'
import audioManifest from './audioManifest.json'
import th from '../locales/th.json'
import en from '../locales/en.json'

// ทุกข้อความที่เว็บพูดต้องมีไฟล์เสียง Kokoro ทั้งความเร็วปกติและช้า
// (เพิ่ม/แก้เนื้อหาแล้ว test นี้ไม่ผ่าน → รัน npm run audio)
describe('ไฟล์เสียงเจ้าของภาษา (Kokoro)', () => {
  const texts = collectSpeechTexts({ lessons })
  const fileOf = (audioPath) => fileURLToPath(new URL(`../../public${audioPath}`, import.meta.url))

  it.each(texts)('"%s" มีไฟล์เสียงปกติและช้า และไฟล์มีอยู่จริง', (text) => {
    for (const speed of ['normal', 'slow']) {
      const audioPath = audioManifest[speed][text]
      expect(audioPath, `${speed}: ${text} — รัน npm run audio`).toMatch(/^\/audio\/[0-9a-f]{12}\.mp3$/)
      expect(existsSync(fileOf(audioPath)), audioPath).toBe(true)
    }
  })

  it('ไม่มีไฟล์เสียงค้างของข้อความที่ไม่ใช้แล้ว', () => {
    const used = new Set(texts)
    for (const speed of ['normal', 'slow']) {
      expect(Object.keys(audioManifest[speed]).filter((text) => !used.has(text)), speed).toEqual([])
    }
  })
})

const REGISTERS = ['casual', 'neutral', 'formal']
const FREQUENCIES = ['very-common', 'common', 'sometimes']
const SHOW_TEXT = ['never', 'toggle', 'always']
const LESSON_TYPES = ['listen', 'word', 'twoWord', 'sentence', 'dialogue', 'story', 'phonics', 'writing']
const SPEAKING_TYPES = ['word', 'twoWord', 'sentence']

// ทำข้อความให้อยู่ในรูปมาตรฐานก่อนเทียบ: ตัวเล็ก, ตัดเครื่องหมาย (ยกเว้น '), เว้นวรรคเดียว
const normalize = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// คำ/วลีนี้อยู่ในประโยคแบบเต็มคำหรือไม่ (ไม่สนตัวพิมพ์เล็ก-ใหญ่)
const containsWord = (sentence, word) =>
  new RegExp(`(^|[^a-z'])${escapeRegExp(word.toLowerCase())}($|[^a-z])`).test(sentence.toLowerCase())

const allItems = lessons.flatMap((lesson) => lesson.items.map((item) => ({ lesson, item })))

describe('stages', () => {
  it('มี Stage 1–7 เรียงตามลำดับ', () => {
    expect(stages.map((stage) => stage.id)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it.each(stages)('Stage $id มีข้อมูลครบทั้งไทยและอังกฤษ + ภาพถ่าย', (stage) => {
    for (const field of ['name', 'nameTh', 'age', 'ageTh', 'description', 'descriptionTh']) {
      expect(stage[field], field).toBeTruthy()
    }
    expect(SHOW_TEXT).toContain(stage.showText)
    expect(stage.image).toBe(`/images/stage-${stage.id}.webp`)
    expect(stage.emoji, 'ห้ามใช้ emoji เป็นภาพ').toBeUndefined()
  })

  it('Stage 1–3 ห้ามแสดงตัวอักษร และ Stage 4 ซ่อนไว้กดเปิดดูได้', () => {
    expect(stages.filter((s) => s.id <= 3).every((s) => s.showText === 'never')).toBe(true)
    expect(stages.find((s) => s.id === 4).showText).toBe('toggle')
  })
})

describe('lessons', () => {
  it('id ของบทเรียนไม่ซ้ำกัน', () => {
    const ids = lessons.map((lesson) => lesson.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('id ของทุกข้อไม่ซ้ำกันทั้งไฟล์', () => {
    const ids = allItems.map(({ item }) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(lessons)('บท $id ผูกกับ Stage จริง ประเภทถูกต้อง และหมวดมีคำแปล UI', (lesson) => {
    expect(stages.some((stage) => stage.id === lesson.stageId)).toBe(true)
    expect(LESSON_TYPES).toContain(lesson.type)
    expect(lesson.title).toBeTruthy()
    expect(lesson.titleTh).toBeTruthy()
    expect(th.category[lesson.category]).toBeTruthy()
    expect(en.category[lesson.category]).toBeTruthy()
  })

  it.each([1, 2, 3, 4])('Stage %i มีบทเรียนอย่างน้อย 1 บท บทละ 5 ข้อ', (stageId) => {
    const stageLessons = lessons.filter((lesson) => lesson.stageId === stageId)
    expect(stageLessons.length).toBeGreaterThan(0)
    stageLessons.forEach((lesson) => expect(lesson.items).toHaveLength(5))
  })
})

describe('items', () => {
  it.each(allItems.map(({ lesson, item }) => [item.id, lesson, item]))(
    '%s มีข้อมูลพื้นฐานครบ',
    (_id, lesson, item) => {
      // ภาพประกอบเป็นภาพถ่ายจริง ชื่อไฟล์ = id ของข้อ (ห้ามใช้ emoji)
      expect(item.image).toBe(`/images/${item.id}.webp`)
      expect(item.emoji, 'ห้ามใช้ emoji เป็นภาพ').toBeUndefined()
      expect(item.readingTh).toBeTruthy()
      expect(item.meaningTh ?? item.translationTh).toBeTruthy()
      expect(REGISTERS).toContain(item.register)
      expect(FREQUENCIES).toContain(item.frequency)

      // คำเดี่ยวระบุพยางค์ที่ลงเสียงหนัก (นับจากคำอ่านไทยที่คั่นด้วย -)
      if (item.stressSyllable !== undefined) {
        const syllables = item.readingTh.split('-').length
        expect(item.stressSyllable).toBeGreaterThanOrEqual(1)
        expect(item.stressSyllable).toBeLessThanOrEqual(syllables)
      }

      // คำที่ลงเสียงหนักต้องอยู่ในคำ/ประโยคจริง
      for (const word of item.stressWords ?? []) {
        expect(containsWord(item.target ?? item.word, word), word).toBe(true)
      }

      // Stage 1–3 ใช้ภาษาแบบพ่อแม่คุยกับลูก (parentese) อย่างน้อย 2 ประโยค
      if (lesson.stageId <= 3) {
        expect(item.parentese?.length).toBeGreaterThanOrEqual(2)
      }

      // บทที่ต้องพูดต้องมีคำ/ประโยคเป้าหมาย
      if (SPEAKING_TYPES.includes(lesson.type)) {
        expect(typeof item.target).toBe('string')
        expect(item.target.length).toBeGreaterThan(0)
        expect(Array.isArray(item.acceptAlso)).toBe(true)
      }
    },
  )
})

describe('Stage 4: recast + สลับคำ', () => {
  const sentenceItems = allItems.filter(({ lesson }) => lesson.type === 'sentence').map(({ item }) => item)

  it.each(sentenceItems.map((item) => [item.id, item]))('%s มีคำถาม คำแปล และทำนองเสียง', (_id, item) => {
    expect(item.question).toBeTruthy()
    expect(item.questionTh).toBeTruthy()
    expect(item.translationTh).toBeTruthy()
    expect(['up', 'down']).toContain(item.intonation)
  })

  it.each(sentenceItems.map((item) => [item.id, item]))(
    '%s รูปแบบผิดที่พบบ่อยใช้งานได้ และไม่จับคำตอบที่ถูก',
    (_id, item) => {
      expect(item.commonErrors.length).toBeGreaterThan(0)
      const correctAnswers = [item.target, ...item.acceptAlso].map(normalize)
      for (const { pattern, correct } of item.commonErrors) {
        const regex = new RegExp(pattern)
        expect(correct).toBeTruthy()
        for (const answer of correctAnswers) {
          expect(regex.test(answer), `${pattern} ไม่ควรจับ "${answer}"`).toBe(false)
        }
      }
    },
  )

  it.each(sentenceItems.map((item) => [item.id, item]))('%s คำสำคัญมีคำแทน 3–5 คำ', (_id, item) => {
    expect(item.keywords.length).toBeGreaterThan(0)
    for (const keyword of item.keywords) {
      expect(containsWord(item.target, keyword.word), keyword.word).toBe(true)
      expect(keyword.alternatives.length).toBeGreaterThanOrEqual(3)
      expect(keyword.alternatives.length).toBeLessThanOrEqual(5)
      for (const alt of keyword.alternatives) {
        expect(alt.word).toBeTruthy()
        expect(alt.meaningTh).toBeTruthy()
        expect(REGISTERS).toContain(alt.register)
      }
    }
  })
})

describe('ภาพถ่ายประกอบ', () => {
  const imagePaths = [...stages.map((stage) => stage.image), ...allItems.map(({ item }) => item.image)]
  // '/images/x.webp' → ไฟล์จริงใน public/images/x.webp
  const fileOf = (imagePath) => fileURLToPath(new URL(`../../public${imagePath}`, import.meta.url))
  const idOf = (imagePath) => imagePath.replace('/images/', '').replace('.webp', '')

  it.each(imagePaths)('%s มีไฟล์ภาพจริง', (imagePath) => {
    expect(existsSync(fileOf(imagePath))).toBe(true)
  })

  it.each(imagePaths)('%s มีเครดิตช่างภาพ', (imagePath) => {
    const credit = imageCredits[idOf(imagePath)]
    expect(credit?.photographer).toBeTruthy()
    expect(credit?.pageUrl).toMatch(/^https:\/\//)
  })

  it('ไม่มีเครดิตค้างของภาพที่ไม่ได้ใช้แล้ว', () => {
    const used = new Set(imagePaths.map(idOf))
    expect(Object.keys(imageCredits).filter((id) => !used.has(id))).toEqual([])
  })
})

describe('miniGames', () => {
  it('มี 6 เกม id ไม่ซ้ำ และมีข้อมูลครบ', () => {
    expect(miniGames).toHaveLength(6)
    expect(new Set(miniGames.map((game) => game.id)).size).toBe(6)
    for (const game of miniGames) {
      expect(game.name && game.description && game.descriptionTh && game.step).toBeTruthy()
    }
  })
})
