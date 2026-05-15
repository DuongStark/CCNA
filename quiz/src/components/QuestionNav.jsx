import { useEffect, useRef } from 'react';
import styles from './QuestionNav.module.css';

export default function QuestionNav({ total, currentIndex, results, onJump }) {
  const itemRefs = useRef({});

  useEffect(() => {
    itemRefs.current[currentIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentIndex]);

  let correctCount = 0;
  let incorrectCount = 0;
  for (let i = 0; i < total; i++) {
    if (results?.[i] === 'correct') correctCount++;
    else if (results?.[i] === 'incorrect') incorrectCount++;
  }
  const pendingCount = total - correctCount - incorrectCount;

  const items = [];
  for (let i = 0; i < total; i++) {
    const status = results?.[i] ?? null;
    const isCurrent = i === currentIndex;
    let cls = styles.item + ' ' + styles.itemDefault;
    if (status === 'correct') cls = styles.item + ' ' + styles.itemCorrect;
    else if (status === 'incorrect') cls = styles.item + ' ' + styles.itemIncorrect;
    if (isCurrent) cls += ' ' + styles.itemCurrent;

    items.push(
      <button
        key={i}
        ref={(el) => { itemRefs.current[i] = el; }}
        type="button"
        className={cls}
        onClick={() => onJump?.(i)}
        aria-label={`Câu ${i + 1}${status ? ` (${status === 'correct' ? 'đúng' : 'sai'})` : ''}`}
        aria-current={isCurrent ? 'true' : undefined}
      >
        {i + 1}
      </button>
    );
  }

  return (
    <nav className={styles.nav} aria-label="Question navigator">
      <div className={styles.header}>
        <span className={styles.headerTitle}>Câu hỏi</span>
        <span className={styles.headerCount}>{currentIndex + 1}/{total}</span>
      </div>
      <div className={styles.statsRow}>
        <span className={styles.statCorrect}>✓ {correctCount}</span>
        <span className={styles.statIncorrect}>✗ {incorrectCount}</span>
        <span className={styles.statPending}>○ {pendingCount}</span>
      </div>
      <div className={styles.grid}>{items}</div>
    </nav>
  );
}
