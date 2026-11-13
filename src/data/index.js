// =========================================================
// รวมข้อมูลเนื้อหาทั้งหมดจาก src/data/*.json ไว้ที่เดียว
// (โครงสร้างข้อมูลตามส่วนที่ 12 ของสเปก แต่แยกไฟล์ตามหมวด จะได้แก้ง่าย)
//   lessons.json   → stages, lessons
//   phrases.json   → phrases, textbookVsReal          (ขั้นที่ 10)
//   scenarios.json → scenarios                        (ขั้นที่ 11–12)
//   world.json     → cityMap, npcs                    (ขั้นที่ 14–15)
//   game.json      → dailyMissionPool, miniGames, milestones, soundPractice
// =========================================================
import lessonsData from './lessons.json'
import phrasesData from './phrases.json'
import scenariosData from './scenarios.json'
import worldData from './world.json'
import gameData from './game.json'
import imageCreditsData from './imageCredits.json'

export const { stages, lessons } = lessonsData
// เครดิตภาพถ่าย { [id ภาพ]: { provider, sourceId, photographer, photographerUrl, pageUrl } }
export const imageCredits = imageCreditsData
export const { phrases, textbookVsReal } = phrasesData
export const { scenarios } = scenariosData
export const { cityMap, npcs } = worldData
export const { dailyMissionPool, miniGames, milestones, soundPractice } = gameData

// ---------- ฟังก์ชันค้นหาที่ใช้บ่อย ----------

// หา Stage จาก id (รับได้ทั้งตัวเลขและข้อความจาก URL)
export const getStage = (stageId) => stages.find((stage) => stage.id === Number(stageId))

// บทเรียนทั้งหมดของ Stage หนึ่ง
export const getLessonsByStage = (stageId) =>
  lessons.filter((lesson) => lesson.stageId === Number(stageId))

// หาบทเรียนจาก id
export const getLesson = (lessonId) => lessons.find((lesson) => lesson.id === lessonId)

// หามินิเกมจาก id
export const getMiniGame = (gameId) => miniGames.find((game) => game.id === gameId)
