// =========================================================
// WelcomePage — แนะนำวิธีเรียน (/welcome): เข้าเว็บครั้งแรก หน้าแรกพามาที่นี่ / เปิดดูอีกครั้งได้จากหน้าตั้งค่า
//   3 หน้าสั้น ๆ: 1) เรียนแบบเด็กเจ้าของภาษา ฟัง → พูด → อ่าน → เขียน (เรียงเป็น Stage ปลดล็อกทีละขั้น)
//                2) เดาจากภาพและเสียงก่อน ไม่ต้องแปล — พูดผิดได้ไม่จำกัด
//                3) เตรียมไมค์ + วันละนิดทุกวัน + ปุ่ม "เรียนต่อ" พาไปบทถัดไปเอง
//   กด "ข้าม" ได้ทุกหน้า — จบแล้วบันทึกว่าเห็นแล้ว (introSeen) แล้วพาไปบทถัดไปเลย
// =========================================================
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen, Ear, Flame, Image, Mic, PenLine, RotateCcw, ShieldCheck, Smile } from 'lucide-react'
import { lessonList } from '../data'
import { useProgressStore } from '../store/progressStore'
import { useSettingsStore } from '../store/settingsStore'
import { nextLesson } from '../utils/progress'
import Page from '../components/Page'
import Button from '../components/Button'
import styles from './WelcomePage.module.css'

// ลำดับทักษะแบบเด็กเจ้าของภาษา (หน้า 1)
const SKILLS = [
  { key: 'listen', Icon: Ear },
  { key: 'speak', Icon: Mic },
  { key: 'read', Icon: BookOpen },
  { key: 'write', Icon: PenLine },
]

// ข้อแนะนำ 3 ข้อต่อหน้า (หน้า 2–3) — ข้อความอยู่ในไฟล์ภาษา welcome.<หน้า>.<key>
const POINTS = {
  guess: [
    { key: 'picture', Icon: Image },
    { key: 'meaning', Icon: BookOpen },
    { key: 'mistakes', Icon: Smile },
  ],
  daily: [
    { key: 'mic', Icon: ShieldCheck },
    { key: 'daily', Icon: Flame },
    { key: 'review', Icon: RotateCcw },
  ],
}

const PAGES = ['native', 'guess', 'daily']

export default function WelcomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setSetting = useSettingsStore((state) => state.setSetting)
  const unlockedStages = useProgressStore((state) => state.unlockedStages)
  const lessonProgress = useProgressStore((state) => state.lessonProgress)
  const [index, setIndex] = useState(0)
  const page = PAGES[index]
  const last = index + 1 >= PAGES.length

  // จบ/ข้าม → จำว่าเห็นแล้ว แล้วไปบทถัดไป (เรียนจบหมดแล้ว → หน้าแรก)
  function finish() {
    setSetting('introSeen', true)
    const lesson = nextLesson(lessonList, unlockedStages, lessonProgress)
    navigate(lesson ? `/lesson/${lesson.id}` : '/', { replace: true })
  }

  return (
    <Page title={t('welcome.title')} subtitle={t('welcome.subtitle')}>
      <div key={page} className={styles.card}>
        <h2 className={styles.heading}>{t(`welcome.${page}.title`)}</h2>
        <p className={styles.text}>{t(`welcome.${page}.text`)}</p>

        {page === 'native' && (
          <ol className={styles.skills} aria-label={t('welcome.native.title')}>
            {SKILLS.map(({ key, Icon }, skillIndex) => (
              <li key={key} className={styles.skill}>
                <span className={styles.skillIcon}>
                  <Icon aria-hidden="true" />
                </span>
                <span className={styles.skillName}>{t(`welcome.skills.${key}`)}</span>
                <span className={styles.skillStage}>{t(`welcome.skills.${key}Stage`)}</span>
                {skillIndex < SKILLS.length - 1 && <span className={styles.arrow} aria-hidden="true" />}
              </li>
            ))}
          </ol>
        )}

        {POINTS[page] && (
          <ul className={styles.points}>
            {POINTS[page].map(({ key, Icon }) => (
              <li key={key} className={styles.point}>
                <Icon className={styles.pointIcon} aria-hidden="true" />
                <span>{t(`welcome.${page}.${key}`)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* จุดบอกหน้า */}
      <div className={styles.dots} aria-label={t('welcome.pageN', { n: index + 1, total: PAGES.length })}>
        {PAGES.map((name, dotIndex) => (
          <span key={name} className={dotIndex === index ? `${styles.dot} ${styles.dotActive}` : styles.dot} />
        ))}
      </div>

      <div className={styles.actions}>
        <Button block size="lg" onClick={() => (last ? finish() : setIndex(index + 1))}>
          {t(last ? 'welcome.start' : 'welcome.next')}
        </Button>
        {!last && (
          <Button block variant="ghost" onClick={finish}>
            {t('welcome.skip')}
          </Button>
        )}
      </div>
    </Page>
  )
}
