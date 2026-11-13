// =========================================================
// reviewStore — ที่เก็บ "รายการทบทวน" (Spaced Repetition)
// บันทึกลง localStorage อัตโนมัติ (key: et-review)
// ขั้นที่ 4: เริ่มเก็บข้อที่พลาด | ขั้นที่ 16: จัดรอบ 1 → 3 → 7 → 14 วัน
// =========================================================
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useReviewStore = create(
  persist(
    (set) => ({
      // [{ id, type, refId, box, dueDate: 'YYYY-MM-DD' }]
      reviewQueue: [],

      // ล้างรายการทบทวนทั้งหมด
      resetReview: () => set({ reviewQueue: [] }),
    }),
    {
      name: 'et-review',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted) => ({ reviewQueue: [], ...persisted }),
    },
  ),
)
