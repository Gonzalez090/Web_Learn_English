// =========================================================
// missions.js — ภารกิจรายวัน (ส่วนที่ 8.3)
// - ทุกวันสุ่ม 3 ภารกิจจาก game.json → dailyMissionPool (สุ่มจากวันที่ → วันเดียวกันได้ชุดเดิม) ไม่ซ้ำชนิดกันในวันเดียว
// - สุ่มเฉพาะภารกิจที่ทำได้จากสิ่งที่เรียนแล้ว (missionPath ≠ null) เช่น ยังไม่เคยเรียนบทเขียน → ไม่มีภารกิจเขียน
//   เรียนครบทุกบทแล้ว → ไม่มีภารกิจ "เรียนจบ N บท" (ไม่มีบทใหม่) เหลือการใช้จริง/ฝึกซ้ำ
// - แตะภารกิจ → ไปหน้าที่ทำภารกิจนั้นได้ (missionPath)
// - เว็บแจ้ง "เหตุการณ์" (เช่น พูดผ่าน 1 ครั้ง) → ภารกิจชนิดนั้นคืบหน้า → ครบเป้า = สำเร็จ ได้ XP รางวัล
// (ฟังก์ชันล้วน → ทดสอบได้ — ctx สร้างจาก utils/missionContext.js)
// =========================================================
import { TALK_FROM_STAGE } from './dailyPlan'
import { isScenarioLocked } from './friendship'
import { LESSON_GAMES, playableLessons } from './gamePool'
import { LESSON_FLOWS } from './lessonSteps'
import { isPlaceUnlocked } from './places'
import { nextLesson } from './progress'
import { createRandom, hashString, shuffle } from './random'

// ฝึกเสียงแสดงคำเป็นตัวอักษร → เริ่มเมื่อเรียนบท Stage 4 แล้ว (Stage 1–3 ไม่แสดงตัวอักษร)
export const SOUND_FROM_STAGE = 4

export const MISSIONS_PER_DAY = 3

// ชนิดบทที่ทำให้ภารกิจคืบหน้า
const LESSON_TYPES = Object.keys(LESSON_FLOWS).filter((type) => type !== 'talk')
const typesReviewedBy = (...kinds) =>
  LESSON_TYPES.filter((type) => LESSON_FLOWS[type].review.some((kind) => kinds.includes(kind)))
const LISTEN_TYPES = LESSON_TYPES.filter((type) => !['sightWords', 'writing'].includes(type))
const SPEAK_TYPES = typesReviewedBy('speak', 'read')
// นับเป็นนาที → บทที่พูดเป็นประโยค (คำเดี่ยวสั้นเกินไป พูดครบนาทียาก)
const SENTENCE_TYPES = ['sentence', 'context', 'dialogue', 'story', 'rhyme', 'reading']
const WRITE_TYPES = ['writing']

// ---------- ทำภารกิจได้ที่ไหน ----------

const lessonPath = (lesson) => (lesson ? `/lesson/${lesson.id}` : null)

const nextOf = (ctx) => nextLesson(ctx.lessonList, ctx.unlockedStages, ctx.lessonProgress)

// บทที่เรียนจบแล้ว (ของชนิดที่ระบุ)
const learnedLessons = (ctx, types = LESSON_TYPES) =>
  ctx.lessonList.filter((lesson) => types.includes(lesson.type) && ctx.lessonProgress[lesson.id]?.completed)

// บทต่อไป — ถ้าเป็นชนิดที่ใช้ได้
function nextPath(ctx, types = LESSON_TYPES) {
  const lesson = nextOf(ctx)
  return lesson && types.includes(lesson.type) ? lessonPath(lesson) : null
}

// บทที่เรียนแล้วให้เรียนซ้ำ: Stage สูงสุดก่อน แล้วบทที่ไม่ได้เล่นนานที่สุด
function replayPath(ctx, types) {
  const playedAt = (lesson) => ctx.lessonProgress[lesson.id].lastPlayedAt ?? ''
  const [lesson] = learnedLessons(ctx, types).sort(
    (a, b) => b.stageId - a.stageId || playedAt(a).localeCompare(playedAt(b)),
  )
  return lessonPath(lesson)
}

// บทสนทนาสุ่มที่เล่นได้ (พูดเป็นประโยคได้แล้ว + สถานที่เปิด + ไม่ล็อกตามความสนิท)
function openScenarios(ctx) {
  if (!ctx.unlockedStages.includes(TALK_FROM_STAGE)) return []
  return ctx.scenarioList.filter((scenario) => {
    const place = ctx.cityMap.find((entry) => entry.placeId === scenario.placeId)
    return Boolean(place && isPlaceUnlocked(place, ctx.unlockedStages)) && !isScenarioLocked(scenario, ctx.npcFriendship)
  })
}

const talkPath = (ctx) => (openScenarios(ctx).length > 0 ? '/talk' : null)

// ฝึกพูด: ต้องเคยเรียนบทที่พูดแล้ว → บทต่อไป / บทสนทนาสุ่ม / เรียนซ้ำ
function speakingPath(ctx, types) {
  if (learnedLessons(ctx, types).length === 0) return null
  return nextPath(ctx, types) ?? talkPath(ctx) ?? replayPath(ctx, types)
}

// หน้ามินิเกม: มีเกมที่ใช้บทที่เรียนแล้วอย่างน้อย 1 เกม
function gamesPath(ctx) {
  const ready = Object.keys(LESSON_GAMES).some(
    (gameId) => playableLessons(gameId, ctx.lessonList, ctx.lessonProgress).length > 0,
  )
  return ready ? '/games' : null
}

// เหตุการณ์ของภารกิจ → หน้าที่ทำได้ (null = ยังไม่เปิด / ยังไม่ได้เรียน)
const EVENT_PATH = {
  // ทำได้ตั้งแต่บทแรก
  listen: (ctx) => nextPath(ctx, LISTEN_TYPES) ?? replayPath(ctx, LISTEN_TYPES),
  lessonComplete: (ctx) => nextPath(ctx) ?? replayPath(ctx),
  xp: (ctx) => nextPath(ctx) ?? talkPath(ctx) ?? replayPath(ctx),
  // ต้องเคยเรียนบทที่ใช้ทักษะนั้นแล้วอย่างน้อย 1 บท
  perfectLesson: (ctx) => (learnedLessons(ctx).length > 0 ? (nextPath(ctx) ?? replayPath(ctx)) : null),
  speakPass: (ctx) => speakingPath(ctx, SPEAK_TYPES),
  speakingMinutes: (ctx) => speakingPath(ctx, SENTENCE_TYPES),
  writePass: (ctx) => {
    if (learnedLessons(ctx, WRITE_TYPES).length === 0) return null
    return nextPath(ctx, WRITE_TYPES) ?? replayPath(ctx, WRITE_TYPES)
  },
  gamePlay: gamesPath,
  gameCorrect: gamesPath,
  sound: (ctx) => (learnedLessons(ctx).some((lesson) => lesson.stageId >= SOUND_FROM_STAGE) ? '/sounds' : null),
  // ทบทวนที่ทำแล้ว + ที่ยังค้าง ต้องพอถึงเป้า
  review: (ctx, mission, progress) =>
    ctx.reviewDue > 0 && progress + ctx.reviewDue >= mission.target ? '/review' : null,
  // ภาษาในเมืองเป็นประโยคเต็ม → Stage 5 เปิดแล้ว
  phrase: (ctx) => (ctx.unlockedStages.includes(TALK_FROM_STAGE) ? '/phrases' : null),
  conversation: talkPath,
  npcTalk: (ctx) => {
    const scenario = openScenarios(ctx).find((entry) => entry.npcId)
    return scenario ? `/place/${scenario.placeId}` : null
  },
}

// เหตุการณ์ที่ภารกิจใช้ได้
export const MISSION_EVENTS = Object.keys(EVENT_PATH)

/**
 * หน้าที่ทำภารกิจนี้ได้
 * @param ctx      { lessonList, scenarioList, cityMap, unlockedStages, lessonProgress, npcFriendship, reviewDue }
 * @param progress ความคืบหน้าวันนี้ของภารกิจ
 * @returns path หรือ null ถ้ายังทำไม่ได้
 */
export const missionPath = (mission, ctx, progress = 0) => EVENT_PATH[mission.event]?.(ctx, mission, progress) ?? null

// ควรสุ่มภารกิจนี้ให้ไหม: ทำได้แล้ว + ไม่ใช่ "เรียนจบ N บท" ตอนที่ไม่มีบทใหม่ให้เรียน
const isSuitable = (mission, ctx) =>
  missionPath(mission, ctx) !== null && (mission.event !== 'lessonComplete' || nextOf(ctx) !== null)

// ---------- ภารกิจของวัน ----------

// เลือกภารกิจของวันนั้น (ผลเดิมทุกครั้งสำหรับวันเดียวกัน + ความคืบหน้าเดียวกัน)
//   exclude = ชนิดเหตุการณ์ที่มีอยู่แล้ววันนี้
export function pickDailyMissions(pool, today, ctx, { count = MISSIONS_PER_DAY, exclude = [] } = {}) {
  const random = createRandom(hashString(today))
  const picked = []
  const usedEvents = new Set(exclude)
  for (const mission of shuffle(pool, random)) {
    if (picked.length === count) break
    if (usedEvents.has(mission.event) || !isSuitable(mission, ctx)) continue
    picked.push(mission)
    usedEvents.add(mission.event)
  }
  return picked
}

const newEntry = (mission) => ({ id: mission.id, progress: 0, done: false })

// ถ้ายังไม่มีภารกิจของวันนี้ → สร้างใหม่ (คืน object เดิมถ้าเป็นของวันนี้อยู่แล้ว)
export function ensureDailyMissions(daily, pool, today, ctx) {
  if (daily?.date === today && daily.missions?.length) return daily
  return { date: today, missions: pickDailyMissions(pool, today, ctx).map(newEntry) }
}

/**
 * เปิดหน้าแรก → ภารกิจของวันนี้ โดยเปลี่ยนข้อที่ยังไม่สำเร็จและทำไม่ได้ (ยังไม่เปิด / ไม่เหลือให้ทบทวนพอ) เป็นข้อที่ทำได้
 * ข้อที่สำเร็จแล้วคงไว้ / ไม่มีอะไรต้องเปลี่ยน → คืน object เดิม
 */
export function refreshMissions(daily, pool, today, ctx) {
  const current = ensureDailyMissions(daily, pool, today, ctx)
  const missionOf = (entry) => pool.find((mission) => mission.id === entry.id)
  const keep = current.missions.filter((entry) => {
    const mission = missionOf(entry)
    return mission && (entry.done || missionPath(mission, ctx, entry.progress) !== null)
  })
  const missing = Math.max(0, MISSIONS_PER_DAY - keep.length)
  const exclude = keep.map((entry) => missionOf(entry).event)
  const added = pickDailyMissions(pool, today, ctx, { count: missing, exclude })
  if (keep.length === current.missions.length && added.length === 0) return current
  return { ...current, missions: [...keep, ...added.map(newEntry)] }
}

/**
 * แจ้งเหตุการณ์ → อัปเดตความคืบหน้า
 * @returns { daily (object ใหม่ถ้ามีอะไรเปลี่ยน), completed: [ภารกิจที่เพิ่งสำเร็จ] }
 */
export function applyMissionEvent(daily, pool, event, amount = 1) {
  if (!daily?.missions || !(amount > 0)) return { daily, completed: [] }
  const completed = []
  let changed = false
  const missions = daily.missions.map((entry) => {
    const mission = pool.find((item) => item.id === entry.id)
    if (!mission || entry.done || mission.event !== event) return entry
    changed = true
    const progress = Math.min(mission.target, entry.progress + amount)
    const done = progress >= mission.target
    if (done) completed.push(mission)
    return { ...entry, progress, done }
  })
  return { daily: changed ? { ...daily, missions } : daily, completed }
}

// XP รางวัลรวมของภารกิจที่สำเร็จ
export const missionReward = (missions) => missions.reduce((sum, mission) => sum + (mission.xp ?? 0), 0)
