import styles from './OptionCard.module.css';
import { looksLikeCli, splitOptionSegments } from '../utils/cliUtils';
import { IconCheck, IconX } from '../icons';

export default function OptionCard({
  letter,
  text,
  textVi,
  showVi = false,
  selected = false,
  revealed = false,
  isCorrect = false,
  isIncorrect = false,
  isMultiple = false,
  onSelect,
  disabled = false,
}) {
  const classes = [styles.card];
  if (revealed && isCorrect) classes.push(styles.correct);
  else if (revealed && isIncorrect) classes.push(styles.incorrect);
  else if (selected) classes.push(styles.selected);

  const segments = splitOptionSegments(text);

  const isCliConfig =
    typeof text === 'string' &&
    text.includes('\n') &&
    looksLikeCli(text.split('\n')[0]);
  const showViBlock = !!textVi && !isCliConfig;
  const viClasses = [styles.viBlock];
  if (showVi && showViBlock) viClasses.push(styles.viBlockOpen);

  const handleClick = () => {
    if (disabled || revealed) return;
    onSelect?.(letter);
  };

  return (
    <button
      type="button"
      className={classes.join(' ')}
      onClick={handleClick}
      disabled={disabled || revealed}
      aria-pressed={selected}
    >
      {isMultiple ? (
        <span
          className={`${styles.checkbox} ${selected ? styles.checkboxChecked : ''} ${revealed && isCorrect ? styles.checkboxCorrect : ''} ${revealed && isIncorrect ? styles.checkboxIncorrect : ''}`}
          aria-hidden="true"
        >
          {(selected || (revealed && isCorrect)) && <IconCheck />}
        </span>
      ) : (
        <span className={styles.badge} aria-hidden="true">
          {letter}
        </span>
      )}
      <span className={styles.body}>
        {segments.length === 0 ? (
          <span className={styles.text}>{text}</span>
        ) : (
          segments.map((seg, i) =>
            seg.kind === 'cli' ? (
              <pre key={i} className={styles.codeBlock}>
                <code>{seg.text}</code>
              </pre>
            ) : (
              <span key={i} className={styles.text}>
                {seg.text}
              </span>
            )
          )
        )}
        {showViBlock && (
          <span className={viClasses.join(' ')} aria-hidden={!showVi}>
            <span className={styles.viInner}>{textVi}</span>
          </span>
        )}
      </span>
      {revealed && isCorrect && (
        <span className={styles.icon} aria-hidden="true">
          <IconCheck />
        </span>
      )}
      {revealed && isIncorrect && (
        <span className={styles.icon} aria-hidden="true">
          <IconX />
        </span>
      )}
    </button>
  );
}
