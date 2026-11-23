// =========================================================
// CollectionPage — Collection การ์ดวลี (ส่วนที่ 8.1, ขั้นที่ 20) → /profile/collection (โหลดแยกไฟล์)
//   พูดวลีในคลังวลีผ่าน = ได้การ์ด / สำนวน-สแลง = การ์ดพิเศษ (กรอบทอง)
//   - สรุป: สะสมแล้ว x / ทั้งหมด + การ์ดพิเศษ y / ทั้งหมด
//   - เลือก ทั้งหมด | การ์ดพิเศษ + สถานการณ์ (ChipTabs, จำใน URL ?show=&situation=)
//   - การ์ด: ข้อความ + ความหมาย + ปุ่มฟัง / การ์ดพิเศษที่ยังไม่ได้ = ปิดไว้ โชว์แค่ความหมายเป็นคำใบ้ + ลิงก์ไปสะสม
//   - วลีเต็มโหลดทุกสถานการณ์ (use + Suspense ของ AppLayout)
// =========================================================
import { use } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { loadSituationPhrases, phraseSituations } from '../data'
import { useProgressStore } from '../store/progressStore'
import { useLocalized } from '../hooks/useLocalized'
import { cardsToShow, situationSummary, SPECIAL_TOTAL } from '../utils/collection'
import { ICONS } from '../utils/icons'
import Page from '../components/Page'
import Button from '../components/Button'
import ChipTabs from '../components/ChipTabs'
import SegmentedControl from '../components/SegmentedControl'
import LineButton from '../components/lesson/LineButton'
import styles from './CollectionPage.module.css'

const ALL = 'all'

export default function CollectionPage() {
  const { t } = useTranslation()
  const loc = useLocalized()
  const [searchParams, setSearchParams] = useSearchParams()
  const collection = useProgressStore((state) => state.collection)
  // วลีเต็มของทุกสถานการณ์ (จำนวนสถานการณ์คงที่ → เรียก use ในลูปได้)
  const phrasesBySituation = phraseSituations.map((situation) => ({ situation, phrases: use(loadSituationPhrases(situation.id)) }))

  const owned = new Set(collection)
  const summaries = new Map(phrasesBySituation.map(({ situation, phrases }) => [situation.id, situationSummary(phrases, owned)]))
  const total = [...summaries.values()].reduce((sum, item) => sum + item.total, 0)
  const ownedTotal = [...summaries.values()].reduce((sum, item) => sum + item.owned, 0)
  const specialOwned = [...summaries.values()].reduce((sum, item) => sum + item.specialOwned, 0)

  const show = searchParams.get('show') === 'special' ? 'special' : ALL
  const requested = searchParams.get('situation')
  const situationId = summaries.has(requested) ? requested : ALL
  const update = (next) => {
    const params = { show, situation: situationId, ...next }
    setSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, value]) => value !== ALL)),
      { replace: true },
    )
  }

  const pool = phrasesBySituation.filter(({ situation }) => situationId === ALL || situation.id === situationId)
  const situationOf = new Map(pool.flatMap(({ situation, phrases }) => phrases.map((phrase) => [phrase.id, situation])))
  const { owned: cards, lockedSpecial } = cardsToShow(
    pool.flatMap(({ phrases }) => phrases),
    collection,
    show,
  )
  const countLabel = (summary) => (show === 'special' ? `${summary.specialOwned}/${summary.special}` : `${summary.owned}/${summary.total}`)
  const SpecialIcon = ICONS.special
  const LockedIcon = ICONS.locked

  return (
    <Page title={t('collection.title')} subtitle={t('collection.subtitle')} backTo="/profile">
      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <p className={styles.summaryValue}>
            {ownedTotal}
            <span className={styles.summaryTotal}>/{total}</span>
          </p>
          <p className={styles.summaryLabel}>{t('collection.cards')}</p>
          <span className={styles.meter} aria-hidden="true">
            <span className={styles.meterFill} style={{ width: `${(ownedTotal / Math.max(1, total)) * 100}%` }} />
          </span>
        </div>
        <div className={`${styles.summaryItem} ${styles.summarySpecial}`}>
          <p className={styles.summaryValue}>
            {specialOwned}
            <span className={styles.summaryTotal}>/{SPECIAL_TOTAL}</span>
          </p>
          <p className={styles.summaryLabel}>
            <SpecialIcon className={styles.inlineIcon} aria-hidden="true" /> {t('collection.specialCards')}
          </p>
          <span className={styles.meter} aria-hidden="true">
            <span className={`${styles.meterFill} ${styles.meterSpecial}`} style={{ width: `${(specialOwned / Math.max(1, SPECIAL_TOTAL)) * 100}%` }} />
          </span>
        </div>
      </div>
      <p className={styles.hint}>{t('collection.howTo')}</p>

      <div className={styles.filters}>
        <SegmentedControl
          label={t('collection.show')}
          value={show}
          onChange={(value) => update({ show: value })}
          options={[
            { value: ALL, label: t('collection.showAll') },
            { value: 'special', label: t('collection.showSpecial') },
          ]}
        />
        <ChipTabs
          label={t('collection.situations')}
          value={situationId}
          onChange={(value) => update({ situation: value })}
          options={[
            {
              value: ALL,
              label: t('collection.allSituations'),
              count: show === 'special' ? `${specialOwned}/${SPECIAL_TOTAL}` : `${ownedTotal}/${total}`,
            },
            ...phraseSituations.map((situation) => ({
              value: situation.id,
              label: loc(situation, 'name'),
              count: countLabel(summaries.get(situation.id)),
            })),
          ]}
        />
      </div>

      {cards.length === 0 && lockedSpecial.length === 0 ? (
        <div className={styles.empty}>
          <p>{t(ownedTotal === 0 ? 'collection.emptyAll' : 'collection.empty')}</p>
          <Button to={situationId === ALL ? '/phrases' : `/phrases/${situationId}`} icon={ICONS.phrases}>
            {t('collection.goCollect')}
          </Button>
        </div>
      ) : (
        <ul className={styles.cards}>
          {cards.map(({ phrase, rarity }) => (
            <li key={phrase.id} className={rarity ? `${styles.card} ${styles.cardSpecial}` : styles.card}>
              {rarity && (
                <span className={styles.badge}>
                  <SpecialIcon className={styles.inlineIcon} aria-hidden="true" /> {t(`collection.rarity.${rarity}`)}
                </span>
              )}
              <div className={styles.cardMain}>
                <LineButton text={phrase.text} speakKey={`card-${phrase.id}`} label={t('collection.listen')} />
                <div className={styles.cardText}>
                  <p className={styles.phrase} lang="en">
                    {phrase.text}
                  </p>
                  <p className={styles.meaning}>{phrase.meaningTh}</p>
                </div>
              </div>
              <p className={styles.situation}>{loc(situationOf.get(phrase.id), 'name')}</p>
            </li>
          ))}
          {lockedSpecial.map(({ phrase, rarity }) => {
            const situation = situationOf.get(phrase.id)
            return (
              <li key={phrase.id} className={`${styles.card} ${styles.cardLocked}`}>
                <span className={styles.badge}>
                  <LockedIcon className={styles.inlineIcon} aria-hidden="true" /> {t(`collection.rarity.${rarity}`)}
                </span>
                <div className={styles.cardText}>
                  <p className={styles.phrase}>{t('collection.lockedText')}</p>
                  <p className={styles.meaning}>{t('collection.lockedHint', { meaning: phrase.meaningTh })}</p>
                </div>
                <Link className={styles.situationLink} to={`/phrases/${situation.id}?group=${phrase.group}`}>
                  {t('collection.findIt', { name: loc(situation, 'name') })}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Page>
  )
}
