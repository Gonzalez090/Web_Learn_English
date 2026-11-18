// =========================================================
// ChipTabs — ปุ่มเลือกหมวด 1 หมวด แบบเม็ดยาเรียงต่อกัน (ตัดขึ้นบรรทัดใหม่ได้ — ใช้กับหมวดย่อยหลายหมวด)
//   options = [{ value, label, count? }]   value = ค่าที่เลือกอยู่   onChange(value)
// =========================================================
import styles from './ChipTabs.module.css'

export default function ChipTabs({ label, options, value, onChange }) {
  return (
    <div className={styles.group} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={styles.chip}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.count != null && <span className={styles.count}>{option.count}</span>}
        </button>
      ))}
    </div>
  )
}
