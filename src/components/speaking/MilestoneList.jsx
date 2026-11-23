// =========================================================
// MilestoneList — เป้าหมาย 30 / 90 / 180 วัน (ส่วนที่ 9) นับจากวันที่อัด Speaking Check ครั้งแรก
//   แต่ละเป้า: ทำอะไรได้ + ลิงก์ไปฝึกเรื่องนั้น + สถานะ ถึงแล้ว / อีก N วัน (เป้าถัดไปกรอบเด่น)
// props: milestones = ผลของ milestoneStatus(), started (เคยอัดแล้วหรือยัง)
// =========================================================
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLocalized } from '../../hooks/useLocalized'
import { ICONS } from '../../utils/icons'
import styles from './Speaking.module.css'

export default function MilestoneList({ milestones, started }) {
  const { t } = useTranslation()
  const loc = useLocalized()
  const DoneIcon = ICONS.completed
  const NextIcon = ICONS.next

  return (
    <ol className={styles.milestones}>
      {milestones.map((milestone) => {
        const classes = [styles.milestone, milestone.status === 'next' && styles.milestoneNext, milestone.status === 'reached' && styles.milestoneReached]
        return (
          <li key={milestone.id} className={classes.filter(Boolean).join(' ')}>
            <div className={styles.milestoneHead}>
              <h3 className={styles.milestoneTitle}>{loc(milestone, 'title')}</h3>
              <span className={styles.milestoneStatus}>
                {milestone.status === 'reached' && <DoneIcon className={styles.inlineIcon} aria-hidden="true" />}
                {milestone.status === 'reached'
                  ? t('speakingCheck.milestoneReached')
                  : started
                    ? t('speakingCheck.milestoneDaysLeft', { count: milestone.daysLeft })
                    : t('speakingCheck.milestoneNotStarted')}
              </span>
            </div>
            <p className={styles.milestoneSummary}>{loc(milestone, 'summary')}</p>
            <ul className={styles.goals}>
              {milestone.goals.map((goal) => (
                <li key={goal.to + goal.text}>
                  <Link to={goal.to} className={styles.goal}>
                    <span>{loc(goal, 'text')}</span>
                    <NextIcon className={styles.inlineIcon} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        )
      })}
    </ol>
  )
}
