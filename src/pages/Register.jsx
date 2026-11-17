
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LockKeyhole,
  Mail,
  LoaderCircle,
  GitBranch,
} from 'lucide-react'

// เรียกใช้ Supabase Client ตัวเดิม
import { supabase } from '../services/supabase'

function Register() {
  const navigate = useNavigate()

  // เก็บข้อมูลที่ผู้ใช้กรอกในแบบฟอร์มสมัครสมาชิก
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // จัดการสถานะระหว่างกำลังสมัครสมาชิก
  const [loading, setLoading] = useState(false)

  // เก็บข้อความแจ้งเตือน
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // ทำงานเมื่อผู้ใช้กดปุ่มสมัครสมาชิก
  async function handleRegister(event) {
    event.preventDefault()

    setError('')
    setSuccess('')

    // ตรวจสอบว่ารหัสผ่านทั้งสองช่องตรงกันหรือไม่
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    // ตรวจสอบความยาวรหัสผ่านเบื้องต้น
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    try {
      // ส่งข้อมูลไปสร้างบัญชีผู้ใช้ใน Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })

      if (error) {
        throw error
      }

      // หากเปิดการยืนยัน Email ไว้ จะยังไม่มี Session จนกว่าจะยืนยัน
      if (data.session) {
        // สมัครสำเร็จและมี Session แล้ว ให้ไป Dashboard
        navigate('/', { replace: true })
      } else {
        // แจ้งให้ผู้ใช้ตรวจสอบ Email เพื่อยืนยันบัญชี
        setSuccess(
          'Registration successful! Please check your email to confirm your account.'
        )
      }

    } catch (err) {
      setError(err.message || 'Unable to create your account.')

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

        {/* หัวข้อหน้าสมัครสมาชิก */}
        <div className="auth-heading">
          <h1>Create account</h1>
          <p className="muted">
            Join GitScope and discover open source projects.
          </p>
        </div>

        {/* ฟอร์มสมัครสมาชิก */}
        <form className="auth-form" onSubmit={handleRegister}>

          {/* ช่องกรอก Email */}
          <div className="auth-field">
            <label htmlFor="register-email">Email</label>

            <div className="auth-input-wrapper">
              <Mail size={18} />

              <input
                id="register-email"
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
            <label htmlFor="register-password">Password</label>

            <div className="auth-input-wrapper">
              <LockKeyhole size={18} />

              <input
                id="register-password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
          </div>

          {/* ช่องยืนยัน Password */}
          <div className="auth-field">
            <label htmlFor="confirm-password">Confirm Password</label>

            <div className="auth-input-wrapper">
              <LockKeyhole size={18} />

              <input
                id="confirm-password"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          {/* แสดงข้อความแจ้งเตือนเมื่อเกิดข้อผิดพลาด */}
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          {/* แสดงข้อความเมื่อสมัครสำเร็จแต่ต้องยืนยัน Email */}
          {success && (
            <p className="auth-success" role="status">
              {success}
            </p>
          )}

          {/* ปุ่มสมัครสมาชิก */}
          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoaderCircle size={18} className="loading-icon" />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </button>

        </form>

        {/* ลิงก์กลับไปหน้า Login */}
        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>

      </section>
    </main>
  )
}

export default Register
