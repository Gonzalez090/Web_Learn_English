// =========================================================
// BottomNav — แถบเมนูล่าง 4 แท็บ (แบบแอปมือถือ)
//   หน้าแรก / เรียน / มินิเกม / โปรไฟล์
// แต่ละแท็บ "สว่าง" เมื่ออยู่ในหน้าที่เป็นของแท็บนั้น (ดู prefixes)
// =========================================================
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ICONS } from '../../utils/icons'
import styles from './BottomNav.module.css'

const TABS = [
  {
    to: '/',
    icon: ICONS.home,
    labelKey: 'nav.home',
    prefixes: ['/place', '/talk', '/plan', '/review', '/phrases', '/sounds', '/settings', '/credits', '/dev'],
  },
  { to: '/learn', icon: ICONS.learn, labelKey: 'nav.learn', prefixes: ['/learn', '/lesson'] },
  { to: '/games', icon: ICONS.games, labelKey: 'nav.games', prefixes: ['/games'] },
  { to: '/profile', icon: ICONS.profile, labelKey: 'nav.profile', prefixes: ['/profile'] },
]

// ตรวจว่า pathname อยู่ใต้ prefix นั้นหรือไม่ เช่น '/learn/2' อยู่ใต้ '/learn'
const isUnder = (pathname, prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)

export default function BottomNav() {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  return (
    <nav className={styles.nav} aria-label={t('nav.mainMenu')}>
      <ul className={styles.list}>
        {TABS.map((tab) => {
          const active = pathname === tab.to || tab.prefixes.some((prefix) => isUnder(pathname, prefix))
          const Icon = tab.icon
          return (
            <li key={tab.to}>
              <Link
                to={tab.to}
                className={active ? `${styles.link} ${styles.active}` : styles.link}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className={styles.icon} aria-hidden="true" />
                <span>{t(tab.labelKey)}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
