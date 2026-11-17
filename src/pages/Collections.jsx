
import { useEffect, useState } from 'react'
import {
  Search,
  Star,
  GitFork,
  ExternalLink,
  Bookmark,
  Trash2,
  LoaderCircle,
} from 'lucide-react'

// ฟังก์ชันติดต่อฐานข้อมูล Supabase
import {
  getFavorites,
  removeFavorite,
} from '../services/favoritesAPI'

// เรียกใช้ระบบแปลภาษา
import { useLanguage } from '../contexts/LanguageContext'

// หน้า Collections: แสดง Repository ที่ผู้ใช้บันทึกไว้ ค้นหาและลบได้
function Collections() {
  // ดึงภาษาปัจจุบันและฟังก์ชันแปลข้อความ
  const { language, t } = useLanguage()

  // ===== State =====
  const [favorites, setFavorites] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingIds, setDeletingIds] = useState([])

  // โหลดรายการโปรดจาก Supabase ครั้งเดียวตอนเปิดหน้า
  useEffect(() => {
    async function loadData() {
      try {
        const data = await getFavorites()
        setFavorites(data)
      } catch (err) {
        console.error('Load collections error:', err)

        // เก็บรหัส Error เพื่อแสดงข้อความตามภาษาที่เลือก
        setError('loadFailed')
      } finally {
        // ไม่ว่าสำเร็จหรือล้มเหลวก็หยุดสถานะ Loading
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // ลบ Repository ออกจากรายการโปรด
  async function handleRemove(repoId) {
    // ป้องกันการกดลบซ้ำ
    if (deletingIds.includes(repoId)) return

    // ใส่ ID ลงรายการที่กำลังลบ เพื่อแสดง Spinner
    setDeletingIds((prev) => [...prev, repoId])
    setError('')

    try {
      await removeFavorite(repoId)

      // ลบสำเร็จ → นำออกจากรายการบนหน้าจอทันที
      setFavorites((prev) =>
        prev.filter((repo) => repo.repo_id !== repoId)
      )
    } catch (err) {
      console.error('Remove favorite error:', err)

      // เก็บรหัส Error เพื่อแสดงข้อความตามภาษาที่เลือก
      setError('removeFailed')
    } finally {
      // ทำรายการเสร็จ → ปลดล็อกปุ่ม
      setDeletingIds((prev) =>
        prev.filter((id) => id !== repoId)
      )
    }
  }

  
// แปลงตัวเลขให้อ่านง่ายตามภาษาที่เลือก
function formatNumber(number = 0) {
  const value = Number(number) || 0

  // ถ้าเลือกภาษาไทย ให้ใช้หน่วยตัวเลขแบบไทยโดยไม่ปัดเศษขึ้น
  if (language === 'th') {

    // แปลงตัวเลขและตัดทศนิยมให้เหลือ 1 ตำแหน่ง
    function formatThaiUnit(divisor, unit) {
      const result = Math.floor(
        (value / divisor) * 10 + Number.EPSILON
      ) / 10

      return `${result.toFixed(1)} ${unit}`
    }

    if (value >= 1000000) {
      return formatThaiUnit(1000000, 'ล้าน')
    }

    if (value >= 100000) {
      return formatThaiUnit(100000, 'แสน')
    }

    if (value >= 10000) {
      return formatThaiUnit(10000, 'หมื่น')
    }

    return new Intl.NumberFormat('th-TH').format(value)
  }

  // ภาษาอังกฤษใช้ K และ M
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

  // กรองรายการตามคำค้นหา
  // ค้นจากชื่อ Repository หรือภาษา โดยไม่สนตัวพิมพ์เล็ก/ใหญ่
  const filteredFavorites = favorites.filter((repo) => {
    const searchText = query.toLowerCase()

    return (
      repo.full_name.toLowerCase().includes(searchText) ||
      (repo.language || '').toLowerCase().includes(searchText)
    )
  })

  return (
    <main className="container explore-page">

      {/* ส่วนหัวของหน้า */}
      <section className="explore-header">
        <p className="eyebrow">
          {t('yourPersonalCollection')}
        </p>

        <h1>{t('myCollections')}</h1>

        <p className="muted">
          {t('collectionsDescription')}
        </p>
      </section>

      {/* การ์ดสรุปจำนวน Repository ที่บันทึกไว้ */}
      <div className="collection-summary">
        <div>
          <span className="muted">
            {t('savedRepositories')}
          </span>

          <h2>{favorites.length}</h2>
        </div>

        <Bookmark size={28} />
      </div>

      {/* ช่องค้นหาในรายการของตัวเอง */}
      <div className="explore-search">
        <Search size={21} />

        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('searchCollectionsPlaceholder')}
        />
      </div>

      {/* แสดงข้อความ Error ถ้ามี */}
      {error && (
        <div className="explore-message error-message">
          <p>
            {error === 'loadFailed'
              ? t('collectionsLoadFailed')
              : t('collectionsRemoveFailed')}
          </p>
        </div>
      )}

      {/* สถานะกำลังโหลด */}
      {loading && (
        <div className="explore-message">
          <LoaderCircle className="loading-icon" size={30} />
          <p>{t('loadingCollections')}</p>
        </div>
      )}

      {/* ยังไม่เคยบันทึก Repository ใดเลย */}
      {!loading && !error && favorites.length === 0 && (
        <div className="explore-message">
          <Bookmark size={36} />

          <h3>{t('emptyCollection')}</h3>

          <p className="muted">
            {t('emptyCollectionDescription')}
          </p>
        </div>
      )}

      {/* มี Repository แต่ไม่ตรงกับคำค้นหา */}
      {!loading &&
        favorites.length > 0 &&
        filteredFavorites.length === 0 && (
          <div className="explore-message">
            <Search size={32} />

            <h3>{t('noCollectionResults')}</h3>

            <p className="muted">
              {t('tryAnotherCollectionSearch')}
            </p>
          </div>
        )}

      {/* รายการการ์ด Repository */}
      {!loading && filteredFavorites.length > 0 && (
        <section className="repository-grid">

          {filteredFavorites.map((repo) => (
            <article
              className="surface repository-card"
              key={repo.repo_id}
            >

              {/* ส่วนหัวการ์ด: ชื่อ Repository + ปุ่มลบ + ลิงก์ GitHub */}
              <div className="repo-card-heading">
                <div>
                  <h2>{repo.full_name}</h2>

                  <p className="muted">
                    {t('savedRepository')}
                  </p>
                </div>

                <div className="repo-card-actions">

                  {/* ปุ่มลบรายการโปรด */}
                  <button
                    type="button"
                    className="bookmark-button saved"
                    disabled={deletingIds.includes(repo.repo_id)}
                    onClick={() => handleRemove(repo.repo_id)}
                    title={t('removeFromCollections')}
                    aria-label={t('removeFromCollections')}
                  >
                    {deletingIds.includes(repo.repo_id) ? (
                      <LoaderCircle
                        size={18}
                        className="loading-icon"
                      />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>

                  {/* ลิงก์เปิด Repository บน GitHub ในแท็บใหม่ */}
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${repo.full_name} on GitHub`}
                  >
                    <ExternalLink size={18} />
                  </a>

                </div>
              </div>

              {/* คำอธิบาย Repository */}
              <p className="repo-description">
                {repo.description || t('collectionsNoDescription')}
              </p>

              {/* ส่วนท้ายการ์ด: Stars, Forks และภาษาหลัก */}
              <div className="repo-card-footer">

                <div className="repo-stats">
                  <span>
                    <Star size={16} />
                    {formatNumber(repo.stars)}
                  </span>

                  <span>
                    <GitFork size={16} />
                    {formatNumber(repo.forks)}
                  </span>
                </div>

                <span className="repo-language">
                  {repo.language || t('otherLanguage')}
                </span>

              </div>

            </article>
          ))}

        </section>
      )}

    </main>
  )
}

export default Collections
