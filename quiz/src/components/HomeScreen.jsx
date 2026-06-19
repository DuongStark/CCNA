import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getSources, fetchTopicCounts } from '../utils/dataLoader';
import styles from './HomeScreen.module.css';

const COUNT_OPTIONS = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' },
  { value: 'all', label: 'All' },
];

const SOURCE_DESCRIPTIONS_VI = {
  pdf: 'Cisco PDF — 6 chủ đề theo blueprint thi chính thức.',
  docx: 'Ngân hàng Part 5–10 — phân loại theo domain thi.',
  odt: 'Ngân hàng Part 11–16 — bài tập bổ sung.',
};

export default function HomeScreen({ onStart, isDark, toggleTheme, bookmarkCount = 0 }) {
  const sources = useMemo(() => getSources(), []);
  const [sourceId, setSourceId] = useState(null);
  const [topicId, setTopicId] = useState(null);
  const [count, setCount] = useState(20);
  const [randomOrder, setRandomOrder] = useState(true);
  const [shuffleOpts, setShuffleOpts] = useState(false);
  const [scrollMode, setScrollMode] = useState(false);
  const [topicCounts, setTopicCounts] = useState({});

  const countSegmentRef = useRef(null);
  const countButtonRefs = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Merge fetched counts into sources
  const sourcesWithCounts = useMemo(() => {
    if (!Object.keys(topicCounts).length) return sources;
    return sources.map((s) => {
      const counts = topicCounts[s.id] || {};
      const topics = s.topics.map((t) => ({ ...t, count: counts[t.id] || 0 }));
      const totalCount = topics.reduce((sum, t) => sum + t.count, 0);
      return { ...s, topics, totalCount };
    });
  }, [sources, topicCounts]);

  const totalQuestions = sourcesWithCounts.reduce((sum, s) => sum + s.totalCount, 0);

  const activeSource = sourcesWithCounts.find((s) => s.id === sourceId) || null;
  const isBookmarksMode = sourceId === 'bookmarks';

  // Fetch actual question counts from JSON files on mount
  useEffect(() => {
    const load = async () => {
      const allCounts = {};
      for (const s of sources) {
        allCounts[s.id] = await fetchTopicCounts(s.id);
      }
      setTopicCounts(allCounts);
    };
    load();
  }, [sources]);

  useEffect(() => {
    if (!isBookmarksMode) {
      setTopicId(null);
    }
  }, [sourceId, isBookmarksMode]);

  // Auto-select "all" topic when bookmarks mode is activated
  useEffect(() => {
    if (isBookmarksMode) {
      setTopicId('all');
    }
  }, [isBookmarksMode]);

  useLayoutEffect(() => {
    const container = countSegmentRef.current;
    const activeBtn = countButtonRefs.current[String(count)];
    if (!container || !activeBtn) return;
    const containerRect = container.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    setIndicatorStyle({
      left: btnRect.left - containerRect.left,
      width: btnRect.width,
    });
  }, [count, sourceId, topicId]);

  const canStart = Boolean(sourceId && topicId && count);

  const handleStart = () => {
    if (!canStart) return;
    onStart?.({
      sourceId,
      topicId,
      count: count === 'all' ? null : count,
      randomOrder,
      shuffleOptions: shuffleOpts,
      scrollMode,
    });
  };

  const handleExam = () => {
    onStart?.({
      examMode: true,
    });
  };

  const showStep2 = activeSource && !isBookmarksMode;
  const showStep3 = isBookmarksMode || (activeSource && topicId);

  return (
    <div className={styles.screen}>
      <button
        type="button"
        className={styles.themeToggle}
        onClick={toggleTheme}
        aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
        title={isDark ? 'Giao diện sáng' : 'Giao diện tối'}
      >
        {isDark ? (
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="3" />
            <path d="M8 1.5v1M8 13.5v1M1.5 8h1M13.5 8h1M3.4 3.4l.7.7M11.9 11.9l.7.7M3.4 12.6l.7-.7M11.9 4.1l.7-.7" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 9.5A5.5 5.5 0 016.5 3 5.5 5.5 0 1013 9.5z" />
          </svg>
        )}
      </button>
      <header className={styles.header}>
        <div className={styles.heroIcon}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="6" fill="currentColor"/>
            <circle cx="10" cy="12" r="3.5" fill="currentColor" opacity="0.5"/>
            <circle cx="38" cy="12" r="3.5" fill="currentColor" opacity="0.5"/>
            <circle cx="10" cy="36" r="3.5" fill="currentColor" opacity="0.5"/>
            <circle cx="38" cy="36" r="3.5" fill="currentColor" opacity="0.5"/>
            <circle cx="24" cy="4" r="2.5" fill="currentColor" opacity="0.35"/>
            <circle cx="24" cy="44" r="2.5" fill="currentColor" opacity="0.35"/>
            <line x1="24" y1="24" x2="10" y2="12" stroke="currentColor" strokeWidth="1.5" opacity="0.25"/>
            <line x1="24" y1="24" x2="38" y2="12" stroke="currentColor" strokeWidth="1.5" opacity="0.25"/>
            <line x1="24" y1="24" x2="10" y2="36" stroke="currentColor" strokeWidth="1.5" opacity="0.25"/>
            <line x1="24" y1="24" x2="38" y2="36" stroke="currentColor" strokeWidth="1.5" opacity="0.25"/>
            <line x1="24" y1="24" x2="24" y2="4" stroke="currentColor" strokeWidth="1" opacity="0.15"/>
            <line x1="24" y1="24" x2="24" y2="44" stroke="currentColor" strokeWidth="1" opacity="0.15"/>
          </svg>
        </div>
        <h1>CCNA Quiz</h1>
        <p className={styles.tagline}>
          {totalQuestions > 0 ? `${totalQuestions.toLocaleString()} questions` : 'Loading…'} &middot; Spaced repetition &middot; Vietnamese translations
        </p>
      </header>

      {totalQuestions > 0 && (
        <button type="button" className={styles.examButton} onClick={handleExam}>
          <span className={styles.examIcon}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="6.5" />
              <path d="M8 4.5v4l2.5 1.5" />
            </svg>
          </span>
          <span className={styles.examLabel}>Thi thử</span>
          <span className={styles.examMeta}>90 câu · 120 phút</span>
        </button>
      )}

      <section className={styles.section}>
        <div className={styles.stepHeader}>
          <span className={styles.stepNumber}>1</span>
          <span className={styles.stepTitle}>Chọn nguồn câu hỏi</span>
        </div>

        <div className={styles.cardGrid}>
          {bookmarkCount > 0 && (() => {
            const isActive = isBookmarksMode;
            const cls = [styles.sourceCard];
            if (isActive) cls.push(styles.sourceCardActive);
            return (
              <button
                key="bookmarks"
                type="button"
                className={cls.join(' ')}
                onClick={() => setSourceId(isActive ? null : 'bookmarks')}
                aria-pressed={isActive}
              >
                <span className={styles.sourceLabel}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-2px', marginRight: 6 }}>
                    <path d="M8 2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.3 4.4 13.1l.7-4L2.2 6.3l4-.6z" />
                  </svg>
                  Đã đánh dấu
                </span>
                <span className={styles.sourceDescription}>Ôn lại các câu bạn đã gắn sao từ tất cả nguồn.</span>
                <span className={styles.sourceCountBadge}>
                  {bookmarkCount} câu hỏi
                </span>
              </button>
            );
          })()}
          {sourcesWithCounts.map((s) => {
            const isActive = sourceId === s.id;
            const cls = [styles.sourceCard];
            if (isActive) cls.push(styles.sourceCardActive);
            return (
              <button
                key={s.id}
                type="button"
                className={cls.join(' ')}
                onClick={() => setSourceId(isActive ? null : s.id)}
                aria-pressed={isActive}
              >
                <span className={styles.sourceLabel}>{s.label}</span>
                <span className={styles.sourceDescription}>{SOURCE_DESCRIPTIONS_VI[s.id] || s.description}</span>
                <span className={styles.sourceCountBadge}>
                  {s.totalCount} câu hỏi
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {showStep2 && (
        <section key={sourceId} className={`${styles.section} ${styles.animated}`}>
          <div className={styles.stepHeader}>
            <span className={styles.stepNumber}>2</span>
            <span className={styles.stepTitle}>Chọn chủ đề</span>
          </div>
          <p className={styles.stepHint}>Chọn một chủ đề để luyện tập</p>
          <div className={styles.topicGroup}>
            {(() => {
              const isActive = topicId === 'all';
              const cls = [styles.topicButton];
              if (isActive) cls.push(styles.topicButtonActive);
              return (
                <button
                  key="all"
                  type="button"
                  className={cls.join(' ')}
                  onClick={() => setTopicId('all')}
                  aria-pressed={isActive}
                  style={{ animationDelay: '0ms' }}
                >
                  Tất cả chủ đề
                  <span className={styles.topicCount}>
                    {' · '}
                    {activeSource.totalCount}
                  </span>
                </button>
              );
            })()}
            {activeSource.topics.map((t, i) => {
              const isActive = topicId === t.id;
              const cls = [styles.topicButton];
              if (isActive) cls.push(styles.topicButtonActive);
              return (
                <button
                  key={t.id}
                  type="button"
                  className={cls.join(' ')}
                  onClick={() => setTopicId(t.id)}
                  aria-pressed={isActive}
                  style={{ animationDelay: `${(i + 1) * 40}ms` }}
                >
                  {t.label}
                  <span className={styles.topicCount}>
                    {' · '}
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {showStep3 && (
        <section className={`${styles.section} ${styles.animated}`}>
          <div className={styles.stepHeader}>
            <span className={styles.stepNumber}>{isBookmarksMode ? 2 : 3}</span>
            <span className={styles.stepTitle}>
              {isBookmarksMode ? 'Ôn tập câu đã đánh dấu' : 'Số câu hỏi?'}
            </span>
          </div>
          <div className={styles.countSegment} ref={countSegmentRef}>
            <span
              className={styles.countIndicator}
              style={{
                transform: `translateX(${indicatorStyle.left}px)`,
                width: `${indicatorStyle.width}px`,
              }}
              aria-hidden="true"
            />
            {COUNT_OPTIONS.map((opt) => {
              const isActive = count === opt.value;
              const cls = [styles.countButton];
              if (isActive) cls.push(styles.countButtonActive);
              return (
                <button
                  key={String(opt.value)}
                  ref={(el) => {
                    countButtonRefs.current[String(opt.value)] = el;
                  }}
                  type="button"
                  className={cls.join(' ')}
                  onClick={() => setCount(opt.value)}
                  aria-pressed={isActive}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <label className={styles.toggleRow}>
            <span className={styles.toggleLabel}>
              <span className={styles.toggleTitle}>Thứ tự ngẫu nhiên</span>
              <span className={styles.toggleHint}>Tắt để làm theo thứ tự gốc.</span>
            </span>
            <span className={styles.switch}>
              <input
                type="checkbox"
                checked={randomOrder}
                onChange={(e) => setRandomOrder(e.target.checked)}
              />
              <span className={styles.switchSlider} aria-hidden="true" />
            </span>
          </label>

          <label className={styles.toggleRow}>
            <span className={styles.toggleLabel}>
              <span className={styles.toggleTitle}>Đảo vị trí đáp án</span>
              <span className={styles.toggleHint}>Xáo trộn thứ tự A/B/C/D mỗi câu.</span>
            </span>
            <span className={styles.switch}>
              <input
                type="checkbox"
                checked={shuffleOpts}
                onChange={(e) => setShuffleOpts(e.target.checked)}
              />
              <span className={styles.switchSlider} aria-hidden="true" />
            </span>
          </label>

          <div className={styles.viewModeRow}>
            <button
              type="button"
              className={`${styles.viewModeBtn} ${!scrollMode ? styles.viewModeBtnActive : ''}`}
              onClick={() => setScrollMode(false)}
              aria-pressed={!scrollMode}
            >
              Từng câu
            </button>
            <button
              type="button"
              className={`${styles.viewModeBtn} ${scrollMode ? styles.viewModeBtnActive : ''}`}
              onClick={() => setScrollMode(true)}
              aria-pressed={scrollMode}
            >
              Cuộn toàn bộ
            </button>
          </div>

          <button
            type="button"
            className={styles.startButton}
            onClick={handleStart}
            disabled={!canStart}
          >
            {isBookmarksMode ? 'Ôn tập' : 'Bắt đầu'}
          </button>
        </section>
      )}
    </div>
  );
}
