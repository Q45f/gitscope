
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LockKeyhole, Mail, LoaderCircle, GitBranch } from 'lucide-react'

// เรียกใช้ Supabase Client ที่มีอยู่แล้ว
import { supabase } from '../services/supabase'

function Login() {
  const navigate = useNavigate()

  // เก็บข้อมูล Email และ Password ที่ผู้ใช้กรอก
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // จัดการสถานะระหว่างกำลังเข้าสู่ระบบ
  const [loading, setLoading] = useState(false)

  // เก็บข้อความแจ้งเตือนเมื่อเกิดข้อผิดพลาด
  const [error, setError] = useState('')

  // ทำงานเมื่อผู้ใช้กดปุ่ม Login
  async function handleLogin(event) {
    event.preventDefault()

    setError('')
    setLoading(true)

    try {
      // ส่ง Email และ Password ไปตรวจสอบกับ Supabase
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      // หากข้อมูลไม่ถูกต้อง ให้แสดงข้อความแจ้งเตือน
      if (error) {
        throw error
      }

      // เมื่อ Login สำเร็จ ให้ไปหน้า Dashboard
      // AuthContext จะรับรู้สถานะ Login โดยอัตโนมัติ
      navigate('/', { replace: true })

    } catch (err) {
      setError(err.message || 'Unable to sign in. Please try again.')

    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">

        {/* โลโก้และชื่อเว็บไซต์ */}
        <Link to="/" className="auth-brand">
          <GitBranch size={28} />
          <span>GitScope</span>
        </Link>

        {/* หัวข้อหน้า Login */}
        <div className="auth-heading">
          <h1>Welcome back</h1>
          <p className="muted">
            Sign in to continue exploring repositories.
          </p>
        </div>

        {/* ฟอร์มเข้าสู่ระบบ */}
        <form className="auth-form" onSubmit={handleLogin}>

          {/* ช่องกรอก Email */}
          <div className="auth-field">
            <label htmlFor="login-email">Email</label>

            <div className="auth-input-wrapper">
              <Mail size={18} />

              <input
                id="login-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* ช่องกรอก Password */}
          <div className="auth-field">
            <label htmlFor="login-password">Password</label>

            <div className="auth-input-wrapper">
              <LockKeyhole size={18} />

              <input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {/* แสดงข้อความเมื่อ Login ไม่สำเร็จ */}
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          {/* ปุ่มเข้าสู่ระบบ */}
          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoaderCircle size={18} className="loading-icon" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>

        </form>

        {/* ลิงก์ไปหน้าสมัครสมาชิก */}
        <p className="auth-switch">
          Don't have an account?{' '}
          <Link to="/register">Create account</Link>
        </p>

      </section>
    </main>
  )
}

export default Login
