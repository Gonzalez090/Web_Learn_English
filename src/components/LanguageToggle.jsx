// =========================================================
// LanguageToggle — ปุ่มสลับภาษาหน้าเว็บ TH / EN
// อยู่มุมบนขวาทุกหน้า (TopBar) และในหน้าตั้งค่า
// ค่าที่เลือกเก็บใน settingsStore → จำไว้ใน localStorage อัตโนมัติ
// =========================================================
import { useTranslation } from 'react-i18next'
import { UI_LANGUAGES, useSettingsStore } from '../store/settingsStore'
import styles from './LanguageToggle.module.css'

export default function LanguageToggle({ size = 'sm' }) {
  const { t } = useTranslation()
  const uiLanguage = useSettingsStore((state) => state.uiLanguage)
  const setUiLanguage = useSettingsStore((state) => state.setUiLanguage)

  return (
    <div className={`${styles.toggle} ${styles[size]}`} role="group" aria-label={t('language.label')}>
      {UI_LANGUAGES.map((code) => (
        <button
          key={code}
          type="button"
          className={styles.option}
          aria-pressed={uiLanguage === code}
          title={t(`language.${code}`)}
          onClick={() => setUiLanguage(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
