import { useMemo, useRef, useState } from 'react';
import { splitIntoSegments } from '../utils/cliUtils';
import ExhibitImage from './ExhibitImage';
import BookmarkButton from './BookmarkButton';
import styles from './ScrollScreen.module.css';

function renderMarkdown(text) {
  return (text || '').split('\n').filter(l => l.trim()).map((line, i) => {
    const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      if (part.startsWith('`') && part.endsWith('`'))
        return <code key={j}>{part.slice(1, -1)}</code>;
      return part;
    });
    return <p key={i}>{parts}</p>;
  });
}

function OptionItem({ letter, text, textVi, isCorrect, revealed, showVi }) {
  const cls = [styles.option];
  if (revealed && isCorrect) cls.push(styles.optionCorrect);

  const renderText = (t) => {
    if (!t) return null;
    return t.split('\n').map((line, i, arr) => (
      <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
    ));
  };

  return (
    <div className={cls.join(' ')}>
      <span className={`${styles.optionBadge} ${revealed && isCorrect ? styles.optionBadgeCorrect : ''}`}>
        {letter}
      </span>
      <span className={styles.optionBody}>
        {renderText(text)}
        {showVi && textVi && (
          <span className={styles.optionVi}>{textVi}</span>
        )}
      </span>
    </div>
  );
}

function QuestionCard({ question, index, sourceId, revealAll, isBookmarked, onToggleBookmark }) {
  const [revealed, setRevealed] = useState(false);
  const [showVi, setShowVi] = useState(false);

  const isRevealed = revealAll || revealed;
  const effectiveSourceId = question._source || sourceId;

  const correctLetters = new Set(
    typeof question.answer === 'string'
      ? question.answer.split('')
      : question.answer
  );

  const options = Object.entries(question.options || {});
  const optionsVi = question.options_vi || {};
  const isMultiple = correctLetters.size > 1;
  const hasTranslation = !!(question.question_vi || Object.keys(optionsVi).length > 0);

  // image folder logic (mirrors dataLoader)
  const getImageSrc = (filename) => {
    if (!filename) return null;
    const folder = question.imageFolder || '';
    if (effectiveSourceId === 'pdf') {
      return `${import.meta.env.BASE_URL}images/pdf/${folder}/${filename}`.replace(/\/+/g, '/');
    }
    if (effectiveSourceId === 'docx') {
      return `${import.meta.env.BASE_URL}images/docx/${folder}/${filename}`.replace(/\/+/g, '/');
    }
    if (effectiveSourceId === 'odt') {
      return `${import.meta.env.BASE_URL}images/odt/${folder}/${filename}`.replace(/\/+/g, '/');
    }
    return null;
  };

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.index}>{index + 1}</span>
        <span className={styles.questionId}>#{question.id}</span>
        {isMultiple && (
          <span className={styles.multipleBadge}>Chọn {correctLetters.size} đáp án</span>
        )}
        {onToggleBookmark && (
          <BookmarkButton
            isBookmarked={isBookmarked}
            onClick={() => onToggleBookmark(question._uid || question.id)}
          />
        )}
      </div>

      {(question.question_images || []).map((img, i) => {
        const src = getImageSrc(img);
        return src ? <ExhibitImage key={i} src={src} alt={`Hình minh họa ${i + 1}`} /> : null;
      })}

      <div className={styles.questionText}>
        {splitIntoSegments(question.question).map((seg, i) =>
          seg.kind === 'cli' ? (
            <pre key={i} className="code-block"><code>{seg.text}</code></pre>
          ) : (
            <p key={i}>{seg.text}</p>
          )
        )}
      </div>

      {hasTranslation && (
        <button
          type="button"
          className={styles.translateBtn}
          onClick={() => setShowVi((v) => !v)}
        >
          {showVi ? 'Ẩn tiếng Việt' : 'Dịch tiếng Việt'}
        </button>
      )}
      {showVi && question.question_vi && (
        <p className={styles.questionVi}>{question.question_vi}</p>
      )}

      <div className={styles.options}>
        {options.map(([letter, text]) => (
          <OptionItem
            key={letter}
            letter={letter}
            text={text}
            textVi={optionsVi[letter]}
            isCorrect={correctLetters.has(letter)}
            revealed={isRevealed}
            showVi={showVi}
          />
        ))}
      </div>

      {!revealAll && !revealed && (
        <button
          type="button"
          className={styles.revealBtn}
          onClick={() => setRevealed(true)}
        >
          Xem đáp án
        </button>
      )}
      {!revealAll && revealed && question.explanation && (
        <div className={styles.explanation}>
          <span className={styles.explanationLabel}>Giải thích</span>
          <div className={styles.explanationText}>
            {renderMarkdown(question.explanation)}
          </div>
        </div>
      )}
    </article>
  );
}

export default function ScrollScreen({ questions, sourceId, onExit, bookmarks, onToggleBookmark, onFilterBookmarks, isDark, toggleTheme }) {
  const [revealAll, setRevealAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const searchRef = useRef(null);

  const filteredQuestions = useMemo(() => {
    let result = questions;

    // Filter by bookmarks
    if (showBookmarksOnly && bookmarks) {
      result = result.filter((q) => {
        const uid = q._uid || q.id;
        return !!bookmarks[uid];
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((question) => {
        // Search by ID
        if (question.id && String(question.id).toLowerCase().includes(q)) return true;
        // Search in question text
        if (question.question && question.question.toLowerCase().includes(q)) return true;
        // Search in Vietnamese translation
        if (question.question_vi && question.question_vi.toLowerCase().includes(q)) return true;
        // Search in options
        if (question.options) {
          for (const text of Object.values(question.options)) {
            if (text && String(text).toLowerCase().includes(q)) return true;
          }
        }
        // Search in explanation
        if (question.explanation && question.explanation.toLowerCase().includes(q)) return true;
        return false;
      });
    }

    return result;
  }, [questions, searchQuery, showBookmarksOnly, bookmarks]);

  const handleOpenSearch = () => {
    setSearchOpen(true);
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    searchRef.current?.focus();
  };

  const handleCloseSearch = () => {
    setSearchQuery('');
    setSearchOpen(false);
  };

  const isFiltered = searchQuery.trim().length > 0;

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button type="button" className={styles.exitBtn} onClick={onExit}>
          ← Thoát
        </button>
        <div className={styles.headerControls}>
          {searchOpen ? (
            <div className={styles.searchBar}>
              <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7" cy="7" r="4.5" />
                <path d="M10.5 10.5L13.5 13.5" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                className={styles.searchInput}
                placeholder="Tìm theo ID, nội dung, keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') handleCloseSearch();
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  className={styles.searchClear}
                  onClick={handleClearSearch}
                  aria-label="Xóa tìm kiếm"
                >
                  ×
                </button>
              )}
              <button
                type="button"
                className={styles.searchClose}
                onClick={handleCloseSearch}
                aria-label="Đóng tìm kiếm"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.searchToggle}
              onClick={handleOpenSearch}
              aria-label="Tìm kiếm"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7" cy="7" r="4.5" />
                <path d="M10.5 10.5L13.5 13.5" />
              </svg>
            </button>
          )}
          <button
            type="button"
            className={`${styles.toggleBtn} ${revealAll ? styles.toggleBtnActive : ''}`}
            onClick={() => setRevealAll((v) => !v)}
          >
            <span className={styles.toggleDot} aria-hidden="true" />
            Hiện đáp án
          </button>
          {bookmarks && Object.keys(bookmarks).length > 0 && (
            <button
              type="button"
              className={`${styles.toggleBtn} ${showBookmarksOnly ? styles.toggleBtnActive : ''}`}
              onClick={() => setShowBookmarksOnly((v) => !v)}
              title={showBookmarksOnly ? 'Hiện tất cả câu hỏi' : 'Chỉ hiện câu đã đánh dấu'}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill={showBookmarksOnly ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.3 4.4 13.1l.7-4L2.2 6.3l4-.6z" />
              </svg>
              <span style={{ marginLeft: 4 }}>
                {showBookmarksOnly ? 'Đang lọc' : 'Đã đánh dấu'} ({Object.keys(bookmarks).length})
              </span>
            </button>
          )}
          <span className={styles.total}>
            {isFiltered ? `${filteredQuestions.length}/${questions.length}` : questions.length} câu
          </span>
          {toggleTheme && (
            <button
              type="button"
              className={styles.themeBtn}
              onClick={toggleTheme}
              aria-label={isDark ? 'Giao diện sáng' : 'Giao diện tối'}
            >
              {isDark ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="8" r="3" />
                  <path d="M8 1.5v1M8 13.5v1M1.5 8h1M13.5 8h1M3.4 3.4l.7.7M11.9 11.9l.7.7M3.4 12.6l.7-.7M11.9 4.1l.7-.7" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 9.5A5.5 5.5 0 016.5 3 5.5 5.5 0 1013 9.5z" />
                </svg>
              )}
            </button>
          )}
        </div>
      </header>

      {isFiltered && filteredQuestions.length === 0 && (
        <div className={styles.emptyState}>
          <p>Không tìm thấy câu hỏi nào cho "<strong>{searchQuery}</strong>"</p>
          <button type="button" className={styles.emptyBtn} onClick={handleClearSearch}>
            Xóa bộ lọc
          </button>
        </div>
      )}

      <div className={styles.list}>
        {filteredQuestions.map((q, i) => (
          <QuestionCard
            key={q._uid || q.id || i}
            question={q}
            index={i}
            sourceId={sourceId}
            revealAll={revealAll}
            isBookmarked={bookmarks ? !!bookmarks[q._uid || q.id] : false}
            onToggleBookmark={onToggleBookmark}
          />
        ))}
      </div>
    </div>
  );
}
