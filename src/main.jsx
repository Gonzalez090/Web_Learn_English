// =========================================================
// จุดเริ่มต้นของแอป
//   1) โหลดสไตล์กลาง
//   2) ตั้งค่า i18n (ภาษาหน้าเว็บ TH/EN)
//   3) render App ภายใต้ Router
// =========================================================
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/global.css'
import './i18n'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
