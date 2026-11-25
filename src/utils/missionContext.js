// =========================================================
// missionContext.js — ข้อมูลที่ใช้ตัดสินว่าภารกิจไหนทำได้แล้ว / ทำได้ที่ไหน (utils/missions.js)
//   ใช้ทั้งใน progressStore (สุ่มภารกิจ) และ MissionList (ลิงก์ของแต่ละข้อ)
// =========================================================
import { cityMap, lessonList, scenarioList } from '../data'

export const missionContext = ({ unlockedStages, lessonProgress, npcFriendship }, reviewDue = 0) => ({
  lessonList,
  scenarioList,
  cityMap,
  unlockedStages,
  lessonProgress,
  npcFriendship,
  reviewDue,
})
