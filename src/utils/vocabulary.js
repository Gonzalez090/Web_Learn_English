// =========================================================
// vocabulary.js — ตัวนับคำอัตโนมัติ (หลักการเรียนแบบเจ้าของภาษา + ตาราง "คำสะสม")
// - "คำ" = คำภาษาอังกฤษไม่ซ้ำ ที่ผู้เรียนได้ฟัง/พูดในบทเรียน (ตัวพิมพ์เล็ก, รูปย่อขยายเป็นรูปเต็ม, ตัดเครื่องหมาย)
// - ใช้ตรวจใน test: คำสะสมถึงเป้าแต่ละ Stage, ของใหม่ต่อบทไม่มากเกิน (i+1), คำเป้าหมายเจอซ้ำ 6+ ข้อความ
// =========================================================
import { normalizeWord } from './compareWords'

// ข้อความ → รายการคำ (ซ้ำได้)
export const wordsOf = (text) => String(text ?? '').split(/\s+/).flatMap(normalizeWord)

// ข้อความภาษาอังกฤษทั้งหมดของข้อหนึ่งที่ผู้เรียนได้ฟัง/พูด
export function itemTexts(item) {
  return [item.target ?? item.word, item.question, ...(item.parentese ?? [])].filter(Boolean)
}

// คำเป้าหมายของข้อ (คำ/คำคู่ที่สอน)
export const targetWords = (item) => wordsOf(item.target ?? item.word)

export const lessonTexts = (lesson) => lesson.items.flatMap(itemTexts)

export const lessonWords = (lesson) => new Set(lessonTexts(lesson).flatMap(wordsOf))

// เรียงบทตามลำดับการเรียน: Stage ก่อน แล้วตามลำดับในไฟล์
export const orderedLessons = (lessons) =>
  lessons
    .map((lesson, index) => ({ lesson, index }))
    .sort((a, b) => a.lesson.stageId - b.lesson.stageId || a.index - b.index)
    .map(({ lesson }) => lesson)

/**
 * คำสะสมเมื่อเรียนจบแต่ละ Stage
 * @returns { [stageId]: จำนวนคำไม่ซ้ำ ตั้งแต่ Stage 1 ถึง Stage นั้น }
 */
export function cumulativeVocabulary(lessons) {
  const seen = new Set()
  const result = {}
  for (const lesson of orderedLessons(lessons)) {
    for (const word of lessonWords(lesson)) seen.add(word)
    result[lesson.stageId] = seen.size
  }
  return result
}

/**
 * ของใหม่ในแต่ละบท (เทียบกับทุกบทก่อนหน้า)
 * @returns [{ lessonId, stageId, newWords: [], totalWords, ratio }]
 */
export function lessonNovelty(lessons) {
  const seen = new Set()
  return orderedLessons(lessons).map((lesson) => {
    const words = lessonWords(lesson)
    const newWords = [...words].filter((word) => !seen.has(word))
    for (const word of words) seen.add(word)
    return { lessonId: lesson.id, stageId: lesson.stageId, newWords, totalWords: words.size, ratio: newWords.length / words.size }
  })
}

/**
 * ไล่ฟังตามลำดับจริง (บท → ข้อ → ข้อความ) แล้วดูว่าแต่ละข้อความมีคำที่ "เพิ่งได้ยินครั้งแรก" กี่คำ
 * ใช้ตรวจหลัก i+1: ประโยคหนึ่งควรมีของใหม่แค่นิดเดียว ที่เหลือเป็นคำที่ได้ยินแล้ว
 * @returns [{ lessonId, stageId, text, tokens, newWords: [] }]
 */
export function firstHearings(lessons) {
  const heard = new Set()
  const result = []
  for (const lesson of orderedLessons(lessons)) {
    for (const item of lesson.items) {
      for (const text of itemTexts(item)) {
        const words = wordsOf(text)
        const newWords = [...new Set(words)].filter((word) => !heard.has(word))
        for (const word of words) heard.add(word)
        result.push({ lessonId: lesson.id, stageId: lesson.stageId, text, tokens: words.length, newWords })
      }
    }
  }
  return result
}

/**
 * สัดส่วน "คำที่ได้ยินครั้งแรก" ต่อคำทั้งหมดที่ได้ฟังในบท (ยิ่งต่ำ = ฟังเข้าใจง่าย)
 * @returns [{ lessonId, stageId, share }]
 */
export function lessonFirstHearingShare(lessons) {
  const byLesson = new Map()
  for (const entry of firstHearings(lessons)) {
    const current = byLesson.get(entry.lessonId) ?? { lessonId: entry.lessonId, stageId: entry.stageId, tokens: 0, fresh: 0 }
    current.tokens += entry.tokens
    current.fresh += entry.newWords.length
    byLesson.set(entry.lessonId, current)
  }
  return [...byLesson.values()].map(({ lessonId, stageId, tokens, fresh }) => ({
    lessonId,
    stageId,
    share: tokens ? fresh / tokens : 0,
  }))
}

/**
 * แต่ละคำอยู่ในข้อความต่างกันกี่ข้อความ (ข้อความซ้ำกันนับครั้งเดียว)
 * @returns Map<word, number>
 */
export function textCountByWord(lessons) {
  const texts = new Set(lessons.flatMap(lessonTexts).map((text) => text.trim()))
  const counts = new Map()
  for (const text of texts) {
    for (const word of new Set(wordsOf(text))) counts.set(word, (counts.get(word) ?? 0) + 1)
  }
  return counts
}
