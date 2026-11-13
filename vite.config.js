import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'

// ตั้งค่า Vite
// - npm run dev       → http://localhost:5173 (ไมค์ใช้ได้เพราะเป็น localhost)
// - npm run dev:phone → https://<IP เครื่อง>:5173 ให้มือถือในวง Wi-Fi เดียวกันเปิดได้
//   (เบราว์เซอร์อนุญาตไมค์เฉพาะ https หรือ localhost จึงต้องเปิด https ด้วยใบรับรองชั่วคราว)
export default defineConfig(({ mode }) => ({
  plugins: [react(), mode === 'phone' && basicSsl()].filter(Boolean),
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
}))
