// =========================================================
// SegmentedControl — ปุ่มเลือก 1 ตัวเลือกจากหลายตัว (ใช้ในหน้าตั้งค่า)
//   options = [{ value, label }]   value = ค่าที่เลือกอยู่   onChange(value)
// =========================================================
import styles from './SegmentedControl.module.css'

export default function SegmentedControl({ label, options, value, onChange }) {
  return (
    <div className={styles.group} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={styles.option}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
