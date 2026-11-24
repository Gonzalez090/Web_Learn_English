// =========================================================
// จุดเริ่มต้นของแอป
//   1) โหลดฟอนต์ (เก็บไฟล์ฟอนต์ไว้ในเว็บเอง ไม่ดึงจาก Google → ไม่มีคำขอไปเว็บอื่น)
//   2) โหลดสไตล์กลาง
//   3) ตั้งค่า i18n (ภาษาหน้าเว็บ TH/EN)
//   4) render App ภายใต้ Router
// =========================================================
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource/nunito/400.css'
import '@fontsource/nunito/600.css'
import '@fontsource/nunito/700.css'
import '@fontsource/nunito/800.css'
import '@fontsource/noto-sans-thai-looped/400.css'
import '@fontsource/noto-sans-thai-looped/500.css'
import '@fontsource/noto-sans-thai-looped/600.css'
import '@fontsource/noto-sans-thai-looped/700.css'
import './styles/global.css'
import './i18n'
import App from './App'
import { syncTabs } from './store/syncTabs'
import { startAccount } from './store/accountStore'

syncTabs() // เปิดหลายแท็บ → ความคืบหน้าตรงกัน ไม่เขียนทับกัน
startAccount() // บัญชี Google + ซิงก์ (ไม่ได้ตั้งค่า = ไม่ทำอะไร)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
