// =========================================================
// DailyPlanPage — แผนวันนี้ (/plan) (ส่วนที่ 8.4, ขั้นที่ 18)
//   เป้าหมาย 5/10/15/20 นาที (et-settings.dailyGoal — เปลี่ยนได้ที่นี่) → ขั้นของวันนี้ตามลำดับ:
//   ทบทวน → บทใหม่ → บทสนทนาสุ่ม → มินิเกม (สร้างใน utils/dailyPlan.js, คืบหน้าจากเหตุการณ์ใน progressStore.trackEvent)
//   ขั้นถัดไปเด่น (ปุ่มเริ่มหลัก) / ขั้นที่ทำแล้วติ๊กถูก / ครบทุกขั้น → ข้อความชม
//   + นาทีที่พูดภาษาอังกฤษวันนี้ + กราฟ 7 วัน (SpeakingChart)
// =========================================================
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { cityMap, getLessonMeta, getScenarioMeta, lessonList, scenarioList } from '../data'
import { bossDoneThisWeek, bossSeed, currentBoss } from '../utils/boss'
import { isScenarioLocked } from '../utils/friendship'
import { isPlaceUnlocked } from '../utils/places'
import Picture from '../components/Picture'
import { useLocalized } from '../hooks/useLocalized'
import { useDailyPlan } from '../hooks/useDailyPlan'
import { useProgressStore } from '../store/progressStore'
import { todayKey, weekStartKey } from '../utils/date'
import { nextLesson } from '../utils/progress'
import { isPlanDone, isTaskDone, nextPlanTask, planStepsLeft, TALK_FROM_STAGE } from '../utils/dailyPlan'
import { ICONS } from '../utils/icons'
import Page from '../components/Page'
import Section from '../components/Section'
import Button from '../components/Button'
import GoalPicker from '../components/GoalPicker'
import StudyTime from '../components/StudyTime'
import SpeakingChart from '../components/SpeakingChart'
import { formatMinutes } from '../utils/speaking'
import styles from './DailyPlan.module.css'

const TASK_ICON = { review: ICONS.review, lesson: ICONS.learn, talk: ICONS.talk, game: ICONS.games }

// Boss Conversation ประจำสัปดาห์ (ส่วนที่ 8.3, ขั้นที่ 18-2) — บทเดิม seed เดิมทั้งสัปดาห์ (utils/boss.js)
function BossCard() {
  const { t } = useTranslation()
  const loc = useLocalized()
  const unlockedStages = useProgressStore((state) => state.unlockedStages)
  const friendship = useProgressStore((state) => state.npcFriendship)
  const bossWeek = useProgressStore((state) => state.bossWeek)
  const weekId = weekStartKey(todayKey())
  const ready = unlockedStages.includes(TALK_FROM_STAGE)
  const available = (scenario) => {
    const place = cityMap.find((entry) => entry.placeId === scenario.placeId)
    return Boolean(place && isPlaceUnlocked(place, unlockedStages)) && !isScenarioLocked(scenario, friendship)
  }
  const pinBoss = useProgressStore((state) => state.pinBoss)
  const done = bossDoneThisWeek(bossWeek, weekId)
  // บทที่ล็อกไว้ของสัปดาห์ (ความสนิท/สถานที่เปลี่ยนกลางสัปดาห์ไม่ทำให้เปลี่ยนบท) — ยังไม่ได้ล็อก/เล่นไม่ได้แล้ว → เลือกแล้วล็อกใหม่
  const { boss, needsPin } = ready
    ? currentBoss({ scenarios: scenarioList, bossWeek, weekId, isAvailable: available, getMeta: getScenarioMeta })
    : { boss: done ? getScenarioMeta(bossWeek.scenarioId) : null, needsPin: false }
  const bossId = boss?.id
  useEffect(() => {
    if (needsPin && bossId) pinBoss(bossId)
  }, [needsPin, bossId, pinBoss])

  return (
    <Section title={t('plan.boss.title')} description={t('plan.boss.newWeek')}>
      <div className={done ? `${styles.boss} ${styles.bossDone}` : styles.boss}>
        {boss ? (
          <>
            <Picture image={boss.image} size="sm" alt="" className={styles.bossPicture} />
            <div className={styles.taskText}>
              <p className={styles.taskTitle}>{loc(boss, 'name')}</p>
              <p className={styles.taskDesc}>{done ? t('plan.boss.done') : t('plan.boss.desc')}</p>
            </div>
            <Button
              to={`/talk/${boss.id}?mode=boss&seed=${bossSeed(weekId)}`}
              size="sm"
              variant={done ? 'secondary' : 'primary'}
              icon={ICONS.boss}
            >
              {done ? t('plan.boss.again') : t('plan.boss.start')}
            </Button>
          </>
        ) : (
          <p className={styles.taskDesc}>{ready ? t('plan.boss.none') : t('plan.boss.locked')}</p>
        )}
      </div>
    </Section>
  )
}

export default function DailyPlanPage() {
  const { t } = useTranslation()
  const loc = useLocalized()
  const plan = useDailyPlan()
  const unlockedStages = useProgressStore((state) => state.unlockedStages)
  const lessonProgress = useProgressStore((state) => state.lessonProgress)
  const speakingMinutes = useProgressStore((state) => state.speakingMinutes)
  const today = todayKey()

  const lesson = nextLesson(lessonList, unlockedStages, lessonProgress)
  const taskLink = {
    review: plan?.goal === 5 ? '/review?short=1' : '/review',
    lesson: lesson ? `/lesson/${lesson.id}` : '/learn',
    talk: '/talk',
    game: '/games', // เลือกมินิเกมที่เล่นได้ (ขั้นที่ 17)
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
        <GoalPicker />
        <p className={styles.studyTime}>
          <StudyTime stepsLeft={planStepsLeft(plan)} />
        </p>
        <p className={styles.goalMore}>{t('plan.goalMore')}</p>
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

      <BossCard />

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
