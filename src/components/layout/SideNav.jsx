// =========================================================
// SideNav — เมนูซ้ายบนจอกว้าง (≥ 1024px) แทนแถบเมนูล่าง
//   เมนูหลัก 4 แท็บ + "ฝึกเพิ่ม" (แผนวันนี้ ทบทวน คลังวลี คุยสุ่ม ฝึกเสียง) + ตั้งค่าล่างสุด
// =========================================================
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ICONS } from '../../utils/icons'
import styles from './SideNav.module.css'

const MAIN = [
  { to: '/', icon: ICONS.home, labelKey: 'nav.home', prefixes: ['/place'] },
  { to: '/learn', icon: ICONS.learn, labelKey: 'nav.learn', prefixes: ['/learn', '/lesson'] },
  { to: '/games', icon: ICONS.games, labelKey: 'nav.games', prefixes: ['/games'] },
  { to: '/profile', icon: ICONS.profile, labelKey: 'nav.profile', prefixes: ['/profile'] },
]

const PRACTICE = [
  { to: '/plan', icon: ICONS.plan, labelKey: 'plan.title', prefixes: ['/plan'] },
  { to: '/review', icon: ICONS.review, labelKey: 'review.title', prefixes: ['/review'] },
  { to: '/phrases', icon: ICONS.phrases, labelKey: 'home.phrases', prefixes: ['/phrases'] },
  { to: '/talk', icon: ICONS.talk, labelKey: 'home.talk', prefixes: ['/talk'] },
  { to: '/sounds', icon: ICONS.sounds, labelKey: 'home.soundPractice', prefixes: ['/sounds'] },
]

const BOTTOM = [
  { to: '/settings', icon: ICONS.settings, labelKey: 'home.settings', prefixes: ['/settings', '/credits', '/privacy'] },
  // หน้า /dev มีเฉพาะตอนพัฒนา
  ...(import.meta.env.DEV ? [{ to: '/dev', icon: ICONS.dev, labelKey: 'home.dev', prefixes: ['/dev'] }] : []),
]

// อยู่ใต้ prefix นั้นไหม เช่น '/learn/2' อยู่ใต้ '/learn'
const isUnder = (pathname, prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)

function NavList({ items, pathname }) {
  const { t } = useTranslation()
  return (
    <ul className={styles.list}>
      {items.map(({ to, icon: Icon, labelKey, prefixes }) => {
        const active = pathname === to || prefixes.some((prefix) => isUnder(pathname, prefix))
        return (
          <li key={to}>
            <Link
              to={to}
              className={active ? `${styles.link} ${styles.active}` : styles.link}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className={styles.icon} aria-hidden="true" />
              <span>{t(labelKey)}</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export default function SideNav() {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  return (
    <nav className={styles.nav} aria-label={t('nav.mainMenu')}>
      <Link to="/" className={styles.brand}>
        <img src="/favicon.svg" alt="" className={styles.logo} width="38" height="38" />
        <span>{t('app.name')}</span>
      </Link>
      <NavList items={MAIN} pathname={pathname} />
      <div className={styles.group}>
        <p className={styles.label}>{t('nav.practice')}</p>
        <NavList items={PRACTICE} pathname={pathname} />
      </div>
      <div className={styles.bottom}>
        <NavList items={BOTTOM} pathname={pathname} />
      </div>
    </nav>
  )
}
