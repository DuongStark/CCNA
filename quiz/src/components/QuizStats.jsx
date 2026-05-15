import styles from './QuizStats.module.css';

export default function QuizStats({ score, streak, total, currentIndex, results }) {
  const answered = results ? results.filter((r) => r !== null).length : 0;
  const remaining = Math.max(0, total - answered);
  const scoreLabel = `${score}/${answered || 0}`;

  return (
    <aside className={styles.card} aria-label="Quiz stats">
      <div className={styles.stat}>
        <div className={styles.label}>Score</div>
        <div className={styles.value}>{scoreLabel}</div>
      </div>
      <div className={styles.stat}>
        <div className={styles.label}>Streak</div>
        <div className={styles.value}>
          <span className={styles.icon} aria-hidden="true">★</span> {streak}
        </div>
      </div>
      <div className={styles.stat}>
        <div className={styles.label}>Còn lại</div>
        <div className={styles.value}>{remaining}</div>
      </div>
    </aside>
  );
}
