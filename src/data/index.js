// =========================================================
// รวมข้อมูลเนื้อหาทั้งหมดจาก src/data/*.json ไว้ที่เดียว
// (โครงสร้างข้อมูลตามส่วนที่ 12 ของสเปก แต่แยกไฟล์ตามหมวด จะได้แก้ง่าย)
//   lessons.json   → stages + บทเรียน — แบ่งก้อนโดย plugin ใน vite.config.js (ดู lessonChunks.js):
//                    สารบัญ (lessonList: บทแบบย่อ ไม่มี items) อยู่ในไฟล์หลัก
//                    เนื้อหาเต็มราย Stage โหลดเมื่อต้องใช้ → loadStageLessons() / hooks/useLessons.js
//   phrases.json   → phrases, textbookVsReal          (ขั้นที่ 10)
//   scenarios.json → scenarios                        (ขั้นที่ 11–12)
//   world.json     → cityMap, npcs                    (ขั้นที่ 14–15)
//   game.json      → dailyMissionPool, miniGames, milestones, soundPractice
//   imageCredits.json → นำเข้าตรงในหน้าเครดิต (โหลดเฉพาะตอนเปิดหน้านั้น)
// =========================================================
import { stages as stageData, lessonList as lessonListData, stageLoaders } from 'virtual:lessons'
import phrasesData from './phrases.json'
import scenariosData from './scenarios.json'
import worldData from './world.json'
import gameData from './game.json'

export const stages = stageData
// บทเรียนทุกบทแบบย่อ { id, stageId, category, type, title, titleTh, itemCount, image } — ⚠️ ไม่มี items
export const lessonList = lessonListData
export const { phrases, textbookVsReal } = phrasesData
export const { scenarios } = scenariosData
export const { cityMap, npcs } = worldData
export const { dailyMissionPool, miniGames, milestones, soundPractice } = gameData

// ---------- ฟังก์ชันค้นหาที่ใช้บ่อย ----------

// หา Stage จาก id (รับได้ทั้งตัวเลขและข้อความจาก URL)
export const getStage = (stageId) => stages.find((stage) => stage.id === Number(stageId))

// บทเรียนแบบย่อทั้งหมดของ Stage หนึ่ง
export const getLessonsByStage = (stageId) => lessonList.filter((lesson) => lesson.stageId === Number(stageId))

// บทเรียนแบบย่อจาก id (ไม่มี → null)
export const getLessonMeta = (lessonId) => lessonList.find((lesson) => lesson.id === lessonId) ?? null

// หามินิเกมจาก id
export const getMiniGame = (gameId) => miniGames.find((game) => game.id === gameId)

// ---------- โหลดเนื้อหาเต็ม (มี items) ----------
// คืน promise ตัวเดิมทุกครั้งที่ขอซ้ำ (React use() ต้องการแบบนี้) — โหลดไม่สำเร็จ (เช่น เน็ตหลุด) ลบออกจากที่จำ ให้ลองใหม่ได้

const stageCache = new Map()

// บทเรียนเต็มของ Stage หนึ่ง (Stage ที่ยังไม่มีบท → [])
export function loadStageLessons(stageId) {
  const id = Number(stageId)
  if (!stageCache.has(id)) {
    const loader = stageLoaders[id]
    const promise = loader
      ? loader()
          .then((module) => module.default)
          .catch((error) => {
            stageCache.delete(id)
            throw error
          })
      : Promise.resolve([])
    stageCache.set(id, promise)
  }
  return stageCache.get(id)
}

const groupCache = new Map()

// บทเรียนเต็มของหลาย Stage รวมกัน (ลำดับตาม Stage)
export function loadLessonsOfStages(stageIds) {
  const ids = [...new Set(stageIds.map(Number))].sort((a, b) => a - b)
  const key = ids.join(',')
  if (!groupCache.has(key)) {
    const promise = Promise.all(ids.map(loadStageLessons))
      .then((lists) => lists.flat())
      .catch((error) => {
        groupCache.delete(key)
        throw error
      })
    groupCache.set(key, promise)
  }
  return groupCache.get(key)
}

// ทุกบท (ใช้ในหน้า /dev)
export const loadAllLessons = () => loadLessonsOfStages(stages.map((stage) => stage.id))
