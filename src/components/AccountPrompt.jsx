// =========================================================
// AccountPrompt — หน้าแรก: เรียนจบแล้วอย่างน้อย 1 บทแต่ยังไม่ล็อกอิน → ชวนเก็บความคืบหน้าไว้ในบัญชี (ปิดได้ ไม่โผล่อีก)
// =========================================================
import { useTranslation } from 'react-i18next'
import { CloudUpload, X } from 'lucide-react'
import { useAccountStore } from '../store/accountStore'
import { useProgressStore } from '../store/progressStore'
import { useSettingsStore } from '../store/settingsStore'
import Button from './Button'
import styles from './AccountPrompt.module.css'

export default function AccountPrompt() {
  const { t } = useTranslation()
  const status = useAccountStore((state) => state.status)
  const hidden = useSettingsStore((state) => state.accountPromptHidden)
  const setSetting = useSettingsStore((state) => state.setSetting)
  const studied = useProgressStore((state) => Object.values(state.lessonProgress).some((lesson) => lesson.completed))

  if (status !== 'guest' || hidden || !studied) return null

  return (
    <section className={styles.box} aria-label={t('account.promptTitle')}>
      <CloudUpload className={styles.icon} aria-hidden="true" />
      <div className={styles.text}>
        <p className={styles.title}>{t('account.promptTitle')}</p>
        <p className={styles.note}>{t('account.promptText')}</p>
      </div>
      <Button to="/profile" size="sm" className={styles.button}>
        {t('account.signInShort')}
      </Button>
      <button
        type="button"
        className={styles.close}
        aria-label={t('account.promptClose')}
        onClick={() => setSetting('accountPromptHidden', true)}
      >
        <X aria-hidden="true" />
      </button>
    </section>
  )
}
