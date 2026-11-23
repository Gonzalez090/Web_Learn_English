// =========================================================
// GoalPicker — เลือกเป้าหมายเรียนต่อวัน (5/10/15/20 นาที) + คำอธิบายของเป้าที่เลือก + เป้าที่แนะนำ
// ใช้ในหน้าแผนวันนี้ หน้าตั้งค่า และหน้าแนะนำตอนเข้าเว็บครั้งแรก (ค่าเดียวกัน et-settings.dailyGoal)
// =========================================================
import { useTranslation } from 'react-i18next'
import { useProgressStore } from '../store/progressStore'
import { useSettingsStore } from '../store/settingsStore'
import { DEFAULT_GOAL, PLAN_GOALS } from '../utils/dailyPlan'
import { recommendedGoal } from '../utils/studyTime'
import SegmentedControl from './SegmentedControl'
import styles from './GoalPicker.module.css'

export default function GoalPicker() {
  const { t } = useTranslation()
  // ค่าที่ไม่รู้จัก (แก้มือ) → ค่าเริ่มต้น เหมือน buildDailyPlan
  const goal = useSettingsStore((state) => (PLAN_GOALS.includes(state.dailyGoal) ? state.dailyGoal : DEFAULT_GOAL))
  const setSetting = useSettingsStore((state) => state.setSetting)
  const recommended = useProgressStore((state) => recommendedGoal(state.unlockedStages))

  return (
    <div className={styles.picker}>
      <SegmentedControl
        label={t('plan.goalLabel')}
        value={goal}
        onChange={(value) => setSetting('dailyGoal', value)}
        options={PLAN_GOALS.map((minutes) => ({ value: minutes, label: t('plan.goalMinutes', { count: minutes }) }))}
      />
      <div aria-live="polite">
        <p className={styles.hint}>{t(`plan.goalHint.${goal}`)}</p>
        <p className={goal === recommended ? styles.match : styles.recommend}>
          {goal === recommended ? t('plan.goalMatch') : t('plan.goalRecommend', { count: recommended })}
        </p>
      </div>
    </div>
  )
}
