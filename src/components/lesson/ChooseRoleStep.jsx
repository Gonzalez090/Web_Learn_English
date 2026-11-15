// =========================================================
// ChooseRoleStep — เลือกว่าจะเล่นเป็นใครในบทสนทนา (Stage 5)
//   ระบบจะพูดบทของอีกฝ่าย แล้วรอให้เราพูดบทของเรา (ขั้นเล่นบทบาทถัดไป)
//   การ์ดของแต่ละบท: ชื่อผู้พูด + ประโยคแรกของบทนั้น + จำนวนประโยคที่ต้องพูด
// props: lesson (speakers), items (บรรทัด), onChoose(speakerId)
// =========================================================
import { useTranslation } from 'react-i18next'
import { UserRound } from 'lucide-react'
import { useLocalized } from '../../hooks/useLocalized'
import Picture from '../Picture'
import styles from './Step.module.css'
import roleStyles from './ChooseRoleStep.module.css'

export default function ChooseRoleStep({ lesson, items, onChoose }) {
  const { t } = useTranslation()
  const loc = useLocalized()

  return (
    <div className={styles.step}>
      <p className={styles.instruction}>{t('dialogue.chooseRole')}</p>
      <Picture image={items[0]?.image} size="fill" alt={loc(lesson, 'scene')} className={styles.pictureSmall} />
      <p className={styles.hint}>{t('dialogue.chooseRoleHint')}</p>
      <div className={roleStyles.roles}>
        {(lesson.speakers ?? []).map((speaker) => {
          const lines = items.filter((line) => line.speaker === speaker.id)
          return (
            <button key={speaker.id} type="button" className={roleStyles.role} onClick={() => onChoose(speaker.id)}>
              <UserRound className={roleStyles.icon} aria-hidden="true" />
              <span className={roleStyles.name}>{loc(speaker, 'name')}</span>
              {lines[0] && (
                <span className={roleStyles.preview} lang="en">
                  {lines[0].target}
                </span>
              )}
              <span className={roleStyles.count}>{t('dialogue.lineCount', { count: lines.length })}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
