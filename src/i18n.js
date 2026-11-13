// =========================================================
// ตั้งค่า i18n (react-i18next)
// - ข้อความ UI ทั้งหมดอยู่ใน src/locales/th.json และ en.json
// - ภาษาที่เลือกเก็บใน settingsStore (แหล่งข้อมูลเดียว) แล้ว sync มาที่ i18n
// - เนื้อหาบทเรียน (ประโยคอังกฤษ / คำแปลไทย / คำอ่านไทย) ไม่ผ่าน i18n
// =========================================================
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import th from './locales/th.json'
import en from './locales/en.json'
import { UI_LANGUAGES, useSettingsStore } from './store/settingsStore'

// ภาษาเริ่มต้นอ่านจาก store (ซึ่งอ่านจาก localStorage แล้ว) — ถ้าค่าแปลก ๆ ใช้ภาษาไทย
const savedLanguage = useSettingsStore.getState().uiLanguage
const initialLanguage = UI_LANGUAGES.includes(savedLanguage) ? savedLanguage : 'th'

i18n.use(initReactI18next).init({
  resources: {
    th: { translation: th },
    en: { translation: en },
  },
  lng: initialLanguage,
  fallbackLng: 'th',
  initAsync: false, // ข้อความอยู่ในไฟล์แล้ว ไม่ต้องรอโหลด
  interpolation: { escapeValue: false }, // React ป้องกัน XSS ให้อยู่แล้ว
})

// อัปเดต <html lang> และชื่อแท็บเบราว์เซอร์ให้ตรงกับภาษาที่เลือก
function applyDocumentLanguage(lng) {
  document.documentElement.lang = lng
  document.title = i18n.t('app.name')
}

i18n.on('languageChanged', applyDocumentLanguage)
applyDocumentLanguage(i18n.language)

// เมื่อผู้ใช้กดเปลี่ยนภาษา (store เปลี่ยน) → เปลี่ยนภาษาของ i18n ตาม
useSettingsStore.subscribe((state, prevState) => {
  if (state.uiLanguage !== prevState.uiLanguage) {
    i18n.changeLanguage(state.uiLanguage)
  }
})

export default i18n
