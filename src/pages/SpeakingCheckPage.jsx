// =========================================================
// SpeakingCheckPage — วัดผลว่าพูดได้จริง (ส่วนที่ 9, ขั้นที่ 19)
//   ทุก 30 วัน ดูภาพชุดเดิมแล้วพูดบรรยาย 1 นาที → อัดเสียงเก็บใน IndexedDB (utils/checkStore.js)
//   สถิติ: คำต่อนาที / คำ / คำไม่ซ้ำ / วลีที่ใช้ / หยุดนาน (utils/speakingCheck.js) → เทียบครั้งแรกกับครั้งล่าสุด
//   + milestone 30 / 90 / 180 วัน นับจากครั้งแรก
// มุมมองในหน้าเดียว: overview (สถานะ + เทียบผล + milestone + ประวัติ) → record (CheckRecorder) → result
// - อัดตอนถึงกำหนด (ครั้งแรก หรือ ≥ 30 วันจากครั้งล่าสุด) = ได้ XP / อัดก่อนกำหนดได้ แต่ไม่ได้ XP
// - พูดสั้นเกินไป → ไม่บันทึก ให้ลองใหม่
// =========================================================
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { milestones, speakingCheck } from '../data'
import { useProgressStore } from '../store/progressStore'
import { formatShortDate, todayKey } from '../utils/date'
import { deleteCheck, listChecks, newCheckId, saveCheck } from '../utils/checkStore'
import { micErrorMessageKey } from '../utils/recognition'
import {
  checkSchedule,
  compareStats,
  computeStats,
  isTooShort,
  milestoneStatus,
  SPEAKING_CHECK_XP,
} from '../utils/speakingCheck'
import { ICONS } from '../utils/icons'
import Page from '../components/Page'
import Section from '../components/Section'
import Button from '../components/Button'
import PageLoading from '../components/PageLoading'
import CheckRecorder from '../components/speaking/CheckRecorder'
import CheckStats from '../components/speaking/CheckStats'
import CheckHistory from '../components/speaking/CheckHistory'
import MilestoneList from '../components/speaking/MilestoneList'
import NativeSample from '../components/speaking/NativeSample'
import RecordingPlayer from '../components/speaking/RecordingPlayer'
import styles from '../components/speaking/Speaking.module.css'

export default function SpeakingCheckPage() {
  const { t, i18n } = useTranslation()
  const [checks, setChecks] = useState(null) // null = กำลังโหลดจาก IndexedDB
  const [storeError, setStoreError] = useState(false)
  const [view, setView] = useState('overview') // 'overview' | 'record' | 'result'
  const [result, setResult] = useState(null)
  const today = todayKey()
  const date = (key) => formatShortDate(key, i18n.language)

  useEffect(() => {
    let alive = true
    listChecks()
      .then((list) => alive && setChecks(list))
      .catch(() => {
        if (!alive) return
        setStoreError(true)
        setChecks([])
      })
    return () => {
      alive = false
    }
  }, [])

  const schedule = checkSchedule(checks ?? [], today)

  // อัดเสร็จ → คิดสถิติ → บันทึก (+ XP ถ้าถึงกำหนด) → หน้าผล
  const handleDone = useCallback(
    async (recording) => {
      const stats = computeStats({ ...recording, chunks: speakingCheck.chunks })
      window.scrollTo({ top: 0 })
      if (isTooShort(stats)) {
        setResult({ tooShort: true, recording, stats })
        setView('result')
        return
      }
      const progress = useProgressStore.getState()
      progress.addSpeakingTime(stats.voicedMs)
      const record = {
        id: newCheckId(),
        date: today,
        createdAt: Date.now(),
        durationMs: recording.durationMs,
        mimeType: recording.mimeType,
        blob: recording.blob,
        transcript: recording.transcript,
        stats,
        rewarded: schedule.due,
      }
      if (record.rewarded) progress.addXp(SPEAKING_CHECK_XP)

      let saveError = false
      try {
        await saveCheck(record)
        setChecks((list) => [...(list ?? []), record])
      } catch {
        saveError = true
      }
      setResult({
        record,
        stats,
        saveError,
        transcriptError: recording.transcriptError,
        previous: schedule.latest,
        number: schedule.count + 1,
      })
      setView('result')
    },
    [schedule.count, schedule.due, schedule.latest, today],
  )

  const handleDelete = async (id) => {
    try {
      await deleteCheck(id)
      setChecks((list) => list.filter((check) => check.id !== id))
    } catch {
      setStoreError(true)
    }
  }

  const backToOverview = () => {
    setView('overview')
    setResult(null)
    window.scrollTo({ top: 0 })
  }

  if (checks === null) return <PageLoading />

  // ---------- อัดเสียง ----------
  if (view === 'record') {
    return (
      <Page title={t('profile.speakingCheck')} subtitle={t('speakingCheck.recordSubtitle')} backTo="/profile">
        <CheckRecorder pictures={speakingCheck.pictures} prompts={speakingCheck.prompts} onDone={handleDone} />
        <Button variant="ghost" onClick={backToOverview}>
          {t('speakingCheck.cancel')}
        </Button>
      </Page>
    )
  }

  // ---------- ผลการอัด ----------
  if (view === 'result' && result) {
    if (result.tooShort) {
      return (
        <Page title={t('profile.speakingCheck')} backTo="/profile">
          <div className={styles.notice} role="status">
            <p className={styles.noticeTitle}>{t('speakingCheck.tooShortTitle')}</p>
            <p>{t('speakingCheck.tooShort')}</p>
          </div>
          <RecordingPlayer blob={result.recording.blob} label={t('speakingCheck.yourRecording')} />
          <div className={styles.actions}>
            <Button icon={ICONS.speakingCheck} onClick={() => setView('record')}>
              {t('speakingCheck.tryAgain')}
            </Button>
            <Button variant="ghost" onClick={backToOverview}>
              {t('speakingCheck.backToOverview')}
            </Button>
          </div>
        </Page>
      )
    }
    const { record, stats, previous } = result
    return (
      <Page title={t('profile.speakingCheck')} backTo="/profile">
        <div className={styles.done} role="status">
          <p className={styles.doneTitle}>{t('speakingCheck.doneTitle', { number: result.number })}</p>
          <p>
            {record.rewarded
              ? t('speakingCheck.doneXp', { xp: SPEAKING_CHECK_XP })
              : t('speakingCheck.doneEarly', { date: date(schedule.nextDate) })}
          </p>
          {result.saveError && <p className={styles.noticeInline}>{t('speakingCheck.saveError')}</p>}
        </div>

        <Section title={t('speakingCheck.yourRecording')}>
          <RecordingPlayer blob={record.blob} label={t('speakingCheck.yourRecording')} />
          <CheckStats
            stats={stats}
            compare={previous ? compareStats(previous.stats, stats) : null}
            compareLabel={previous ? t('speakingCheck.vsPrevious', { date: date(previous.date) }) : ''}
          />
          {record.transcript ? (
            <p className={styles.transcript}>
              <span className={styles.liveLabel}>{t('mic.heard')}</span> <span lang="en">{record.transcript}</span>
            </p>
          ) : (
            <p className={styles.noticeInline}>
              {t('speakingCheck.noText')} {result.transcriptError ? t(micErrorMessageKey(result.transcriptError)) : ''}
            </p>
          )}
          <p className={styles.hint}>{t('speakingCheck.statsNote')}</p>
        </Section>

        <Section title={t('speakingCheck.sampleTitle')} description={t('speakingCheck.sampleHint')}>
          <NativeSample lines={speakingCheck.pictures} />
        </Section>

        <Button block onClick={backToOverview}>
          {t('speakingCheck.backToOverview')}
        </Button>
      </Page>
    )
  }

  // ---------- ภาพรวม ----------
  const { first, latest } = schedule
  const milestoneList = milestoneStatus(milestones, schedule.dayNumber)
  return (
    <Page title={t('profile.speakingCheck')} subtitle={t('profile.speakingCheckDesc')} backTo="/profile">
      <div className={schedule.due ? `${styles.statusCard} ${styles.statusDue}` : styles.statusCard}>
        <p className={styles.statusTitle}>
          {schedule.count === 0
            ? t('speakingCheck.firstTitle')
            : schedule.due
              ? t('speakingCheck.dueTitle', { number: schedule.count + 1 })
              : t('speakingCheck.nextTitle', { date: date(schedule.nextDate), count: schedule.daysLeft })}
        </p>
        <p className={styles.statusText}>
          {schedule.count === 0 ? t('speakingCheck.firstText') : t('speakingCheck.dayNumber', { count: schedule.dayNumber })}
        </p>
        <Button
          variant={schedule.due ? 'primary' : 'secondary'}
          icon={ICONS.speakingCheck}
          block
          onClick={() => setView('record')}
        >
          {schedule.due ? t('speakingCheck.begin') : t('speakingCheck.beginEarly')}
        </Button>
        {!schedule.due && <p className={styles.hint}>{t('speakingCheck.earlyNote')}</p>}
      </div>

      {storeError && <p className={styles.notice}>{t('speakingCheck.storeError')}</p>}

      <Section title={t('speakingCheck.howTitle')}>
        <ol className={styles.how}>
          <li>{t('speakingCheck.how1')}</li>
          <li>{t('speakingCheck.how2')}</li>
          <li>{t('speakingCheck.how3')}</li>
        </ol>
        <p className={styles.hint}>{t('speakingCheck.privacy')}</p>
      </Section>

      {first && latest && first.id !== latest.id && (
        <Section title={t('speakingCheck.compareTitle')} description={t('speakingCheck.compareHint')}>
          <div className={styles.compare}>
            <div className={styles.compareSide}>
              <p className={styles.compareDate}>{t('speakingCheck.firstLabel', { date: date(first.date) })}</p>
              <RecordingPlayer blob={first.blob} label={t('speakingCheck.firstLabel', { date: date(first.date) })} />
            </div>
            <div className={styles.compareSide}>
              <p className={styles.compareDate}>{t('speakingCheck.latestLabel', { date: date(latest.date) })}</p>
              <RecordingPlayer blob={latest.blob} label={t('speakingCheck.latestLabel', { date: date(latest.date) })} />
            </div>
          </div>
          <CheckStats
            stats={latest.stats}
            compare={compareStats(first.stats, latest.stats)}
            compareLabel={t('speakingCheck.vsFirst')}
            showChunks={false}
          />
        </Section>
      )}

      <Section title={t('speakingCheck.milestonesTitle')} description={t('speakingCheck.milestonesHint')}>
        <MilestoneList milestones={milestoneList} started={schedule.count > 0} />
      </Section>

      {checks.length > 0 && (
        <Section title={t('speakingCheck.historyTitle')}>
          <CheckHistory checks={checks} onDelete={handleDelete} />
        </Section>
      )}
    </Page>
  )
}
