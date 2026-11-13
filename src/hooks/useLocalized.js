// =========================================================
// useLocalized — hook สำหรับเลือก field ไทย/อังกฤษ ตามภาษาหน้าเว็บปัจจุบัน
// ใช้: const loc = useLocalized();  loc(stage, 'name')
// =========================================================
import { useTranslation } from 'react-i18next'
import { localized } from '../utils/localize'

export function useLocalized() {
  const { i18n } = useTranslation()
  return (obj, field) => localized(obj, field, i18n.language)
}
