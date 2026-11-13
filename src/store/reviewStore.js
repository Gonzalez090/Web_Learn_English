// =========================================================
// reviewStore — ที่เก็บ "รายการทบทวน" (Spaced Repetition)
// บันทึกลง localStorage อัตโนมัติ (key: et-review)
// ขั้นที่ 4: เก็บข้อที่พลาด (ครบกำหนดพรุ่งนี้) | ขั้นที่ 16: เลื่อนรอบ 1 → 3 → 7 → 14 วัน
// =========================================================
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { addMissedToQueue } from '../utils/review'
import { todayKey } from '../utils/date'

export const useReviewStore = create(
  persist(
    (set) => ({
      // [{ id: 'lessonId:itemId', lessonId, itemId, box, dueDate: 'YYYY-MM-DD', addedAt }]
      reviewQueue: [],

      // เพิ่มข้อที่พลาดของบทหนึ่งเข้าคิว
      addMissed: (lessonId, itemIds) => {
        if (!itemIds?.length) return
        set((state) => ({ reviewQueue: addMissedToQueue(state.reviewQueue, lessonId, itemIds, todayKey()) }))
      },

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
