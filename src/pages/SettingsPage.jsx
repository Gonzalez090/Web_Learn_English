// =========================================================
// SettingsPage — ตั้งค่า
// ขั้นที่ 1: ภาษาของหน้าเว็บ
// ขั้นที่ 2: คำอ่านไทย, คำแปลไทย, เสียงอ่านภาษาอังกฤษ
// ขั้นที่ 20: เสียงเอฟเฟกต์ + แอนิเมชัน
// ขั้นที่ 21ข: เป้าหมายรายวัน, ความเร็วเสียงเริ่มต้น, สำรอง/กู้คืน, รีเซ็ตความคืบหน้า (components/settings/)
// =========================================================
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleHelp, Images } from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'
import { useSpeech } from '../hooks/useSpeech'
import Page from '../components/Page'
import Section from '../components/Section'
import LanguageToggle from '../components/LanguageToggle'
import SegmentedControl from '../components/SegmentedControl'
import { playSfx } from '../utils/sfx'
import SpeakButton from '../components/SpeakButton'
import LineButton from '../components/lesson/LineButton'
import BackupSection from '../components/settings/BackupSection'
import ResetSection from '../components/settings/ResetSection'
import GoalPicker from '../components/GoalPicker'
import Tile, { TileList } from '../components/Tile'
import styles from './SettingsPage.module.css'

// ประโยคสำหรับลองฟังเสียง (ภาษาที่เจ้าของภาษาพูดจริง)
const VOICE_SAMPLE = "Hey, how's it going? Let's practice some English today."

// ประโยคลองความเร็ว (มีไฟล์เสียงทั้ง 2 ความเร็วจากคลังวลี)
const RATE_SAMPLE = "Hey, how's it going?"

export default function SettingsPage() {
  const { t } = useTranslation()
  const thaiReading = useSettingsStore((state) => state.thaiReading)
  const thaiTranslation = useSettingsStore((state) => state.thaiTranslation)
  const soundEffects = useSettingsStore((state) => state.soundEffects)
  const animations = useSettingsStore((state) => state.animations)
  const voiceURI = useSettingsStore((state) => state.voiceURI)
  const setSetting = useSettingsStore((state) => state.setSetting)
  const [notice, setNotice] = useState(null) // ผลล่าสุดของสำรอง/กู้คืน/รีเซ็ต
  const [panel, setPanel] = useState(null) // กล่องยืนยันที่เปิดอยู่: 'restore' | 'reset' | null (ทีละกล่อง)
  const { supported, voices, activeVoice, usingLocalFallback, defaultRate } = useSpeech()

  return (
    <Page title={t('settings.title')} backTo="/">
      <Section title={t('language.label')} description={t('language.hint')}>
        <div>
          <LanguageToggle size="md" />
        </div>
      </Section>

      <Section title={t('settings.thaiReading')} description={t('settings.thaiReadingHint')}>
        <SegmentedControl
          label={t('settings.thaiReading')}
          value={thaiReading}
          onChange={(value) => setSetting('thaiReading', value)}
          options={[
            { value: 'auto', label: t('settings.readingAuto') },
            { value: 'on', label: t('settings.readingOn') },
            { value: 'off', label: t('settings.readingOff') },
          ]}
        />
      </Section>

      <Section title={t('settings.thaiTranslation')} description={t('settings.translationHint')}>
        <SegmentedControl
          label={t('settings.thaiTranslation')}
          value={thaiTranslation}
          onChange={(value) => setSetting('thaiTranslation', value)}
          options={[
            { value: 'hidden', label: t('settings.translationHidden') },
            { value: 'shown', label: t('settings.translationShown') },
          ]}
        />
      </Section>

      <Section title={t('plan.goalLabel')} description={t('settings.dailyGoalHint')}>
        <GoalPicker />
      </Section>

      <Section title={t('settings.speechRate')} description={t('settings.speechRateHint')}>
        <div className={styles.rateRow}>
          <SegmentedControl
            label={t('settings.speechRate')}
            value={defaultRate}
            onChange={(value) => setSetting('speechRate', value)}
            options={[
              { value: 'normal', label: t('settings.rateNormal') },
              { value: 'slow', label: t('speech.slow') },
            ]}
          />
          {supported && <LineButton text={RATE_SAMPLE} speakKey="settings-rate-test" label={t('settings.rateTest')} />}
        </div>
      </Section>

      <Section title={t('settings.voice')} description={t('settings.voiceHint')}>
        {supported && voices.length > 0 && (
          <select
            className={styles.select}
            aria-label={t('settings.voice')}
            value={voiceURI ?? ''}
            onChange={(event) => setSetting('voiceURI', event.target.value || null)}
          >
            <option value="">
              {activeVoice && !voiceURI
                ? t('settings.voiceAuto', { name: activeVoice.name })
                : t('settings.voiceAutoShort')}
            </option>
            {voices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {`${voice.name} (${voice.lang})`}
              </option>
            ))}
          </select>
        )}
        {supported && voices.length === 0 && <p className={styles.muted}>{t('settings.voiceLoading')}</p>}
        {usingLocalFallback && activeVoice && (
          <p className={styles.notice} role="status">
            {t('settings.voiceFallbackNote', { name: activeVoice.name })}
          </p>
        )}
        <div className={styles.voiceTest}>
          <SpeakButton text={VOICE_SAMPLE} id="settings-voice-test" useFiles={false} />
        </div>
      </Section>

      {/* เสียงเอฟเฟกต์ + แอนิเมชันเล็ก ๆ (ขั้นที่ 20) */}
      <Section title={t('settings.effects')} description={t('settings.effectsHint')}>
        <div className={styles.effectRow}>
          <span className={styles.effectLabel}>{t('settings.soundEffects')}</span>
          <SegmentedControl
            label={t('settings.soundEffects')}
            value={soundEffects ? 'on' : 'off'}
            onChange={(value) => {
              setSetting('soundEffects', value === 'on')
              if (value === 'on') playSfx('pass')
            }}
            options={[
              { value: 'on', label: t('settings.on') },
              { value: 'off', label: t('settings.off') },
            ]}
          />
        </div>
        <div className={styles.effectRow}>
          <span className={styles.effectLabel}>{t('settings.animations')}</span>
          <SegmentedControl
            label={t('settings.animations')}
            value={animations ? 'on' : 'off'}
            onChange={(value) => setSetting('animations', value === 'on')}
            options={[
              { value: 'on', label: t('settings.on') },
              { value: 'off', label: t('settings.off') },
            ]}
          />
        </div>
      </Section>

      <Section title={t('settings.mic')} description={t('settings.micPrivacy')} />

      <BackupSection
        notice={notice}
        onNotice={setNotice}
        open={panel === 'restore'}
        onOpen={() => setPanel('restore')}
        onClose={() => setPanel(null)}
      />
      <ResetSection
        notice={notice}
        onNotice={setNotice}
        open={panel === 'reset'}
        onOpen={() => setPanel('reset')}
        onClose={() => setPanel(null)}
      />

      <TileList>
        {/* หน้าแนะนำวิธีเรียน (ที่เห็นตอนเข้าเว็บครั้งแรก) */}
        <Tile to="/welcome" icon={CircleHelp} title={t('settings.howTo')} description={t('settings.howToHint')} />
        <Tile to="/credits" icon={Images} title={t('credits.title')} description={t('credits.subtitle')} />
      </TileList>
    </Page>
  )
}
