import styles from './ResultScreen.module.css';

function percentClass(pct) {
  if (pct >= 80) return styles.percentStrong;
  if (pct < 60) return styles.percentWeak;
  return '';
}

export default function ResultScreen({
  total = 0,
  correctCount = 0,
  wrongAnswers = [],
  onReviewWrong,
  onNewSession,
  onRepeat,
}) {
  const safeTotal = Math.max(total, 0);
  const percent = safeTotal === 0 ? 0 : Math.round((correctCount / safeTotal) * 100);
  const hasWrong = wrongAnswers.length > 0;

  return (
    <div className={styles.screen}>
      <section className={styles.summary} aria-label="Session summary">
        <span className={styles.scoreLabel}>Kết quả</span>
        <span className={styles.score}>
          {correctCount}
          <span aria-hidden="true"> / </span>
          {safeTotal}
        </span>
        <span className={`${styles.percent} ${percentClass(percent)}`}>
          {percent}%
        </span>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          {hasWrong ? `Câu sai (${wrongAnswers.length})` : 'Câu sai'}
        </h2>
        {hasWrong ? (
          <ul className={styles.wrongList}>
            {wrongAnswers.map((w) => {
              const correctLetters = (w.correctAnswer || '').split('').filter(Boolean);
              const explanationExcerpt =
                w.explanation && w.explanation.length > 120
                  ? w.explanation.slice(0, 120).trimEnd() + '…'
                  : w.explanation;
              return (
                <li key={w.id} className={styles.wrongItem}>
                  <span className={styles.questionId}>#{w.id}</span>
                  <p className={styles.questionText}>{w.question}</p>
                  <div className={styles.answerRow}>
                    <span>
                      <span className={styles.answerLabel}>Bạn chọn:</span>
                      <span className={styles.userAnswer}>
                        {w.userAnswer || '—'}
                      </span>
                    </span>
                    <span>
                      <span className={styles.answerLabel}>Đáp án đúng:</span>
                      <span className={styles.correctAnswer}>{w.correctAnswer}</span>
                    </span>
                  </div>
                  {w.options && correctLetters.length > 0 && (
                    <ul className={styles.correctOptions}>
                      {correctLetters.map((letter) =>
                        w.options[letter] ? (
                          <li key={letter} className={styles.correctOptionItem}>
                            <span className={styles.correctOptionLetter}>{letter}:</span>{' '}
                            {w.options[letter]}
                          </li>
                        ) : null
                      )}
                    </ul>
                  )}
                  {explanationExcerpt && (
                    <p className={styles.explanationExcerpt}>{explanationExcerpt}</p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className={styles.empty}>
            Hoàn hảo! Không có câu nào sai. 🎉
          </div>
        )}
      </section>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={onReviewWrong}
          disabled={!hasWrong}
        >
          Ôn lại câu sai
        </button>
        {onRepeat && (
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onRepeat}
          >
            Làm lại
          </button>
        )}
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onNewSession}
        >
          Làm bài mới
        </button>
      </div>
    </div>
  );
}
