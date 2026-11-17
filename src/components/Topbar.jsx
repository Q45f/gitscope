
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  GitBranch,
  Menu,
  UserRound,
  LogOut,
  Languages,
} from 'lucide-react'

import ThemeToggle from './ThemeToggle'

// เรียกใช้ Supabase สำหรับจัดการการออกจากระบบ
import { supabase } from '../services/supabase'

// เรียกใช้ระบบจัดการภาษา
import { useLanguage } from '../contexts/LanguageContext'

// แถบนำทางด้านบน: โลโก้ + เมนู + บัญชีผู้ใช้ + ภาษา + ธีม
function Topbar({ theme, onToggleTheme, user }) {
  const navigate = useNavigate()

  // ดึงภาษาปัจจุบัน ฟังก์ชันสลับภาษา และฟังก์ชันแปลข้อความ
  const { language, toggleLanguage, t } = useLanguage()

  // เก็บสถานะระหว่างกำลังออกจากระบบ
  const [loggingOut, setLoggingOut] = useState(false)

  // NavLink ใช้ตรวจสอบว่าผู้ใช้อยู่หน้าไหน เพื่อกำหนดสีเมนู
  const navClass = ({ isActive }) =>
    isActive ? 'nav-link active' : 'nav-link'

  // ฟังก์ชันสำหรับออกจากระบบ
  async function handleLogout() {
    setLoggingOut(true)

    try {
      // สั่งให้ Supabase ลบ Session ของผู้ใช้
      const { error } = await supabase.auth.signOut()

      // หากเกิดข้อผิดพลาด ให้แจ้งใน Console
      if (error) throw error

      // กลับไปหน้า Login หลังออกจากระบบสำเร็จ
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Logout error:', error.message)
    } finally {
      // คืนสถานะปุ่มหลังทำงานเสร็จ
      setLoggingOut(false)
    }
  }

  return (
    <header className="topbar">
      <div className="container topbar-inner">

        {/* โลโก้เว็บไซต์ */}
        <Link to="/" className="brand">
          <span className="brand-icon">
            <GitBranch size={23} />
          </span>
          <span>GitScope</span>
        </Link>

        {/* เมนูหลักของเว็บไซต์ */}
        <nav className="desktop-nav">
          <NavLink to="/" end className={navClass}>
            {t('dashboard')}
          </NavLink>

          <NavLink to="/explore" className={navClass}>
            {t('explore')}
          </NavLink>

          <NavLink to="/collections" className={navClass}>
            {t('collections')}
          </NavLink>
        </nav>

        {/* ส่วนจัดการบัญชี ภาษา และธีม */}
        <div className="topbar-actions">

          {/* แสดงอีเมลของผู้ใช้ที่ Login อยู่ */}
          <div className="account-info">
            <UserRound size={17} />
            <span className="account-email">
              {user?.email}
            </span>
          </div>

          {/* ปุ่มสลับภาษาไทยและภาษาอังกฤษ */}
          <button
            className="language-toggle"
            onClick={toggleLanguage}
            title={language === 'en' ? 'เปลี่ยนเป็นภาษาไทย' : 'Switch to English'}
            aria-label={language === 'en' ? 'Switch to Thai' : 'Switch to English'}
          >
            <Languages size={17} />
            <span>{language === 'en' ? 'TH' : 'EN'}</span>
          </button>

          {/* ปุ่มสลับ Light / Dark Mode */}
          <ThemeToggle
            theme={theme}
            onToggle={onToggleTheme}
          />

          {/* ปุ่มออกจากระบบ */}
          <button
            className="logout-button"
            onClick={handleLogout}
            disabled={loggingOut}
            title={t('logout')}
          >
            <LogOut size={17} />
            <span>
              {loggingOut ? t('loggingOut') : t('logout')}
            </span>
          </button>

          {/* ปุ่มเมนูสำหรับหน้าจอขนาดเล็ก */}
          <button
            className="mobile-menu"
            aria-label={t('menu')}
            title={t('menu')}
          >
            <Menu size={22} />
          </button>

        </div>
      </div>
    </header>
  )
}

export default Topbar
