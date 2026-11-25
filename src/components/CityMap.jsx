// =========================================================
// CityMap — แผนที่เมือง 7 สถานที่บนหน้าแรก (ส่วนที่ 7)
//   กล่องคำแนะนำ: ตอนนี้อยู่ Stage ไหน → ที่ต่อไปเปิดเมื่อไร (เหลือกี่บท) → แนะนำให้คุยตั้งแต่ Stage ไหน
//   ใบที่เปิดก่อน Stage ที่แนะนำบอก "แนะนำ Stage N+"
//   ปลดล็อกแล้ว → แตะเข้าไปคุย/ฝึกวลีของที่นั้น / ยังล็อก → ภาพสีจริงจางลง + กุญแจ + "เปิดเมื่อจบ Stage N"
//   (แตะที่ล็อกได้ → หน้าสถานที่บอกว่าต้องเรียนอะไรก่อน)
// =========================================================
import { useTranslation } from 'react-i18next'
import { cityMap, getLessonsByStage, getStage } from '../data'
import { useLocalized } from '../hooks/useLocalized'
import { useProgressStore } from '../store/progressStore'
import { TALK_FROM_STAGE } from '../utils/dailyPlan'
import { nextLockedPlace, placeStatus, recommendedStage } from '../utils/places'
import { ICONS } from '../utils/icons'
import Tile, { TileList } from './Tile'
import styles from './CityMap.module.css'

// คำแนะนำเหนือแผนที่
function MapGuide({ unlockedStages }) {
  const { t } = useTranslation()
  const loc = useLocalized()
  const lessonProgress = useProgressStore((state) => state.lessonProgress)
  const stage = getStage(Math.max(...unlockedStages))
  const next = nextLockedPlace(cityMap, unlockedStages)
  const lessonsLeft = next
    ? getLessonsByStage(next.unlockAfterStage).filter((lesson) => !lessonProgress[lesson.id]?.completed).length
    : 0
  const MapIcon = ICONS.map

  return (
    <div className={styles.guide}>
      <MapIcon className={styles.icon} aria-hidden="true" />
      <div className={styles.text}>
        <p className={styles.title}>{t('map.youAreAt', { n: stage.id, name: loc(stage, 'name') })}</p>
        <p className={styles.next}>
          {next
            ? t('map.next', { place: loc(next, 'name'), n: next.unlockAfterStage, count: lessonsLeft })
            : t('map.allOpen')}
        </p>
        {!unlockedStages.includes(TALK_FROM_STAGE) && (
          <p className={styles.note}>{t('map.talkAdvice', { n: TALK_FROM_STAGE })}</p>
        )}
      </div>
    </div>
  )
}

export default function CityMap() {
  const { t } = useTranslation()
  const loc = useLocalized()
  const unlockedStages = useProgressStore((state) => state.unlockedStages)

  return (
    <>
      <MapGuide unlockedStages={unlockedStages} />
      <TileList variant="gallery">
        {cityMap.map((place) => {
          const status = placeStatus(place, unlockedStages)
          // เปิดแล้วพร้อมใช้ทันที (เช่น ออฟฟิศ) → บอกแค่เงื่อนไขปลดล็อกก็พอ
          const recommend = status !== 'ready' && recommendedStage(place) > (place.unlockAfterStage ?? 0) + 1
          return (
            <Tile
              key={place.placeId}
              to={`/place/${place.placeId}`}
              image={place.image}
              title={loc(place, 'name')}
              description={
                <>
                  <span className={status === 'ready' ? `${styles.line} ${styles.ready}` : styles.line}>
                    {status === 'locked' ? t('map.opensAfter', { n: place.unlockAfterStage }) : t(`map.${status}`)}
                  </span>
                  {recommend && (
                    <span className={`${styles.line} ${styles.recommend}`}>
                      {t('map.recommend', { n: recommendedStage(place) })}
                    </span>
                  )}
                </>
              }
              locked={status === 'locked'}
              layout="cover"
            />
          )
        })}
      </TileList>
    </>
  )
}
