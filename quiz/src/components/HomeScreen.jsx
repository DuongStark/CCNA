import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getSources } from '../utils/dataLoader';
import styles from './HomeScreen.module.css';

const COUNT_OPTIONS = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' },
  { value: 'all', label: 'All' },
];

const SOURCE_DESCRIPTIONS_VI = {
  pdf: 'Nguồn PDF Cisco — 6 chủ đề theo blueprint thi chính thức.',
  docx: 'Ngân hàng DOCX — phân loại theo domain thi.',
  odt: 'Bộ đề ODT — Phần 11 đến 16.',
};

export default function HomeScreen({ onStart }) {
  const sources = useMemo(() => getSources(), []);
  const [sourceId, setSourceId] = useState(null);
  const [topicId, setTopicId] = useState(null);
  const [count, setCount] = useState(20);
  const [randomOrder, setRandomOrder] = useState(true);
  const [srsMode, setSrsMode] = useState(false);
  const [scrollMode, setScrollMode] = useState(false);

  const countSegmentRef = useRef(null);
  const countButtonRefs = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const activeSource = sources.find((s) => s.id === sourceId) || null;

  useEffect(() => {
    setTopicId(null);
  }, [sourceId]);

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
      srsMode,
      randomOrder,
      scrollMode,
    });
  };

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1>CCNA Quiz</h1>
        <p className={styles.tagline}>
          Luyện từng câu một. Tiếng Anh trước, dịch tiếng Việt khi cần.
        </p>
      </header>

      <section className={styles.section}>
        <div className={styles.stepHeader}>
          <span className={styles.stepNumber}>1</span>
          <span className={styles.stepTitle}>Chọn nguồn câu hỏi</span>
        </div>
        <div className={styles.cardGrid}>
          {sources.map((s) => {
            const isActive = sourceId === s.id;
            const cls = [styles.sourceCard];
            if (isActive) cls.push(styles.sourceCardActive);
            return (
              <button
                key={s.id}
                type="button"
                className={cls.join(' ')}
                onClick={() => setSourceId(s.id)}
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

      {activeSource && (
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

      {activeSource && topicId && (
        <section className={`${styles.section} ${styles.animated}`}>
          <div className={styles.stepHeader}>
            <span className={styles.stepNumber}>3</span>
            <span className={styles.stepTitle}>Số câu hỏi?</span>
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
              <span className={styles.toggleTitle}>Chế độ SRS</span>
              <span className={styles.toggleHint}>
                Ưu tiên câu sai hoặc đến hạn ôn tập.
              </span>
            </span>
            <span className={styles.switch}>
              <input
                type="checkbox"
                checked={srsMode}
                onChange={(e) => setSrsMode(e.target.checked)}
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
            Bắt đầu
          </button>
        </section>
      )}
    </div>
  );
}
