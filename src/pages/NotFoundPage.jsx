// NotFoundPage — ไม่พบหน้า (ลิงก์ผิด หรือ id ของ Stage/บทเรียน/เกม ไม่มีอยู่จริง)
import { useTranslation } from 'react-i18next'
import { ICONS } from '../utils/icons'
import Page from '../components/Page'
import Button from '../components/Button'

export default function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <Page title={t('notFound.title')} subtitle={t('notFound.text')}>
      <div>
        <Button to="/" icon={ICONS.home}>
          {t('nav.goHome')}
        </Button>
      </div>
    </Page>
  )
}
