import styles from './OptionCard.module.css';

const CLI_PROMPT_RE = /^(?:[\w.-]+(?:\([\w-]*\))?[>#]\s*|Router[\w(>#]|Switch[\w(>#]|R\d+[\w(>#]|SW\d+[\w(>#])/;
const CLI_KEYWORD_RE = /^(?:interface\s|ip\s|no\s|router\s|switch\s|enable\b|configure\s|line\s|access-list\s|vlan\s|hostname\s|description\s|switchport\s|spanning-tree\s|encapsulation\s|show\s|debug\s|copy\s|exit\b|end\b)/i;
const PROSE_RE = /^(?:which|what|how|why|where|when|who|select|choose|an |a |the |this |that |these |if |given |based |refer |drag |place |match |\w.*\?$)/i;

function looksLikeCli(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (CLI_PROMPT_RE.test(trimmed)) return true;
  if (CLI_KEYWORD_RE.test(trimmed)) return true;
  return false;
}

function splitIntoSegments(text) {
  if (!text) return [];
  const lines = text.split('\n');
  const segments = [];
  let buffer = [];
  let bufferKind = null;
  let inCliBlock = false;

  const flush = () => {
    if (!buffer.length) return;
    if (bufferKind === 'cli') {
      while (buffer.length && !buffer[buffer.length - 1].trim()) buffer.pop();
    }
    if (buffer.length) segments.push({ kind: bufferKind, text: buffer.join('\n') });
    buffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Once inside a CLI block, stay until we hit a clear prose line
    if (inCliBlock) {
      const isClearProse = PROSE_RE.test(trimmed) && !looksLikeCli(line) && trimmed.length > 20;
      if (isClearProse) {
        inCliBlock = false;
        flush();
        bufferKind = 'prose';
        buffer.push(line);
      } else {
        buffer.push(line);
      }
      continue;
    }

    // Detect start of CLI block via prompt (e.g. SiteA#, Router>)
    if (CLI_PROMPT_RE.test(trimmed)) {
      inCliBlock = true;
      flush();
      bufferKind = 'cli';
      buffer.push(line);
      continue;
    }

    // Normal line-by-line detection
    const kind = looksLikeCli(line) ? 'cli' : 'prose';
    if (kind !== bufferKind) {
      flush();
      bufferKind = kind;
    }
    buffer.push(line);
  }
  flush();
  return segments;
}

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

  const segments = splitIntoSegments(text);

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
          {(selected || (revealed && isCorrect)) ? '✓' : ''}
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
            {textVi}
          </span>
        )}
      </span>
      {revealed && isCorrect && (
        <span className={styles.icon} aria-hidden="true">
          ✓
        </span>
      )}
      {revealed && isIncorrect && (
        <span className={styles.icon} aria-hidden="true">
          ✕
        </span>
      )}
    </button>
  );
}
