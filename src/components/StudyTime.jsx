// =========================================================
// StudyTime — เวลาเรียนวันนี้ + คำแนะนำสั้น ๆ (ยังไม่เริ่ม / กำลังเรียน / วันนี้พอแล้ว / เยอะแล้ว พักก่อน)
// ใช้บนการ์ดแผนวันนี้ (หน้าแรก) และหน้าแผน — เป็น <span> วางในลิงก์/ย่อหน้าได้ ขนาดและสีตามที่วาง
// props: planDone = ทำแผนวันนี้ครบทุกขั้นแล้ว
// =========================================================
import { useTranslation } from 'react-i18next'
import { useProgressStore } from '../store/progressStore'
import { useSettingsStore } from '../store/settingsStore'
import { todayKey } from '../utils/date'
import { recommendedGoal, studyAdvice } from '../utils/studyTime'

export default function StudyTime({ planDone = false, className }) {
  const { t } = useTranslation()
  const goal = useSettingsStore((state) => state.dailyGoal)
  const minutes = useProgressStore((state) => Math.floor(state.studyMinutes?.[todayKey()] ?? 0))
  const recommended = useProgressStore((state) => recommendedGoal(state.unlockedStages))
  const advice = studyAdvice({ minutes, goal, planDone })
  // ครบแผนแต่ยังนับเวลาไม่ถึง 1 นาที → ไม่ต้องบอก "0 นาที"
  const key = advice === 'enough' && minutes === 0 ? 'enoughShort' : advice
  return <span className={className}>{t(`study.${key}`, { minutes, goal, recommended })}</span>
}
