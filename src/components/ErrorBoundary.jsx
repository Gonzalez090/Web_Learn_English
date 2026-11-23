// =========================================================
// ErrorBoundary — ถ้าหน้าใดหน้าหนึ่งพัง ให้แสดงข้อความเป็นมิตรแทนจอขาว
// - เว็บจริง: ไม่แสดงรายละเอียดข้อผิดพลาด/โค้ด (ไม่ให้คนนอกเห็นโครงสร้างภายใน)
// - ตอนพัฒนา (npm run dev): แสดงข้อความ error ไว้ช่วยแก้บั๊ก
// - โหลดไฟล์เนื้อหาไม่ได้ (ContentLoadError เช่น เน็ตหลุด) → ข้อความให้เช็กอินเทอร์เน็ต
// - เปลี่ยนหน้า (resetKey เปลี่ยน) → ล้างสถานะ error ให้ลองใหม่ได้เอง
// =========================================================
import { Component } from 'react'
import { withTranslation } from 'react-i18next'
import { TriangleAlert } from 'lucide-react'
import { ContentLoadError, forgetFailedLoads } from '../utils/contentLoad'
import Button from './Button'
import styles from './ErrorBoundary.module.css'

class ErrorBoundaryInner extends Component {
  state = { error: null, resetKey: this.props.resetKey }

  static getDerivedStateFromError(error) {
    return { error }
  }

  // แสดงข้อความแล้ว (ไม่วาดหน้าที่พังอีก) → ลืมไฟล์ที่โหลดไม่สำเร็จ ให้เปลี่ยนหน้าแล้วกลับมาลองใหม่ได้
  componentDidCatch() {
    forgetFailedLoads()
  }

  // เปลี่ยนหน้าแล้ว → ล้าง error
  static getDerivedStateFromProps(props, state) {
    if (props.resetKey !== state.resetKey) return { error: null, resetKey: props.resetKey }
    return null
  }

  render() {
    const { t, children } = this.props
    const { error } = this.state
    if (!error) return children
    const loadFailed = error instanceof ContentLoadError

    return (
      <div className={styles.box} role="alert">
        <TriangleAlert className={styles.icon} aria-hidden="true" />
        <h1 className={styles.title}>{t(loadFailed ? 'error.loadTitle' : 'error.title')}</h1>
        <p className={styles.text}>{t(loadFailed ? 'error.loadText' : 'error.text')}</p>
        {import.meta.env.DEV && <pre className={styles.detail}>{String(error?.message ?? error)}</pre>}
        <Button onClick={() => window.location.reload()}>{t('error.reload')}</Button>
      </div>
    )
  }
}

const ErrorBoundary = withTranslation()(ErrorBoundaryInner)
export default ErrorBoundary
