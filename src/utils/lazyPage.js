// =========================================================
// lazyPage — หน้าที่แยกไฟล์ (React.lazy) ที่โหลดไม่สำเร็จแล้วบอกสาเหตุได้ (ContentLoadError → ErrorBoundary)
//   React.lazy จำความล้มเหลวไว้ → หน้านั้นต้องโหลดหน้าใหม่ (ปุ่มใน ErrorBoundary หรืออัตโนมัติเมื่อมีเวอร์ชันใหม่)
//   ไม่ลองใหม่เองในหน้าเดิม: ตัวโหลดของ Vite ข้ามไฟล์ CSS ที่เคยล้มเหลว → ได้หน้าไม่มีสไตล์
// =========================================================
import { lazy } from 'react'
import { ContentLoadError } from './contentLoad'

export const lazyPage = (importer) =>
  lazy(() =>
    importer().catch((error) => {
      throw new ContentLoadError(error)
    }),
  )
