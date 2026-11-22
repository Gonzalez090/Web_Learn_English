// ตรวจความถูกต้องของไฟล์ข้อมูลบทเรียน — กันพิมพ์ข้อมูลผิดตอนเพิ่มเนื้อหาใหม่
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { miniGames, soundPractice } from './index.js'
import lessonsData from './lessons.json'
import phonicsData from './phonics.json'
import phrasesData from './phrases.json'
import scenariosData from './scenarios.json'
import worldData from './world.json'
import { expandScenarioTexts, slotsIn } from '../utils/conversation.js'
import imageCredits from './imageCredits.json'
import { collectSpeechTexts, collectVoicedTexts } from './speechTexts.js'
import { audioPathFor, NPC_VOICES } from '../utils/audioPath.js'
import { swapVariants } from '../utils/swap.js'
import { LESSON_FLOWS } from '../utils/lessonSteps.js'
import { prepareLessonItems } from '../utils/lessonItems.js'
import { checkKeywords } from '../utils/storyCheck.js'
import { graphemeUnits, spellUnits } from '../utils/reading.js'
import { checkFreeWriting, hasThaiLetters, SPELLING_MODES, splitBlank } from '../utils/spelling.js'
import { FRIENDSHIP_THRESHOLDS } from '../utils/friendship.js'
import { itemTexts, totalVocabulary, wordsOf } from '../utils/vocabulary.js'
import audioManifest from './audioManifest.json'
import th from '../locales/th.json'
import en from '../locales/en.json'

// ตรวจเนื้อหาเต็มจาก lessons.json โดยตรง (ในเว็บ เนื้อหาถูกแบ่งโหลดราย Stage — ตรวจใน lessonChunks.test.js)
const { stages, lessons } = lessonsData

// ทุกข้อความที่เว็บพูดต้องมีไฟล์เสียง Kokoro ทั้งความเร็วปกติและช้า
// (เพิ่ม/แก้เนื้อหาแล้ว test นี้ไม่ผ่าน → รัน npm run audio)
describe('ไฟล์เสียงเจ้าของภาษา (Kokoro)', () => {
  const texts = collectSpeechTexts({
    lessons,
    soundPractice,
    phonicsSounds: phonicsData.sounds,
    phrases: phrasesData,
    scenarios: scenariosData.scenarios,
    npcs: worldData.npcs,
  })
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

  // ขั้นที่ 28-1: NPC พูดด้วยเสียง Kokoro ของตัวเอง (ผสมสำเนียงอเมริกัน + อังกฤษ)
  const voiced = collectVoicedTexts({ scenarios: scenariosData.scenarios, npcs: worldData.npcs })

  it('NPC ทุกคนมีเสียงของตัวเอง (เสียง Kokoro ที่รองรับ) มีทั้งสำเนียงอเมริกันและอังกฤษ และไม่ซ้ำกัน', () => {
    const voices = worldData.npcs.map((npc) => npc.voice)
    for (const npc of worldData.npcs) expect(NPC_VOICES, npc.id).toContain(npc.voice)
    expect(new Set(voices).size).toBe(voices.length)
    expect(voices.some((voice) => voice.startsWith('a'))).toBe(true)
    expect(voices.some((voice) => voice.startsWith('b'))).toBe(true)
  })

  it.each(Object.keys(voiced))('เสียง NPC %s: ทุกข้อความมีไฟล์ปกติและช้า ชื่อไฟล์ตรงกับที่หน้าเว็บคำนวณ', (voice) => {
    const missing = []
    for (const text of voiced[voice]) {
      for (const speed of ['normal', 'slow']) {
        const audioPath = audioManifest.voices?.[voice]?.[speed]?.[text]
        if (audioPath !== audioPathFor(text, speed, voice) || !existsSync(fileOf(audioPath))) missing.push(`${speed}: ${text}`)
      }
    }
    expect(missing.slice(0, 5), `ขาด ${missing.length} ไฟล์ — รัน npm run audio`).toEqual([])
  })

  it('บรรทัดของ NPC ที่มีเสียงของตัวเองไม่ถูกสร้างซ้ำด้วยเสียงหลัก (ไม่เปลืองไฟล์)', () => {
    const main = new Set(texts)
    const onlyVoiced = Object.values(voiced)
      .flat()
      .filter((text) => !main.has(text))
    // (ข้อความเดียวกันที่มีในบทเรียน/คลังวลีด้วย ยังมีเสียงหลักตามปกติ)
    expect(onlyVoiced.length).toBeGreaterThan(0)
  })
})

const REGISTERS = ['casual', 'neutral', 'formal']
const FREQUENCIES = ['very-common', 'common', 'sometimes']
const SHOW_TEXT = ['never', 'toggle', 'always']
const LESSON_TYPES = [
  'listen',
  'word',
  'twoWord',
  'sentence',
  'context',
  'dialogue',
  'story',
  'rhyme',
  'phonics',
  'sightWords',
  'reading',
  'writing',
]
const SPEAKING_TYPES = ['word', 'twoWord', 'sentence', 'context', 'dialogue', 'story', 'rhyme']

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
      // บทที่ใช้ภาพฉากเดียวกันทั้งบท (บทสนทนา/คำคล้องจอง) → ชื่อไฟล์ = id ของบท
      const imageId = LESSON_FLOWS[lesson.type]?.sharedImage ? lesson.id : item.id
      expect(item.image).toBe(`/images/${imageId}.webp`)
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

// สลับคำในบริบท (Stage 4+): ทุกประโยคที่สลับต้องเปลี่ยนจริง ไม่ซ้ำกัน และมีไฟล์เสียง (ตรวจในชุดไฟล์เสียงด้านบน)
describe('สลับคำในบริบท', () => {
  const swapItems = allItems.filter(({ item }) => item.keywords?.length).map(({ item }) => [item.id, item])

  it.each(swapItems)('%s สลับคำแล้วได้ประโยคใหม่ทุกแบบ ไม่ซ้ำกัน', (_id, item) => {
    const texts = swapVariants(item).map((variant) => variant.text)
    expect(texts.length).toBeGreaterThan(0)
    expect(texts).not.toContain(item.target)
    expect(new Set(texts).size).toBe(texts.length)
    // a / an ไม่ผิดหน้าคำที่ขึ้นต้นด้วยสระ/พยัญชนะ (ยกเว้นคำอย่าง unicorn / hour)
    for (const text of texts) expect(text, text).not.toMatch(/\ba [aeio]\w|\ban [bcdfgjklmnpqrstvwxz]/i)
  })
})

// ประโยคในบริบท (Stage 5+, ส่วนที่ 2.2 + 2.3)
describe('ประโยคในบริบท (context)', () => {
  const contextItems = allItems.filter(({ lesson }) => lesson.type === 'context').map(({ item }) => [item.id, item])

  it('มีบทตัวอย่างอย่างน้อย 1 บท', () => {
    expect(contextItems.length).toBeGreaterThan(0)
  })

  it.each(contextItems)('%s มีฉาก เสียงพูดเชื่อม คำสำคัญ และแบบอื่นครบ', (_id, item) => {
    expect(item.scene && item.sceneTh).toBeTruthy()
    expect(['up', 'down']).toContain(item.intonation)
    expect(item.keywords.length).toBeGreaterThan(0)
    for (const entry of item.connectedSpeech ?? []) {
      expect(containsWord(item.target, entry.text), entry.text).toBe(true)
      expect(entry.full || entry.spoken, entry.text).toBeTruthy()
      expect(entry.readingTh).toBeTruthy()
    }
    for (const other of item.alsoSay ?? []) {
      expect(other.text && other.translationTh).toBeTruthy()
      expect(REGISTERS).toContain(other.register)
    }
  })
})

// รูปแบบผิดที่พบบ่อยของบทอื่นนอกจาก Stage 4 (ไม่บังคับมี แต่ถ้ามีต้องใช้งานได้)
describe('recast ของบท Stage 5 (ประโยคในบริบท / บทสนทนา / คำคล้องจอง)', () => {
  const withErrors = allItems
    .filter(({ lesson, item }) => lesson.type !== 'sentence' && item.commonErrors?.length)
    .map(({ item }) => [item.id, item])

  it.each(withErrors)('%s รูปแบบผิดใช้งานได้ และไม่จับคำตอบที่ถูก', (_id, item) => {
    const correctAnswers = [item.target, ...item.acceptAlso].map(normalize)
    for (const { pattern, correct } of item.commonErrors) {
      const regex = new RegExp(pattern)
      expect(correct).toBeTruthy()
      for (const answer of correctAnswers) {
        expect(regex.test(answer), `${pattern} ไม่ควรจับ "${answer}"`).toBe(false)
      }
    }
  })
})

// บทสนทนา (Stage 5): ผู้พูด 2 คน บทละ 4–6 บรรทัด ทั้งสองคนได้พูด — ผู้ใช้เลือกเป็นใครก็ได้
describe('บทสนทนา (dialogue)', () => {
  const dialogues = lessons.filter((lesson) => lesson.type === 'dialogue').map((lesson) => [lesson.id, lesson])

  it('มีบทตัวอย่างอย่างน้อย 1 บท', () => {
    expect(dialogues.length).toBeGreaterThan(0)
  })

  it.each(dialogues)('%s มีฉาก ผู้พูด 2 คน 4–6 บรรทัด และแต่ละคนพูดอย่างน้อย 2 ประโยค', (_id, lesson) => {
    expect(lesson.scene && lesson.sceneTh).toBeTruthy()
    expect(lesson.speakers).toHaveLength(2)
    expect(lesson.items.length).toBeGreaterThanOrEqual(4)
    expect(lesson.items.length).toBeLessThanOrEqual(6)
    for (const speaker of lesson.speakers) {
      expect(speaker.id && speaker.name && speaker.nameTh).toBeTruthy()
      expect(lesson.items.filter((line) => line.speaker === speaker.id).length, speaker.id).toBeGreaterThanOrEqual(2)
    }
    for (const line of lesson.items) {
      expect(lesson.speakers.map((speaker) => speaker.id)).toContain(line.speaker)
      expect(['up', 'down']).toContain(line.intonation)
      for (const entry of line.connectedSpeech ?? []) {
        expect(containsWord(line.target, entry.text), entry.text).toBe(true)
        expect(entry.full || entry.spoken, entry.text).toBeTruthy()
        expect(entry.readingTh).toBeTruthy()
      }
    }
  })
})

// เรื่องเล่าจากภาพ (Stage 5): 3–4 ภาพต่อกัน ภาพของตัวเอง — เล่าเองแล้วตรวจคำสำคัญ
describe('เรื่องเล่าจากภาพ (story)', () => {
  const stories = lessons.filter((lesson) => lesson.type === 'story')
  const panels = stories.flatMap((lesson) => lesson.items).map((item) => [item.id, item])

  it('มีเรื่องตัวอย่างอย่างน้อย 1 เรื่อง และเรื่องละ 3–4 ภาพ', () => {
    expect(stories.length).toBeGreaterThan(0)
    for (const lesson of stories) {
      expect(lesson.items.length, lesson.id).toBeGreaterThanOrEqual(3)
      expect(lesson.items.length, lesson.id).toBeLessThanOrEqual(4)
    }
  })

  it.each(panels)('%s มีคำสำคัญ 1–4 คำ และประโยคที่เจ้าของภาษาเล่ามีคำสำคัญครบ', (_id, item) => {
    expect(item.requiredWords.length).toBeGreaterThanOrEqual(1)
    expect(item.requiredWords.length).toBeLessThanOrEqual(4)
    expect(['up', 'down']).toContain(item.intonation)
    const missing = checkKeywords(item.requiredWords, item.target).words.filter((word) => !word.found)
    expect(missing.map((word) => word.text)).toEqual([])
  })
})

// คำคล้องจอง (Stage 5): คู่ละ 2 บรรทัด (AABB) อย่างน้อย 2 คู่ — คำท้ายของคู่อื่นเป็นตัวหลอกในขั้นเติมคำ
describe('คำคล้องจอง (rhyme)', () => {
  const rhymes = lessons.filter((lesson) => lesson.type === 'rhyme').map((lesson) => [lesson.id, lesson])

  it('มีเพลงตัวอย่างอย่างน้อย 1 เพลง', () => {
    expect(rhymes.length).toBeGreaterThan(0)
  })

  it.each(rhymes)('%s เป็นคู่ ≥ 2 คู่ ทุกคู่มีขั้นเติมคำ ตัวเลือก ≥ 3 ไม่ซ้ำกัน', (_id, lesson) => {
    expect(lesson.items.length % 2).toBe(0)
    expect(lesson.items.length).toBeGreaterThanOrEqual(4)
    const fills = prepareLessonItems(lesson).filter((item) => item.rhymeFill)
    expect(fills).toHaveLength(lesson.items.length / 2)
    for (const { id, rhymeFill } of fills) {
      expect(rhymeFill.choices.length, id).toBeGreaterThanOrEqual(3)
      expect(new Set(rhymeFill.choices).size, id).toBe(rhymeFill.choices.length)
      expect(rhymeFill.choices, id).toContain(rhymeFill.word.toLowerCase())
    }
  })
})

// ---------- Stage 6 อ่าน: phonics / sight words / อ่านนิทาน ----------
// หลักข้อ 9 "พูดได้ก่อนอ่าน": ทุกคำที่ให้อ่าน (และคำคู่ในเกม) ต้องได้ยินแล้วในข้อความที่ฟังของ Stage 1–5
describe('Stage 6 อ่าน', () => {
  const stage6 = lessons.filter((lesson) => lesson.stageId === 6)
  const soundsById = Object.fromEntries(phonicsData.sounds.map((sound) => [sound.id, sound]))
  const heardBefore = new Set(
    lessons
      .filter((lesson) => lesson.stageId <= 5)
      .flatMap((lesson) => lesson.items.flatMap(itemTexts))
      .flatMap(wordsOf),
  )
  const unheard = (text) => wordsOf(text).filter((word) => !heardBefore.has(word))

  it('มีบทตัวอย่างครบ 3 แบบ: phonics / sight words / อ่านนิทาน', () => {
    for (const type of ['phonics', 'sightWords', 'reading']) {
      expect(stage6.some((lesson) => lesson.type === type), type).toBe(true)
    }
  })

  // ไล่ตามลำดับบทจริง: คำที่ได้ยินจากส่วน "พ่อแม่อ่านให้ฟัง" ของนิทาน นับว่าได้ยินแล้วสำหรับบทหลังจากนั้น
  it('ทุกคำที่ให้อ่าน + คำคู่ในเกม ได้ยินมาก่อน (Stage 1–5 หรือนิทานที่พ่อแม่อ่านให้ฟังก่อนหน้า)', () => {
    const heard = new Set(heardBefore)
    const problems = []
    for (const item of stage6.flatMap((lesson) => lesson.items)) {
      for (const word of wordsOf(item.readAloud ?? '')) heard.add(word)
      for (const text of [item.word, item.target, item.pairWith].filter(Boolean)) {
        const unknown = wordsOf(text).filter((word) => !heard.has(word))
        if (unknown.length) problems.push(`${item.id}: ${unknown.join(', ')}`)
      }
    }
    expect(problems).toEqual([])
  })

  it('sight words ครบ 220 คำของ Dolch ไม่ซ้ำกัน', () => {
    const words = stage6.filter((lesson) => lesson.type === 'sightWords').flatMap((lesson) => lesson.items.map((item) => item.word))
    expect(new Set(words).size).toBe(words.length)
    expect(words.length).toBeGreaterThanOrEqual(220)
  })

  it('ทุกข้อมีคำตอบที่ยอมรับเพิ่ม (acceptAlso) และคำคู่ในเกมไม่ซ้ำกับคำของข้อ', () => {
    for (const item of stage6.flatMap((lesson) => lesson.items)) {
      expect(Array.isArray(item.acceptAlso), item.id).toBe(true)
      if (item.pairWith) expect(item.pairWith.toLowerCase(), item.id).not.toBe(item.word.toLowerCase())
    }
  })

  it('phonics: เสียงของบทมีใน phonics.json, ตัวอักษรสะกดเป็นคำได้ และใช้แค่เสียงที่สอนแล้ว', () => {
    const taught = new Set()
    for (const lesson of stage6.filter((entry) => entry.type === 'phonics')) {
      for (const id of lesson.sounds) {
        expect(soundsById[id], `${lesson.id}: ${id}`).toBeTruthy()
        taught.add(id)
      }
      for (const item of lesson.items) {
        expect(spellUnits(graphemeUnits(item.graphemes, soundsById)), item.id).toBe(item.word)
        expect(item.graphemes.filter((id) => !taught.has(id)), item.id).toEqual([])
        expect(item.pairWith, item.id).toBeTruthy()
      }
    }
  })

  it('sight words: คำอยู่ในประโยคที่ให้อ่าน และมีคำคู่หน้าตาคล้าย', () => {
    for (const item of stage6.filter((lesson) => lesson.type === 'sightWords').flatMap((lesson) => lesson.items)) {
      expect(containsWord(item.target, item.word), item.id).toBe(true)
      expect(item.pairWith, item.id).toBeTruthy()
      expect(item.translationTh, item.id).toBeTruthy()
    }
  })

  it('อ่านนิทาน: 40 เรื่อง เรื่องละ 3–6 หน้า ทุกหน้ามีภาพของตัวเอง + ฉบับพ่อแม่อ่านให้ฟังพร้อมคำแปล', () => {
    const readers = stage6.filter((entry) => entry.type === 'reading')
    expect(readers.length).toBeGreaterThanOrEqual(40)
    for (const lesson of readers) {
      expect(lesson.items.length, lesson.id).toBeGreaterThanOrEqual(3)
      expect(lesson.items.length, lesson.id).toBeLessThanOrEqual(6)
      expect(new Set(lesson.items.map((item) => item.image)).size, lesson.id).toBe(lesson.items.length)
      for (const item of lesson.items) {
        expect(item.readAloud && item.readAloudTh && item.readAloudReadingTh, item.id).toBeTruthy()
      }
    }
  })

  it.each(phonicsData.sounds.map((sound) => [sound.id, sound]))(
    'เสียง %s มีข้อมูลครบ และคำตัวอย่างเป็นคำที่ได้ยินแล้ว',
    (_id, sound) => {
      for (const field of ['grapheme', 'soundTh', 'tipTh']) expect(sound[field], field).toBeTruthy()
      if (!sound.silent) expect(sound.ipa, 'ipa').toBeTruthy() // e ท้ายคำ (ไม่ออกเสียง) ไม่มี ipa
      expect(sound.examples.length).toBeGreaterThanOrEqual(1)
      expect(sound.examples.flatMap(unheard)).toEqual([])
    },
  )

  // ขั้นที่ 25: ครบ 44 หน่วยเสียงของภาษาอังกฤษ (x = ks, qu = kw เป็นเสียงผสม ไม่นับ) และทุกเสียงในตารางได้สอนในบท
  it('phonics ครบ 44 หน่วยเสียง และทุกตัวในตารางเสียงมีบทที่สอน', () => {
    const phonemes = new Set(phonicsData.sounds.filter((sound) => sound.ipa && !sound.combo).map((sound) => sound.ipa))
    expect(phonemes.size).toBeGreaterThanOrEqual(44)
    const taughtIds = new Set(stage6.filter((lesson) => lesson.type === 'phonics').flatMap((lesson) => lesson.sounds))
    expect(phonicsData.sounds.filter((sound) => !taughtIds.has(sound.id)).map((sound) => sound.id)).toEqual([])
  })
})

// ---------- Stage 7 เขียน (ขั้นที่ 9) ----------
// หลักข้อ 11 "เขียนหลังอ่าน": ทุกคำที่ให้เขียน (คำตอบ / ตัวอย่าง / คำสำคัญ) ต้องเคยอ่านแล้วใน Stage 6
describe('Stage 7 เขียน', () => {
  const stage7 = lessons.filter((lesson) => lesson.stageId === 7)
  const items7 = stage7.flatMap((lesson) => lesson.items)
  const EXERCISES = ['dictation', 'fill', 'order', 'describe', 'story']
  const readInStage6 = new Set(
    lessons
      .filter((lesson) => lesson.stageId === 6)
      .flatMap((lesson) => lesson.items)
      .flatMap((item) => wordsOf(item.target ?? item.word)),
  )
  const modelsOf = (item) => [item.target, ...(item.examples ?? []).map((example) => example.text)]

  // ขั้นที่ 26: เป้าแบบฝึกเขียน 150 + ช่วงแรกยอมรับสะกดตามเสียง แล้วค่อยเข้มขึ้น (หลักข้อ 11)
  it('แบบฝึกเขียน ≥ 150 ข้อ และบทที่สะกดตามเสียงได้มาก่อนบทที่ต้องสะกดตรงทั้งหมด', () => {
    expect(items7.length).toBeGreaterThanOrEqual(150)
    const modes = stage7.map((lesson) => lesson.spelling)
    expect(modes.lastIndexOf('sound')).toBeLessThan(modes.indexOf('exact'))
  })

  it('มีแบบฝึกครบ 5 แบบ แต่ละบทเรียงจากง่ายไปยาก + บอกระดับการตรวจตัวสะกด (บทแรกสะกดตามเสียงได้)', () => {
    expect(stage7.length).toBeGreaterThanOrEqual(1)
    expect(new Set(items7.map((item) => item.exercise))).toEqual(new Set(EXERCISES))
    for (const lesson of stage7) {
      expect(lesson.type, lesson.id).toBe('writing')
      expect(SPELLING_MODES, lesson.id).toContain(lesson.spelling)
      const order = lesson.items.map((item) => EXERCISES.indexOf(item.exercise))
      expect(order.every((value, index) => value >= 0 && (index === 0 || value >= order[index - 1])), lesson.id).toBe(true)
    }
    expect(stage7[0].spelling).toBe('sound')
  })

  it('ทุกคำที่ให้เขียน (คำตอบ / ตัวอย่าง / บรรทัดเรื่อง / คำสำคัญ) เคยอ่านแล้วใน Stage 6', () => {
    const problems = []
    for (const item of items7) {
      const texts = [
        ...modelsOf(item),
        item.blank,
        ...(item.lines ?? []).map((line) => line.text),
        ...(item.requiredWords ?? []).flatMap((entry) => entry.split('/')),
      ].filter(Boolean)
      const unread = texts.flatMap(wordsOf).filter((word) => !readInStage6.has(word))
      if (unread.length) problems.push(`${item.id}: ${[...new Set(unread)].join(', ')}`)
    }
    expect(problems).toEqual([])
  })

  it('เติมคำ: คำที่ให้เติมอยู่ในประโยค / เรียงคำ: 3–8 คำ', () => {
    for (const item of items7.filter((entry) => entry.exercise === 'fill')) {
      expect(splitBlank(item.target, item.blank).found, item.id).toBe(true)
    }
    for (const item of items7.filter((entry) => entry.exercise === 'order')) {
      const count = item.target.split(/\s+/).length
      expect(count, item.id).toBeGreaterThanOrEqual(3)
      expect(count, item.id).toBeLessThanOrEqual(8)
    }
  })

  it('บรรยายภาพ: มีคำสำคัญ และประโยคตัวอย่างทุกแบบผ่านเกณฑ์ตรวจของตัวเอง', () => {
    for (const item of items7.filter((entry) => entry.exercise === 'describe')) {
      expect(item.requiredWords?.length, item.id).toBeGreaterThanOrEqual(1)
      for (const model of modelsOf(item)) {
        const check = checkFreeWriting(model, { requiredWords: item.requiredWords, models: modelsOf(item), requireAll: true })
        expect(check.passed, `${item.id}: ${model}`).toBe(true)
      }
    }
  })

  it('เรื่องสั้น: 3–4 ภาพ (ภาพของตัวเองทุกภาพ) + เรื่องตัวอย่างผ่านเกณฑ์ตรวจของตัวเอง', () => {
    for (const item of items7.filter((entry) => entry.exercise === 'story')) {
      expect(item.lines.length, item.id).toBeGreaterThanOrEqual(3)
      expect(item.lines.length, item.id).toBeLessThanOrEqual(4)
      item.lines.forEach((line, index) => {
        expect(line.image, item.id).toBe(`/images/${item.id}-${index + 1}.webp`)
        expect(line.text && line.translationTh, item.id).toBeTruthy()
      })
      expect(item.target, item.id).toBe(item.lines.map((line) => line.text).join(' '))
      expect(item.minSentences, item.id).toBeLessThanOrEqual(item.lines.length)
      const check = checkFreeWriting(item.target, {
        requiredWords: item.requiredWords,
        models: item.lines.map((line) => line.text),
        minSentences: item.minSentences,
      })
      expect(check.passed, item.id).toBe(true)
      expect(check.keywords.found, item.id).toBe(item.requiredWords.length)
    }
  })
})

// ---------- คลังวลี + คำในตำรา vs ใช้จริง (ส่วนที่ 5, ขั้นที่ 10) ----------
describe('คลังวลี (phrases.json)', () => {
  const { situations, phrases, textbookVsReal } = phrasesData
  const situationIds = situations.map((situation) => situation.id)

  // ขั้นที่ 27: 11 สถานการณ์ตามส่วนที่ 5 รวม ~1,000 วลี แต่ละสถานการณ์แบ่งหมวดย่อย (หน้าเว็บแสดงทีละหมวด)
  it('11 สถานการณ์ขึ้นไป รวม ≥ 1,000 วลี / id ไม่ซ้ำ / ภาพ = /images/phrases-<id>.webp', () => {
    expect(situations.length).toBeGreaterThanOrEqual(11)
    expect(phrases.length).toBeGreaterThanOrEqual(1000)
    expect(new Set(situationIds).size).toBe(situationIds.length)
    for (const situation of situations) {
      expect(situation.name && situation.nameTh, situation.id).toBeTruthy()
      expect(situation.image).toBe(`/images/phrases-${situation.id}.webp`)
      expect(phrases.filter((phrase) => phrase.situation === situation.id).length, situation.id).toBeGreaterThanOrEqual(80)
    }
    const ids = phrases.map((phrase) => phrase.id)
    expect(new Set(ids).size).toBe(ids.length)
    // วลีเดียวกันห้ามซ้ำทั้งคลัง (เสียง/การ์ดซ้ำ)
    const texts = phrases.map((phrase) => normalize(phrase.text))
    expect(new Set(texts).size).toBe(texts.length)
  })

  it('ทุกสถานการณ์มีหมวดย่อย ≥ 5 หมวด หมวดละ ≥ 6 วลี / ทุกวลีอยู่ในหมวดของสถานการณ์ตัวเอง', () => {
    for (const situation of situations) {
      expect(situation.groups.length, situation.id).toBeGreaterThanOrEqual(5)
      const groupIds = situation.groups.map((group) => group.id)
      expect(new Set(groupIds).size, situation.id).toBe(groupIds.length)
      for (const group of situation.groups) {
        expect(group.name && group.nameTh, `${situation.id}/${group.id}`).toBeTruthy()
        const count = phrases.filter((phrase) => phrase.situation === situation.id && phrase.group === group.id).length
        expect(count, `${situation.id}/${group.id}`).toBeGreaterThanOrEqual(6)
      }
    }
    for (const phrase of phrases) {
      const situation = situations.find((entry) => entry.id === phrase.situation)
      expect(situation.groups.map((group) => group.id), phrase.id).toContain(phrase.group)
    }
  })

  it.each(phrases.map((phrase) => [phrase.id, phrase]))('%s มีข้อมูลครบ + ตัวอย่าง 2 ประโยคที่มีวลีนั้น', (_id, phrase) => {
    expect(situationIds).toContain(phrase.situation)
    expect(phrase.text && phrase.meaningTh && phrase.readingTh).toBeTruthy()
    expect(REGISTERS).toContain(phrase.register)
    expect(FREQUENCIES).toContain(phrase.frequency)
    expect(phrase.examples).toHaveLength(2)
    // ตัวอย่างต้องใช้วลีนั้นจริง (ไม่สนตัวพิมพ์/เครื่องหมาย)
    for (const example of phrase.examples) {
      expect(example.translationTh, example.text).toBeTruthy()
      expect(normalize(example.text), example.text).toContain(normalize(phrase.text))
    }
    if (phrase.thaiMistake) {
      expect(phrase.thaiMistake.wrong && phrase.thaiMistake.right && phrase.thaiMistake.noteTh).toBeTruthy()
      expect(normalize(phrase.thaiMistake.right)).not.toBe(normalize(phrase.thaiMistake.wrong))
    }
  })

  it('คู่ที่ผูกบทสนทนา Stage 5: ชี้บรรทัดจริง, แบบพูดจริงแบบแรก = บรรทัดนั้น, บรรทัดละไม่เกิน 1 คู่', () => {
    const lines = new Map()
    for (const lesson of lessonsData.lessons.filter((entry) => entry.stageId === 5 && entry.type === 'dialogue'))
      for (const item of lesson.items) lines.set(item.id, { lessonId: lesson.id, target: item.target })
    const linked = textbookVsReal.filter((pair) => pair.itemId)
    expect(linked.length).toBeGreaterThanOrEqual(75)
    expect(new Set(linked.map((pair) => pair.itemId)).size).toBe(linked.length)
    for (const pair of linked) {
      const line = lines.get(pair.itemId)
      expect(line, pair.id).toBeTruthy()
      expect(pair.lessonId, pair.id).toBe(line.lessonId)
      expect(pair.real[0].text, pair.id).toBe(line.target)
    }
  })

  it('คำในตำรา vs ใช้จริง ≥ 100 คู่: แบบพูดจริง 1–3 แบบต่างจากแบบในตำรา + เหตุผลภาษาไทย', () => {
    expect(textbookVsReal.length).toBeGreaterThanOrEqual(100)
    expect(new Set(textbookVsReal.map((pair) => pair.id)).size).toBe(textbookVsReal.length)
    for (const pair of textbookVsReal) {
      expect(situationIds, pair.id).toContain(pair.situation)
      expect(pair.textbook && pair.meaningTh && pair.noteTh, pair.id).toBeTruthy()
      expect(pair.real.length, pair.id).toBeGreaterThanOrEqual(1)
      for (const real of pair.real) {
        expect(REGISTERS, pair.id).toContain(real.register)
        expect(normalize(real.text), pair.id).not.toBe(normalize(pair.textbook))
      }
    }
  })

  it('ทุกสถานการณ์มีคู่ในตำรา vs ใช้จริงอย่างน้อย 2 คู่ (เกมของสถานการณ์นั้น)', () => {
    for (const id of situationIds) {
      expect(textbookVsReal.filter((pair) => pair.situation === id).length, id).toBeGreaterThanOrEqual(2)
    }
  })
})

// ---------- บทสนทนาสุ่ม (ส่วนที่ 6, ขั้นที่ 11) ----------
describe('บทสนทนาสุ่ม (scenarios.json)', () => {
  const { scenarios } = scenariosData

  it('≥ 30 สถานการณ์ (ขั้นที่ 28-2) ครบตามสเปก id ไม่ซ้ำ / ภาพ = /images/talk-<id>.webp / ทุกสถานที่มี ≥ 3 บท', () => {
    const ids = scenarios.map((scenario) => scenario.id)
    expect(ids.length).toBeGreaterThanOrEqual(30)
    // สเปกส่วนที่ 6: ร้านกาแฟ ร้านสะดวกซื้อ เรียกรถ เจอเพื่อนเก่า สัมภาษณ์งาน เช็คอินโรงแรม ร้านอาหาร ถามทาง เพื่อนร่วมงาน นัดเพื่อน
    expect(ids).toEqual(
      expect.arrayContaining(['cafe', 'store', 'taxi', 'old-friend', 'job-interview', 'hotel', 'restaurant', 'directions', 'coworker', 'making-plans']),
    )
    for (const place of worldData.cityMap) {
      expect(scenarios.filter((scenario) => scenario.placeId === place.placeId).length, place.placeId).toBeGreaterThanOrEqual(3)
    }
    expect(new Set(ids).size).toBe(ids.length)
    for (const scenario of scenarios) expect(scenario.image).toBe(`/images/talk-${scenario.id}.webp`)
  })

  it.each(scenarios.map((scenario) => [scenario.id, scenario]))(
    '%s: ≥ 6 turns, บทอีกฝ่าย ≥ 3 แบบ (+ไทย), ตัวเลือกของเรา 2–3 แบบ, ช่องที่ใช้มีค่าครบ',
    (_id, scenario) => {
      expect(scenario.name && scenario.nameTh && scenario.goalTh && scenario.partner?.nameTh).toBeTruthy()
      expect(scenario.turns.length).toBeGreaterThanOrEqual(6)
      const turnIds = scenario.turns.map((turn) => turn.id)
      expect(new Set(turnIds).size).toBe(turnIds.length)
      const slotNames = Object.keys(scenario.slots ?? {})
      for (const [name, values] of Object.entries(scenario.slots ?? {})) {
        expect(values.length, name).toBeGreaterThanOrEqual(2)
        for (const value of values) expect(value.en && value.th, name).toBeTruthy()
      }
      // twist (ขั้นที่ 12): สถานการณ์ละ ≥ 2 แบบ มีชื่อไทย — บรรทัดของ twist ตรวจแบบเดียวกับบทหลัก
      expect(scenario.twists?.length ?? 0).toBeGreaterThanOrEqual(2)
      for (const twist of scenario.twists ?? []) expect(twist.id && twist.titleTh && twist.afterTurn, twist.id).toBeTruthy()
      const usedSlots = []
      for (const turn of [...scenario.turns, ...(scenario.twists ?? []).flatMap((twist) => twist.turns)]) {
        if (turn.speaker === 'npc') {
          expect(turn.variants.length, turn.id).toBeGreaterThanOrEqual(3)
          for (const variant of turn.variants) {
            expect(variant.text && variant.th, turn.id).toBeTruthy()
            // ช่องในคำแปลไทยต้องตรงกับในภาษาอังกฤษ
            expect(slotsIn(variant.th).sort(), turn.id).toEqual(slotsIn(variant.text).sort())
            usedSlots.push(...slotsIn(variant.text))
          }
        } else {
          expect(turn.speaker, turn.id).toBe('user')
          expect(turn.hintTh, turn.id).toBeTruthy()
          expect(turn.userOptions.length, turn.id).toBeGreaterThanOrEqual(2)
          expect(turn.userOptions.length, turn.id).toBeLessThanOrEqual(3)
          for (const option of turn.userOptions) {
            expect(REGISTERS, turn.id).toContain(option.register)
            usedSlots.push(...slotsIn(option.text))
          }
          usedSlots.push(...slotsIn(turn.hintTh), ...(turn.requiredWords ?? []).flatMap(slotsIn))
        }
      }
      expect([...new Set(usedSlots)].filter((name) => !slotNames.includes(name))).toEqual([])
    },
  )
})

// ---------- คำรวมทั้งเว็บ (ขั้นที่ 28-2) ----------
describe('คำรวมทั้งเว็บ ≈ B1', () => {
  it('Stage 1–7 ≥ 2,700 คำ + โหมดเมือง (วลี/คู่ในตำรา/บทสนทนาสุ่ม/NPC) → รวม ≥ 3,000 คำ', () => {
    const { stages, city, total } = totalVocabulary({
      lessons,
      phrases: phrasesData,
      scenarioTexts: scenariosData.scenarios.flatMap((scenario) => expandScenarioTexts(scenario)),
      npcs: worldData.npcs,
    })
    expect(stages).toBeGreaterThanOrEqual(2700)
    expect(city).toBeGreaterThan(0)
    expect(total).toBeGreaterThanOrEqual(3000)
  })
})

// ---------- แผนที่เมือง (ส่วนที่ 7, ขั้นที่ 14) ----------
describe('แผนที่เมือง (world.json)', () => {
  const { cityMap } = worldData

  it('7 สถานที่ตามสเปก: บ้านเปิดตั้งแต่แรก ที่เหลือผ่าน Stage 1–6 ตามลำดับ', () => {
    expect(cityMap.map((place) => place.placeId)).toEqual(['home', 'store', 'cafe', 'park', 'restaurant', 'office', 'airport'])
    expect(cityMap.map((place) => place.unlockAfterStage)).toEqual([null, 1, 2, 3, 4, 5, 6])
    for (const place of cityMap) {
      expect(place.name && place.nameTh && place.description && place.descriptionTh, place.placeId).toBeTruthy()
      expect(place.image).toBe(`/images/place-${place.placeId}.webp`)
    }
  })

  it('วลีของสถานที่มีอยู่ในคลังวลี / บทสนทนาสุ่มชี้ไปสถานที่ที่มีจริง', () => {
    const situationIds = phrasesData.situations.map((situation) => situation.id)
    const placeIds = cityMap.map((place) => place.placeId)
    for (const place of cityMap) {
      expect(place.phraseGroups.length, place.placeId).toBeGreaterThanOrEqual(1)
      for (const id of place.phraseGroups) expect(situationIds, place.placeId).toContain(id)
    }
    for (const scenario of scenariosData.scenarios) expect(placeIds, scenario.id).toContain(scenario.placeId)
  })
})

// ---------- NPC + ความสนิท (ขั้นที่ 15) ----------
describe('NPC (world.json npcs)', () => {
  const { npcs, cityMap } = worldData
  const placeIds = cityMap.map((place) => place.placeId)

  it('NPC 4–6 ตัว id ไม่ซ้ำ ประจำสถานที่ที่มีจริง สถานที่ละไม่เกิน 1 คน', () => {
    expect(npcs.length).toBeGreaterThanOrEqual(4)
    // ขั้นที่ 28-1: เพิ่ม NPC ร้านอาหาร (Oliver) + ออฟฟิศ (Nina) → สถานที่ละ 1 คนครบ 7 ที่
    expect(npcs.length).toBeLessThanOrEqual(7)
    expect(new Set(npcs.map((npc) => npc.id)).size).toBe(npcs.length)
    expect(new Set(npcs.map((npc) => npc.placeId)).size).toBe(npcs.length)
    for (const npc of npcs) expect(placeIds, npc.id).toContain(npc.placeId)
  })

  it.each(npcs.map((npc) => [npc.id, npc]))('%s ข้อมูลครบ + บทคุยครบทุกระดับความสนิท', (_id, npc) => {
    for (const field of ['name', 'nameTh', 'role', 'roleTh', 'personality', 'personalityTh', 'speakingStyle']) {
      expect(npc[field], field).toBeTruthy()
    }
    expect(['normal', 'slow']).toContain(npc.speechRate)
    expect(npc.image).toBe(`/images/npc-${npc.id}.webp`)
    expect(npc.welcomeBack.text).toMatch(/long time no see/i)
    expect(npc.welcomeBack.translationTh).toBeTruthy()
    expect(npc.levels).toHaveLength(FRIENDSHIP_THRESHOLDS.length)
    for (const level of npc.levels) {
      for (const line of [level.npc, level.reply]) {
        expect(line.text && line.translationTh, JSON.stringify(line)).toBeTruthy()
        expect(hasThaiLetters(line.text), line.text).toBe(false)
      }
    }
  })

  it('บทสนทนาสุ่มที่มี NPC ชี้ NPC ที่มีจริงและอยู่สถานที่เดียวกัน / บทกับคนแปลกหน้า (ไม่มี npcId) มีชื่ออีกฝ่าย', () => {
    for (const scenario of scenariosData.scenarios) {
      if (!scenario.npcId) {
        expect(scenario.partner?.name && scenario.partner?.nameTh, scenario.id).toBeTruthy()
        continue
      }
      const npc = npcs.find((entry) => entry.id === scenario.npcId)
      expect(npc, scenario.id).toBeTruthy()
      expect(npc.placeId, scenario.id).toBe(scenario.placeId)
    }
  })

  it('บทที่ปลดล็อกตามความสนิท (ขั้นที่ 28): minFriendship 1–3 ต้องมี NPC / NPC ทุกคนมีเรื่องลึกขึ้นอย่างน้อย 1 บท', () => {
    const gated = scenariosData.scenarios.filter((scenario) => scenario.minFriendship)
    for (const scenario of gated) {
      expect(scenario.npcId, scenario.id).toBeTruthy()
      expect([1, 2, 3], scenario.id).toContain(scenario.minFriendship)
    }
    for (const npc of npcs) expect(gated.some((scenario) => scenario.npcId === npc.id), npc.id).toBe(true)
  })
})

// ---------- โหมดฝึกเสียง (ส่วนที่ 10.1) ----------
describe('โหมดฝึกเสียง (soundPractice)', () => {
  it('มีเสียงหลัก th, r/l, v/w (+ อื่น ๆ) id ไม่ซ้ำ', () => {
    const ids = soundPractice.map((set) => set.id)
    expect(ids).toEqual(expect.arrayContaining(['th', 'r-l', 'v-w']))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(soundPractice.map((set) => [set.id, set]))('%s มีคำแนะนำภาษาไทย + คู่คำจริง ≥ 5 คู่', (_id, set) => {
    for (const field of ['title', 'titleTh', 'summary', 'summaryTh', 'tipTh', 'mistakeTh']) expect(set[field], field).toBeTruthy()
    expect(set.pairs.length).toBeGreaterThanOrEqual(5)
    for (const pair of set.pairs) {
      expect(pair.a && pair.b && pair.aTh && pair.bTh, `${pair.a}/${pair.b}`).toBeTruthy()
      expect(pair.a).not.toBe(pair.b)
    }
  })
})

describe('ภาพถ่ายประกอบ', () => {
  // บทสนทนา/คำคล้องจองใช้ภาพเดียวกันทั้งบท → นับภาพละครั้ง / เรื่องสั้น Stage 7 มีภาพของแต่ละบรรทัดด้วย
  const imagePaths = [
    ...new Set([
      ...stages.map((stage) => stage.image),
      ...allItems.map(({ item }) => item.image),
      ...allItems.flatMap(({ item }) => (item.lines ?? []).map((line) => line.image)),
      ...phrasesData.situations.map((situation) => situation.image),
      ...scenariosData.scenarios.map((scenario) => scenario.image),
      ...worldData.cityMap.map((place) => place.image),
      ...worldData.npcs.map((npc) => npc.image),
    ]),
  ]
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
