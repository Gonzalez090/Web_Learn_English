// =========================================================
// รวมข้อมูลเนื้อหาทั้งหมดจาก src/data/*.json ไว้ที่เดียว
// (โครงสร้างข้อมูลตามส่วนที่ 12 ของสเปก แต่แยกไฟล์ตามหมวด จะได้แก้ง่าย)
//   lessons.json   → stages + บทเรียน — แบ่งก้อนโดย plugin ใน vite.config.js (ดู lessonChunks.js):
//                    สารบัญ (lessonList: บทแบบย่อ ไม่มี items) อยู่ในไฟล์หลัก
//                    เนื้อหาเต็มราย Stage โหลดเมื่อต้องใช้ → loadStageLessons() / hooks/useLessons.js
//   phrases.json   → สถานการณ์ + textbookVsReal (ขั้นที่ 10) — แบ่งก้อนรายสถานการณ์ (ดู phraseChunks.js):
//                    วลีเต็มโหลดเมื่อเปิดหน้าสถานการณ์ → loadSituationPhrases() / hooks/usePhrases.js (ขั้นที่ 27)
//   scenarios.json → บทสนทนาสุ่ม (ขั้นที่ 11–12) — แบ่งก้อนรายสถานการณ์ (ดู scenarioChunks.js, ขั้นที่ 28-1):
//                    สารบัญ scenarioList อยู่ในไฟล์หลัก / บทพูดเต็มโหลดเมื่อเปิดเล่น → loadScenario() / hooks/useScenarios.js
//   world.json     → cityMap, npcs                    (ขั้นที่ 14–15)
//   game.json      → dailyMissionPool, miniGames, milestones, speakingCheck (ภาพ/คำถาม/วลีของ Speaking Check), soundPractice
//   imageCredits.json → นำเข้าตรงในหน้าเครดิต (โหลดเฉพาะตอนเปิดหน้านั้น)
// =========================================================
import { stages as stageData, lessonList as lessonListData, stageLoaders } from 'virtual:lessons'
import { situations as situationData, textbookVsReal as textbookPairs, situationLoaders } from 'virtual:phrases'
import { scenarioList as scenarioListData, scenarioLoaders } from 'virtual:scenarios'
import { loadOnce } from '../utils/contentLoad'
import worldData from './world.json'
import gameData from './game.json'

export const stages = stageData
// บทเรียนทุกบทแบบย่อ { id, stageId, category, type, title, titleTh, itemCount, image } — ⚠️ ไม่มี items
export const lessonList = lessonListData
// คลังวลี: สถานการณ์แบบย่อ { id, name, nameTh, image, groups[], phraseCount } — ⚠️ วลีเต็มโหลดแยก (loadSituationPhrases)
export const phraseSituations = situationData
export const textbookVsReal = textbookPairs
// บทสนทนาสุ่มแบบย่อ { id, name, nameTh, goalTh, image, level, placeId, npcId, speedOrder?, minFriendship?, turnCount }
//   — ⚠️ ไม่มี turns/twists/slots (โหลดแยก: loadScenario / hooks/useScenarios.js) (ขั้นที่ 28-1)
export const scenarioList = scenarioListData
export const { cityMap, npcs } = worldData
export const { dailyMissionPool, miniGames, milestones, speakingCheck, soundPractice } = gameData

// ---------- ฟังก์ชันค้นหาที่ใช้บ่อย ----------

// หา Stage จาก id (รับได้ทั้งตัวเลขและข้อความจาก URL)
export const getStage = (stageId) => stages.find((stage) => stage.id === Number(stageId))

// บทเรียนแบบย่อทั้งหมดของ Stage หนึ่ง
export const getLessonsByStage = (stageId) => lessonList.filter((lesson) => lesson.stageId === Number(stageId))

// บทเรียนแบบย่อจาก id (ไม่มี → null)
export const getLessonMeta = (lessonId) => lessonList.find((lesson) => lesson.id === lessonId) ?? null

// NPC จาก id / NPC ประจำสถานที่ (ขั้นที่ 15) — ไม่มี → null
export const getNpc = (npcId) => npcs.find((npc) => npc.id === npcId) ?? null
export const npcOfPlace = (placeId) => npcs.find((npc) => npc.placeId === placeId) ?? null

// บทสนทนาสุ่มแบบย่อจาก id (ไม่มี → null)
export const getScenarioMeta = (scenarioId) => scenarioList.find((scenario) => scenario.id === scenarioId) ?? null

// หามินิเกมจาก id
export const getMiniGame = (gameId) => miniGames.find((game) => game.id === gameId)

// คลังวลี: สถานการณ์จาก id / คู่ "คำในตำรา vs ใช้จริง" ของสถานการณ์นั้น
export const getPhraseSituation = (situationId) => phraseSituations.find((situation) => situation.id === situationId)
export const textbookPairsOf = (situationId) => textbookVsReal.filter((pair) => pair.situation === situationId)

// ---------- โหลดเนื้อหาเต็ม (มี items) ----------
// คืน promise ตัวเดิมทุกครั้งที่ขอซ้ำ (React use() ต้องการแบบนี้) — โหลดไม่สำเร็จ (เช่น เน็ตหลุด) จำไว้จน ErrorBoundary
// แสดงข้อความ แล้วจึงลืมให้ลองใหม่ได้ (utils/contentLoad.js — ลบทันทีจะวนโหลดไม่จบ)

// ไฟล์เนื้อหา 1 ไฟล์ (ไม่มีไฟล์นี้ → ค่า empty)
const loadModule = (loader, empty) => (loader ? loader().then((module) => module.default) : Promise.resolve(empty))

const stageCache = new Map()

// บทเรียนเต็มของ Stage หนึ่ง (Stage ที่ยังไม่มีบท → [])
export function loadStageLessons(stageId) {
  const id = Number(stageId)
  return loadOnce(stageCache, id, () => loadModule(stageLoaders[id], []))
}

const groupCache = new Map()

// บทเรียนเต็มของหลาย Stage รวมกัน (ลำดับตาม Stage)
export function loadLessonsOfStages(stageIds) {
  const ids = [...new Set(stageIds.map(Number))].sort((a, b) => a - b)
  return loadOnce(groupCache, ids.join(','), () => Promise.all(ids.map(loadStageLessons)).then((lists) => lists.flat()))
}

const situationCache = new Map()

// วลีเต็มของสถานการณ์หนึ่ง (ไม่มีสถานการณ์นี้ → [])
export function loadSituationPhrases(situationId) {
  return loadOnce(situationCache, situationId, () => loadModule(situationLoaders[situationId], []))
}

const scenarioCache = new Map()

// บทสนทนาสุ่มฉบับเต็มหนึ่งสถานการณ์ (ไม่มี id นี้ → null)
export function loadScenario(scenarioId) {
  return loadOnce(scenarioCache, scenarioId, () => loadModule(scenarioLoaders[scenarioId], null))
}

const scenarioGroupCache = new Map()

// หลายสถานการณ์รวมกัน (ลำดับตาม ids ที่ไม่ซ้ำ, ตัด id ที่ไม่มีออก) — key เดียวกันได้ promise ตัวเดิม
export function loadScenarios(scenarioIds) {
  const ids = [...new Set(scenarioIds)].filter((id) => scenarioLoaders[id]).sort()
  return loadOnce(scenarioGroupCache, ids.join(','), () =>
    Promise.all(ids.map(loadScenario)).then((list) => list.filter(Boolean)),
  )
}

// ทุกบท (ใช้ในหน้า /dev)
export const loadAllLessons = () => loadLessonsOfStages(stages.map((stage) => stage.id))
