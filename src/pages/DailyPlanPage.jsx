// =========================================================
// DailyPlanPage — แผนวันนี้ (/plan) (ส่วนที่ 8.4, ขั้นที่ 18)
//   เป้าหมาย 5/10/15/20 นาที (et-settings.dailyGoal — เปลี่ยนได้ที่นี่) → ขั้นของวันนี้ตามลำดับ:
//   ทบทวน → บทใหม่ → บทสนทนาสุ่ม → มินิเกม (สร้างใน utils/dailyPlan.js, คืบหน้าจากเหตุการณ์ใน progressStore.trackEvent)
//   ขั้นถัดไปเด่น (ปุ่มเริ่มหลัก) / ขั้นที่ทำแล้วติ๊กถูก / ครบทุกขั้น → ข้อความชม
//   + นาทีที่พูดภาษาอังกฤษวันนี้ + กราฟ 7 วัน (SpeakingChart)
// =========================================================
import { useTranslation } from 'react-i18next'
import { getLessonMeta, lessonList } from '../data'
import { useLocalized } from '../hooks/useLocalized'
import { useDailyPlan } from '../hooks/useDailyPlan'
import { useProgressStore } from '../store/progressStore'
import { useSettingsStore } from '../store/settingsStore'
import { todayKey } from '../utils/date'
import { nextLesson } from '../utils/progress'
import { isPlanDone, isTaskDone, nextPlanTask, PLAN_GOALS, TALK_FROM_STAGE } from '../utils/dailyPlan'
import { ICONS } from '../utils/icons'
import Page from '../components/Page'
import Section from '../components/Section'
import Button from '../components/Button'
import SegmentedControl from '../components/SegmentedControl'
import SpeakingChart from '../components/SpeakingChart'
import { formatMinutes } from '../utils/speaking'
import styles from './DailyPlan.module.css'

const TASK_ICON = { review: ICONS.review, lesson: ICONS.learn, talk: ICONS.talk, game: ICONS.games }

export default function DailyPlanPage() {
  const { t } = useTranslation()
  const loc = useLocalized()
  const plan = useDailyPlan()
  const goal = useSettingsStore((state) => state.dailyGoal)
  const setSetting = useSettingsStore((state) => state.setSetting)
  const unlockedStages = useProgressStore((state) => state.unlockedStages)
  const lessonProgress = useProgressStore((state) => state.lessonProgress)
  const speakingMinutes = useProgressStore((state) => state.speakingMinutes)
  const today = todayKey()

  const lesson = nextLesson(lessonList, unlockedStages, lessonProgress)
  // มินิเกม: ยังไม่ถึงบทสนทนา → ฝึกเสียง (ฟังแล้วเลือก) / พูดเป็นประโยคแล้ว → Real or Textbook?
  const gameLink = unlockedStages.includes(TALK_FROM_STAGE) ? '/phrases/real-vs-textbook' : '/sounds'
  const taskLink = {
    review: plan?.goal === 5 ? '/review?short=1' : '/review',
    lesson: lesson ? `/lesson/${lesson.id}` : '/learn',
    talk: '/talk',
    game: gameLink,
  }
  const taskDesc = (task) => {
    if (task.kind !== 'lesson') return t(`plan.taskDesc.${task.kind}`)
    return lesson
      ? t('plan.taskDesc.lesson', { title: loc(getLessonMeta(lesson.id), 'title') })
      : t('plan.taskDesc.lessonAllDone')
  }
  const current = nextPlanTask(plan)
  const done = isPlanDone(plan)

  return (
    <Page title={t('plan.title')} subtitle={t('plan.subtitle')} backTo="/">
      <div className={styles.goal}>
        <span className={styles.goalLabel}>{t('plan.goalLabel')}</span>
        <SegmentedControl
          label={t('plan.goalLabel')}
          value={goal}
          onChange={(value) => setSetting('dailyGoal', value)}
          options={PLAN_GOALS.map((minutes) => ({ value: minutes, label: t('plan.goalMinutes', { count: minutes }) }))}
        />
      </div>

      {done && (
        <div className={styles.allDone} role="status">
          <ICONS.completed className={styles.allDoneIcon} aria-hidden="true" />
          <div>
            <p className={styles.allDoneTitle}>{t('plan.allDone')}</p>
            <p className={styles.allDoneText}>{t('plan.allDoneText')}</p>
          </div>
        </div>
      )}

      <Section title={t('plan.tasks')}>
        <ol className={styles.tasks}>
          {(plan?.tasks ?? []).map((task, index) => {
            const Icon = TASK_ICON[task.kind]
            const finished = isTaskDone(task)
            const isCurrent = task === current
            const classes = [styles.task, finished && styles.finished, isCurrent && styles.current].filter(Boolean)
            return (
              <li key={task.kind} className={classes.join(' ')}>
                <span className={styles.number} aria-hidden="true">
                  {finished ? <ICONS.completed className={styles.check} /> : index + 1}
                </span>
                <Icon className={styles.taskIcon} aria-hidden="true" />
                <div className={styles.taskText}>
                  <p className={styles.taskTitle}>
                    {t(`plan.task.${task.kind}`)}
                    {task.target > 1 && (
                      <span className={styles.count}>
                        {t('plan.progress', { progress: task.progress, target: task.target })}
                      </span>
                    )}
                  </p>
                  <p className={styles.taskDesc}>{finished ? t('plan.done') : taskDesc(task)}</p>
                </div>
                {!finished && (
                  <Button
                    to={taskLink[task.kind]}
                    size="sm"
                    variant={isCurrent ? 'primary' : 'secondary'}
                    aria-label={`${t('plan.start')}: ${t(`plan.task.${task.kind}`)}`}
                  >
                    {t('plan.start')}
                  </Button>
                )}
              </li>
            )
          })}
        </ol>
      </Section>

      <Section title={t('plan.speaking')} description={t('plan.speakingNote')}>
        <p className={styles.speakingToday}>
          {t('plan.speakingToday')}{' '}
          <strong>{t('plan.minutes', { value: formatMinutes(speakingMinutes[today] ?? 0) })}</strong>
        </p>
        <SpeakingChart minutes={speakingMinutes} today={today} />
      </Section>
    </Page>
  )
}
