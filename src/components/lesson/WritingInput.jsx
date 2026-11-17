// =========================================================
// WritingInput — ช่องพิมพ์ภาษาอังกฤษของแบบฝึกเขียน (Stage 7)
// - ปิดตัวช่วยของแป้นพิมพ์/เบราว์เซอร์ทั้งหมด (แก้คำอัตโนมัติ, ตัวใหญ่อัตโนมัติ, ขีดเส้นใต้คำผิด, เดาคำ, Grammarly)
//   เพราะแบบฝึกนี้ฝึกสะกดเอง — ถ้าแป้นพิมพ์แก้ให้ ผู้เรียนจะไม่ได้ฝึก
// - Enter = ตรวจ (ช่องบรรทัดเดียว) — ยกเว้นตอนกำลังเลือกคำในแป้นพิมพ์ภาษาไทย/IME (isComposing)
//   ช่องหลายบรรทัด (เรื่องสั้น) Enter = ขึ้นบรรทัดใหม่ ตรวจด้วยปุ่ม
// - พิมพ์เป็นอักษรไทยอยู่ → บอกให้เปลี่ยนแป้นพิมพ์
// - กดช่องพิมพ์ → เลื่อนจอให้เห็นช่อง (แป้นพิมพ์มือถือเด้งขึ้นมาบัง)
// props: value, onChange(text), onSubmit(), multiline, rows, label (ชื่อช่องสำหรับโปรแกรมอ่านหน้าจอ), placeholder,
//        inline (ช่องเล็กในประโยค — เติมคำ), size (ความกว้างเป็นจำนวนตัวอักษร ใช้กับ inline), disabled, inputRef
// =========================================================
import { useTranslation } from 'react-i18next'
import { hasThaiLetters } from '../../utils/spelling'
import { scrollIntoViewGently } from '../../utils/scroll'
import styles from './WritingInput.module.css'

// ปิดตัวช่วยสะกดคำของแป้นพิมพ์มือถือ / เบราว์เซอร์ / ส่วนขยาย
const NO_ASSIST = {
  autoComplete: 'off',
  autoCorrect: 'off',
  autoCapitalize: 'none',
  spellCheck: false,
  lang: 'en',
  'data-gramm': 'false',
  'data-gramm_editor': 'false',
  'data-enable-grammarly': 'false',
}

export default function WritingInput({
  value,
  onChange,
  onSubmit,
  multiline = false,
  rows = 3,
  label,
  placeholder,
  inline = false,
  size,
  disabled = false,
  inputRef,
}) {
  const { t } = useTranslation()
  const thai = hasThaiLetters(value)

  function handleKeyDown(event) {
    if (multiline || event.key !== 'Enter' || event.nativeEvent.isComposing) return
    event.preventDefault()
    onSubmit?.()
  }

  const common = {
    ...NO_ASSIST,
    ref: inputRef,
    value,
    disabled,
    placeholder,
    'aria-label': label,
    onChange: (event) => onChange(event.target.value),
    onKeyDown: handleKeyDown,
    // แป้นพิมพ์มือถือเด้งขึ้น → รอจอหดก่อนแล้วค่อยเลื่อน
    onFocus: (event) => {
      const element = event.currentTarget
      setTimeout(() => scrollIntoViewGently(element), 300)
    },
  }

  const field = multiline ? (
    <textarea {...common} rows={rows} className={`${styles.field} ${styles.multiline}`} />
  ) : (
    <input
      {...common}
      type="text"
      enterKeyHint="done"
      className={`${styles.field} ${inline ? styles.inline : ''}`}
      style={inline && size ? { '--chars': size } : undefined}
    />
  )

  if (inline) {
    return (
      <>
        {field}
        {thai && (
          <span className={styles.thaiNote} role="note">
            {t('write.thaiKeyboard')}
          </span>
        )}
      </>
    )
  }

  return (
    <div className={styles.wrap}>
      {field}
      {thai && (
        <p className={styles.thaiNote} role="note">
          {t('write.thaiKeyboard')}
        </p>
      )}
    </div>
  )
}
