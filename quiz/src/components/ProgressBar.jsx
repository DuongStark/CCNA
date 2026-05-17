import styles from './ProgressBar.module.css';

export default function ProgressBar({ current = 0, total = 1 }) {
  const safeTotal = Math.max(total, 1);
  const clamped = Math.min(Math.max(current, 0), safeTotal);
  const percent = (clamped / safeTotal) * 100;
  return (
    <div className={styles.wrapper}>
      <div
        className={styles.track}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeTotal}
        aria-valuenow={clamped}
        aria-label={`${Math.round(percent)}%`}
      >
        <div className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
