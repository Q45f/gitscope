
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  Search,
  Star,
  GitFork,
  ExternalLink,
  LoaderCircle,
  Bookmark,
} from 'lucide-react'

// ฟังก์ชันค้นหา repo จาก GitHub API
import { searchRepositories } from '../services/githubAPI'

// ฟังก์ชันจัดการรายการโปรดใน Supabase
import {
  getFavorites,
  addFavorite,
  removeFavorite,
} from '../services/favoritesAPI'

// เรียกใช้ระบบแปลภาษา
import { useLanguage } from '../contexts/LanguageContext'

// รายการคำแนะนำสำหรับช่วยผู้ใช้ค้นหา Repository
const SEARCH_SUGGESTIONS = [
  'Python',
  'PHP',
  'PostgreSQL',
  'PostgreSQL database',
  'pg',
  'React',
  'React Native',
  'Next.js',
  'Node.js',
  'JavaScript',
  'TypeScript',
  'Java',
  'C++',
  'C#',
  'Go',
  'Rust',
  'Machine Learning',
  'Artificial Intelligence',
]

// หน้า Explore: ค้นหา repo, กรองภาษา, เรียงลำดับ และบันทึกรายการโปรด
function Explore() {
  const navigate = useNavigate()

  // ดึงภาษาปัจจุบันและฟังก์ชันแปลข้อความ
  const { language, t } = useLanguage()

  // ===== State การค้นหา =====
  const [query, setQuery] = useState('')
  const [repositories, setRepositories] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // ===== State ตัวกรองและการเรียงลำดับ =====
  const [languageFilter, setLanguageFilter] = useState('all')
  const [sort, setSort] = useState('stars')

  // ===== State สถานะของ UI =====
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  // ===== State รายการโปรด =====
  const [savedIds, setSavedIds] = useState([])
  const [savingIds, setSavingIds] = useState([])
  const [favoriteError, setFavoriteError] = useState('')

  // โหลดรายการโปรดจาก Supabase ตอนเปิดหน้า
  useEffect(() => {
    async function loadFavorites() {
      try {
        const data = await getFavorites()

        // แปลง repo_id เป็นตัวเลขเพื่อให้เทียบกับ repo.id ได้
        setSavedIds(data.map((item) => Number(item.repo_id)))
      } catch (error) {
        console.error('Failed to load favorites:', error.message)
      }
    }

    loadFavorites()
  }, [])

  // กดปุ่ม Bookmark เพื่อเพิ่มหรือลบรายการโปรด
  async function handleToggleFavorite(event, repo) {
    // ป้องกันไม่ให้คลิกปุ่มแล้วเปิดหน้ารายละเอียด repo
    event.stopPropagation()

    // ป้องกันการกดซ้ำระหว่างกำลังบันทึก
    if (savingIds.includes(repo.id)) {
      return
    }

    setFavoriteError('')
    setSavingIds((prev) => [...prev, repo.id])

    try {
      if (savedIds.includes(repo.id)) {
        // ลบออกจากรายการโปรด
        await removeFavorite(repo.id)

        setSavedIds((prev) =>
          prev.filter((id) => id !== repo.id)
        )
      } else {
        // เพิ่มเข้ารายการโปรด
        await addFavorite(repo)

        setSavedIds((prev) =>
          prev.includes(repo.id)
            ? prev
            : [...prev, repo.id]
        )
      }
    } catch (error) {
      console.error('Favorite error:', error)

      setFavoriteError(
        error.message || t('favoriteUpdateError')
      )
    } finally {
      // ทำรายการเสร็จ ปลดล็อกปุ่ม
      setSavingIds((prev) =>
        prev.filter((id) => id !== repo.id)
      )
    }
  }

  // กรองคำแนะนำให้ตรงกับข้อความที่ผู้ใช้กำลังพิมพ์
  const filteredSuggestions = SEARCH_SUGGESTIONS.filter((suggestion) =>
    suggestion.toLowerCase().startsWith(query.trim().toLowerCase())
  ).slice(0, 6)

  // ค้นหา Repository จาก GitHub API
  async function performSearch(nextSort = sort, searchQuery = query) {
    // ต้องมีคำค้นหาก่อน
    if (!searchQuery.trim()) {
      setError(t('enterSearchKeyword'))
      return
    }

    setLoading(true)
    setError('')
    setHasSearched(true)
    setLanguageFilter('all')

    try {
      const data = await searchRepositories({
        query: searchQuery.trim(),
        sort: nextSort,
        order: 'desc',
        page: 1,
        perPage: 30,
      })

      setRepositories(data.items)
      setTotalCount(data.totalCount)
    } catch (err) {
      // ล้มเหลว → ล้างผลลัพธ์และแสดง error
      setRepositories([])
      setTotalCount(0)
      setError(err.message || t('searchFailed'))
    } finally {
      setLoading(false)
    }
  }

  // ตอนกด Enter หรือปุ่ม Search
  function handleSearch(event) {
    event.preventDefault()
    performSearch(sort)
  }

  // กรองผลลัพธ์ตามภาษาที่เลือก
  const filteredRepositories = repositories.filter((repo) => {
    if (languageFilter === 'all') {
      return true
    }

    return repo.language === languageFilter
  })

  // รวบรวมรายชื่อภาษาที่มีในผลลัพธ์และเรียง A-Z
  const availableLanguages = [
    ...new Set(
      repositories
        .map((repo) => repo.language)
        .filter(Boolean)
    ),
  ].sort()

  // แปลงตัวเลขให้อ่านง่าย เช่น 12500 → 12.5K
  function formatNumber(number) {
    return new Intl.NumberFormat(
      language === 'th' ? 'th-TH' : 'en-US',
      {
        notation: 'compact',
        maximumFractionDigits: 1,
      }
    ).format(number || 0)
  }

  return (
    <main className="container explore-page">

      {/* ส่วนหัวของหน้า */}
      <section className="explore-header">
        <p className="eyebrow">
          DISCOVER OPEN SOURCE
        </p>

        <h1>{t('exploreRepositoriesTitle')}</h1>

        <p className="muted">
          {t('exploreDescription')}
        </p>
      </section>

      {/* กล่องค้นหาพร้อมระบบแนะนำคำค้นหา */}
      <div
        className="explore-search-container"
        onBlur={(event) => {
          // ซ่อนคำแนะนำเมื่อผู้ใช้ออกจากกล่องค้นหา
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setShowSuggestions(false)
          }
        }}
      >
        <form
          className="explore-search"
          onSubmit={(event) => {
            handleSearch(event)
            setShowSuggestions(false)
          }}
        >
          <Search size={21} />

          <input
            type="text"
            value={query}
            onFocus={() => setShowSuggestions(true)}
            onChange={(event) => {
              setQuery(event.target.value)
              setShowSuggestions(true)
            }}
            placeholder={t('searchPlaceholder')}
            autoComplete="off"
          />

          {/* ระหว่างค้นหาจะปิดปุ่มและเปลี่ยนข้อความ */}
          <button
            className="primary-button"
            type="submit"
            disabled={loading}
          >
            {loading ? t('searching') : t('search')}
          </button>
        </form>

        {/* แสดงรายการคำแนะนำเมื่อมีข้อความและตรงกับคำแนะนำ */}
        {showSuggestions &&
          query.trim() &&
          filteredSuggestions.length > 0 && (
            <div className="search-suggestions">
              {filteredSuggestions.map((suggestion) => (
                <button
                  type="button"
                  className="search-suggestion-item"
                  key={suggestion}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    // เปลี่ยนคำค้นหาเป็นคำที่ผู้ใช้เลือก
                    setQuery(suggestion)

                    // ซ่อนรายการคำแนะนำ
                    setShowSuggestions(false)

                    // เริ่มค้นหาด้วยคำที่เลือกทันที
                    performSearch(sort, suggestion)
                  }}
                >
                  <Search size={16} />
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          )}
      </div>

      {/* แถบตัวกรองและเรียงลำดับ */}
      {hasSearched && (
        <section className="explore-controls">

          {/* กรองตามภาษา */}
          <div className="filter-group">
            <label htmlFor="language-filter">
              {t('languageFilter')}
            </label>

            <select
              id="language-filter"
              value={languageFilter}
              onChange={(event) => {
                setLanguageFilter(event.target.value)
              }}
            >
              <option value="all">
                {t('allLanguages')}
              </option>

              {availableLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* เรียงลำดับตามเกณฑ์ที่เลือก */}
          <div className="filter-group">
            <label htmlFor="sort-filter">
              {t('sortBy')}
            </label>

            <select
              id="sort-filter"
              value={sort}
              onChange={(event) => {
                const nextSort = event.target.value

                setSort(nextSort)

                // ส่งค่า sort ใหม่เข้าไปค้นหาทันที
                if (query.trim()) {
                  performSearch(nextSort)
                }
              }}
            >
              <option value="stars">
                {t('mostStars')}
              </option>

              <option value="forks">
                {t('mostForks')}
              </option>

              <option value="updated">
                {t('recentlyUpdated')}
              </option>
            </select>
          </div>

          {/* จำนวน Repository ที่พบ */}
          <span className="muted result-count">
            {formatNumber(totalCount)} {t('repositoriesFound')}
          </span>

        </section>
      )}

      {/* ข้อความ Error จากการบันทึกหรือลบรายการโปรด */}
      {favoriteError && (
        <div className="explore-message error-message">
          <p>{favoriteError}</p>
        </div>
      )}

      {/* สถานะกำลังค้นหา */}
      {loading && (
        <div className="explore-message">
          <LoaderCircle
            className="loading-icon"
            size={30}
          />

          <p>{t('searchingGitHubRepositories')}</p>
        </div>
      )}

      {/* ข้อความ Error จากการค้นหา */}
      {!loading && error && (
        <div className="explore-message error-message">
          <p>{error}</p>
        </div>
      )}

      {/* ผลการค้นหา */}
      {!loading && !error && hasSearched && (
        <>
          {filteredRepositories.length === 0 ? (
            // ไม่พบ Repository ที่ตรงกับเงื่อนไข
            <div className="explore-message">
              <Search size={32} />

              <h3>{t('noRepositoriesFound')}</h3>

              <p className="muted">
                {t('tryAnotherKeyword')}
              </p>
            </div>
          ) : (
            <section className="repository-grid">
              {filteredRepositories.map((repo) => (
                // การ์ด Repository: คลิกเพื่อไปหน้ารายละเอียด
                <article
                  className="surface repository-card"
                  key={repo.id}
                  onClick={() =>
                    navigate(`/repo/${repo.owner.login}/${repo.name}`)
                  }
                  role="link"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      navigate(`/repo/${repo.owner.login}/${repo.name}`)
                    }
                  }}
                >

                  {/* ส่วนหัวการ์ด: ชื่อและเจ้าของ */}
                  <div className="repo-card-heading">
                    <div>
                      <h2>{repo.full_name}</h2>

                      <p className="muted">
                        {repo.owner.login}
                      </p>
                    </div>

                    {/* ปุ่ม Bookmark และลิงก์ไป GitHub */}
                    <div className="repo-card-actions">

                      {/* ปุ่ม Bookmark */}
                      <button
                        type="button"
                        className={`bookmark-button ${
                          savedIds.includes(repo.id) ? 'saved' : ''
                        }`}
                        disabled={savingIds.includes(repo.id)}
                        onClick={(event) =>
                          handleToggleFavorite(event, repo)
                        }
                        aria-label={
                          savedIds.includes(repo.id)
                            ? t('removeFromFavorites')
                            : t('addToFavorites')
                        }
                        title={
                          savedIds.includes(repo.id)
                            ? t('removeFromFavorites')
                            : t('addToFavorites')
                        }
                      >
                        <Bookmark
                          size={18}
                          fill={
                            savedIds.includes(repo.id)
                              ? 'currentColor'
                              : 'none'
                          }
                        />
                      </button>

                      {/* ลิงก์เปิด GitHub ในแท็บใหม่ */}
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        aria-label={`Open ${repo.full_name} on GitHub`}
                      >
                        <ExternalLink size={18} />
                      </a>
                    </div>
                  </div>

                  {/* คำอธิบาย Repository */}
                  <p className="repo-description">
                    {repo.description || t('noDescription')}
                  </p>

                  {/* สถิติ Stars, Forks และภาษาหลัก */}
                  <div className="repo-card-footer">
                    <div className="repo-stats">
                      <span>
                        <Star size={16} />
                        {formatNumber(repo.stargazers_count)}
                      </span>

                      <span>
                        <GitFork size={16} />
                        {formatNumber(repo.forks_count)}
                      </span>
                    </div>

                    <span className="repo-language">
                      {repo.language || t('other')}
                    </span>
                  </div>
                </article>
              ))}
            </section>
          )}
        </>
      )}

      {/* หน้าจอเริ่มต้นก่อนที่จะค้นหา */}
      {!hasSearched && (
        <div className="explore-message">
          <Bookmark size={34} />

          <h3>{t('findFavoriteProject')}</h3>

          <p className="muted">
            {t('enterKeywordToExplore')}
          </p>
        </div>
      )}

    </main>
  )
}

export default Explore
