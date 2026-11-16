// =========================================================
// SettingsPage — ตั้งค่า
// ขั้นที่ 1: ภาษาของหน้าเว็บ
// ขั้นที่ 2: คำอ่านไทย, คำแปลไทย, เสียงอ่านภาษาอังกฤษ
// ขั้นที่ 21: ความเร็วเสียงเริ่มต้น, เป้าหมายรายวัน, เสียงเอฟเฟกต์, รีเซ็ตความคืบหน้า
// =========================================================
import { useTranslation } from 'react-i18next'
import { CircleHelp, Images } from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'
import { useSpeech } from '../hooks/useSpeech'
import Page from '../components/Page'
import Section from '../components/Section'
import LanguageToggle from '../components/LanguageToggle'
import SegmentedControl from '../components/SegmentedControl'
import SpeakButton from '../components/SpeakButton'
import ComingSoon from '../components/ComingSoon'
import Tile, { TileList } from '../components/Tile'
import styles from './SettingsPage.module.css'

// ประโยคสำหรับลองฟังเสียง (ภาษาที่เจ้าของภาษาพูดจริง)
const VOICE_SAMPLE = "Hey, how's it going? Let's practice some English today."

export default function SettingsPage() {
  const { t } = useTranslation()
  const thaiReading = useSettingsStore((state) => state.thaiReading)
  const thaiTranslation = useSettingsStore((state) => state.thaiTranslation)
  const voiceURI = useSettingsStore((state) => state.voiceURI)
  const setSetting = useSettingsStore((state) => state.setSetting)
  const { supported, voices, activeVoice, usingLocalFallback } = useSpeech()

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

      <Section title={t('settings.mic')} description={t('settings.micPrivacy')} />

      <ComingSoon step={21} />

      <TileList>
        {/* หน้าแนะนำวิธีเรียน (ที่เห็นตอนเข้าเว็บครั้งแรก) */}
        <Tile to="/welcome" icon={CircleHelp} title={t('settings.howTo')} description={t('settings.howToHint')} />
        <Tile to="/credits" icon={Images} title={t('credits.title')} description={t('credits.subtitle')} />
      </TileList>
    </Page>
  )
}
