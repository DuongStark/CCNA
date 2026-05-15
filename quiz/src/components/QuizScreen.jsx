import { useEffect, useMemo, useRef, useState } from 'react';
import ProgressBar from './ProgressBar';
import OptionCard from './OptionCard';
import ExhibitImage from './ExhibitImage';
import QuestionNav from './QuestionNav';
import { getImagePath } from '../utils/dataLoader';
import styles from './QuizScreen.module.css';

const CLI_PROMPT_RE = /^[\w.-]+(?:\([\w-]*\))?[>#]\s*/;  // hostname# or hostname(mode)#
const CLI_OUTPUT_RE = /^(?:gigabitethernet|fastethernet|serial|vlan|loopback|tunnel|port-channel|hardware is|mtu \d|bw \d|encapsulation|arp type|last input|output queue|five minute|packets input|packets output|received \d|\d+ input|\d+ output|input errors|output errors|\s{2,}|\!|building config|current config|version \d|boot|interface |ip |no |router |spanning|switchport|access-list|vlan |hostname |description |line |crypto |aaa |snmp |ntp |logging |end$|!$)/i;

function looksLikeCli(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return CLI_PROMPT_RE.test(trimmed) || CLI_OUTPUT_RE.test(trimmed);
}

// A line is clearly prose (question text) if it's a full sentence ending with ? or .
// or starts with common question words
const PROSE_RE = /^(?:which|what|how|why|where|when|who|select|choose|an |a |the |this |that |these |if |given |based |refer |drag |place |match |\w.*\?$)/i;

function splitIntoSegments(text) {
  if (!text) return [];
  const lines = text.split('\n');
  const segments = [];
  let buffer = [];
  let bufferKind = null;
  let inCliBlock = false;

  const flush = () => {
    if (!buffer.length) return;
    // trim trailing blank lines from code blocks
    if (bufferKind === 'cli') {
      while (buffer.length && !buffer[buffer.length - 1].trim()) buffer.pop();
    }
    if (buffer.length) segments.push({ kind: bufferKind, text: buffer.join('\n') });
    buffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Once inside a CLI block, stay in it unless we hit a clear prose line
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

    // Detect start of CLI block
    if (CLI_PROMPT_RE.test(trimmed)) {
      inCliBlock = true;
      flush();
      bufferKind = 'cli';
      buffer.push(line);
      continue;
    }

    // Normal prose/cli detection
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

function QuestionBody({ text }) {
  const segments = useMemo(() => splitIntoSegments(text), [text]);
  if (segments.length === 0) {
    return <p className={styles.questionText}>{text}</p>;
  }
  return (
    <div className={styles.questionBody}>
      {segments.map((seg, i) =>
        seg.kind === 'cli' ? (
          <pre key={i} className={styles.codeBlock}>
            <code>{seg.text}</code>
          </pre>
        ) : (
          <p key={i} className={styles.questionText}>
            {seg.text}
          </p>
        )
      )}
    </div>
  );
}

export default function QuizScreen({
  question,
  index,
  total,
  selectedAnswer,
  isRevealed,
  isMultiple,
  results,
  onSelect,
  onConfirm,
  onNext,
  onJump,
  onExit,
  sourceId,
  topicId,
}) {
  const [showVi, setShowVi] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const explanationRef = useRef(null);
  const [prevId, setPrevId] = useState(question?._uid || question?.id || null);
  const currentId = question?._uid || question?.id || null;
  if (prevId !== currentId) {
    setPrevId(currentId);
    setShowVi(false);
  }

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOpen]);

  useEffect(() => {
    if (isRevealed && explanationRef.current) {
      explanationRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isRevealed]);

  const handleJump = (i) => {
    onJump?.(i);
    setNavOpen(false);
  };

  if (!question) return null;

  const rawAnswer = Array.isArray(question.answer)
    ? question.answer.join('')
    : String(question.answer || '');
  const correctSet = new Set(rawAnswer.toUpperCase().split('').filter(Boolean));
  const selectedSet = new Set(selectedAnswer.split('').filter(Boolean));
  const optionEntries = Object.entries(question.options || {});

  const canConfirm = !isRevealed && selectedSet.size > 0;
  const wasCorrect =
    isRevealed &&
    [...correctSet].sort().join('') === [...selectedSet].sort().join('');

  const questionImages = (question.question_images || [])
    .map((f) => getImagePath(sourceId, question._topic || topicId, f))
    .filter(Boolean);
  const explanationImages = (question.explanation_images || [])
    .map((f) => getImagePath(sourceId, question._topic || topicId, f))
    .filter(Boolean);

  const hasCliOption = optionEntries.some(([, text]) =>
    typeof text === "string" && text.includes("\n") && looksLikeCli(text.split("\n")[0])
  );

  return (
    <div className={styles.layout}>
      {navOpen && (
        <>
          <div
            className={styles.drawerOverlay}
            onClick={() => setNavOpen(false)}
            aria-hidden="true"
          />
          <div className={styles.drawer} role="dialog" aria-label="Question navigator">
            <button
              type="button"
              className={styles.drawerClose}
              onClick={() => setNavOpen(false)}
              aria-label="Đóng"
            >
              ✕
            </button>
            <QuestionNav
              total={total}
              currentIndex={index}
              results={results}
              onJump={handleJump}
            />
          </div>
        </>
      )}

      <div className={styles.screen}>
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button
              type="button"
              className={styles.navToggle}
              onClick={() => setNavOpen((v) => !v)}
              aria-label="Toggle question navigator"
              aria-expanded={navOpen}
            >
              ≡
            </button>
            <button type="button" className={styles.exitButton} onClick={onExit}>
              ← Thoát
            </button>
          </div>
          <div className={styles.meta}>
            <span className={styles.counter}>
              {index + 1} <span className={styles.counterDim}>/ {total}</span>
            </span>
          </div>
        </header>

        <ProgressBar current={index + (isRevealed ? 1 : 0)} total={total} />

        <article key={question._uid || question.id} className={styles.card}>
          <div className={styles.questionHeader}>
            <span className={styles.questionId}>#{question.id}</span>
          </div>

          <QuestionBody text={question.question} />

          {isMultiple && (
            <div className={styles.multipleBanner} role="note">
              <span aria-hidden="true">☑</span> Chọn {correctSet.size} đáp án đúng
              {!isRevealed && (
                <span className={styles.multipleCounter}>
                  Đã chọn: {selectedSet.size}/{correctSet.size}
                </span>
              )}
            </div>
          )}

          {question.question_vi && (
            <div className={styles.translateBlock}>
              <button
                type="button"
                className={styles.translateButton}
                onClick={() => setShowVi((v) => !v)}
                aria-expanded={showVi}
              >
                {showVi ? 'Ẩn bản dịch' : 'Dịch tiếng Việt'}
              </button>
              <div
                className={`${styles.translateContent} ${showVi ? styles.translateContentOpen : ''}`}
              >
                <div className={styles.translateInner}>{question.question_vi}</div>
              </div>
            </div>
          )}

          {questionImages.map((src, i) => (
            <ExhibitImage key={src} src={src} alt={`Question exhibit ${i + 1}`} />
          ))}

          <div className={`${styles.options}${hasCliOption ? " " + styles.optionsFull : ""}`}>
            {optionEntries.map(([letter, text]) => {
              const isSelected = selectedSet.has(letter);
              const isCorrect = isRevealed && correctSet.has(letter);
              const isIncorrect = isRevealed && isSelected && !correctSet.has(letter);
              return (
                <OptionCard
                  key={letter}
                  letter={letter}
                  text={text}
                  textVi={question.options_vi?.[letter]}
                  showVi={showVi}
                  selected={isSelected}
                  revealed={isRevealed}
                  isCorrect={isCorrect}
                  isIncorrect={isIncorrect}
                  onSelect={onSelect}
                />
              );
            })}
          </div>

          {isRevealed && (
            <section
              ref={explanationRef}
              className={`${styles.explanation} ${wasCorrect ? styles.explanationCorrect : styles.explanationWrong}`}
              aria-live="polite"
            >
              <div className={styles.explanationHeader}>
                <span className={styles.explanationStatus}>
                  {wasCorrect ? '✓ Đúng' : '✕ Sai'}
                </span>
                <span className={styles.explanationAnswer}>
                  Đáp án: <strong>{[...correctSet].sort().join('')}</strong>
                </span>
              </div>
              {question.explanation && (
                <p className={styles.explanationText}>{question.explanation}</p>
              )}
              {explanationImages.map((src, i) => (
                <ExhibitImage
                  key={src}
                  src={src}
                  alt={`Explanation image ${i + 1}`}
                />
              ))}
            </section>
          )}
        </article>

        <footer className={styles.actions}>
          {!isRevealed ? (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={onConfirm}
              disabled={!canConfirm}
            >
              Xác nhận
            </button>
          ) : (
            <button
              type="button"
              className={index + 1 >= total ? styles.finishButton : styles.primaryButton}
              onClick={onNext}
              autoFocus
            >
              {index + 1 >= total ? 'Hoàn thành 🎉' : 'Câu tiếp theo'}
            </button>
          )}
          <span className={styles.shortcutHint}>
            {!isRevealed && selectedSet.size === 0 && (
              <><kbd>A</kbd>–<kbd>{String.fromCharCode(64 + optionEntries.length)}</kbd> để chọn</>
            )}
            {!isRevealed && selectedSet.size > 0 && (
              <><kbd>Space</kbd> để xác nhận</>
            )}
            {isRevealed && (
              <><kbd>Space</kbd> để tiếp tục</>
            )}
          </span>
        </footer>
      </div>

      <aside className={styles.rightSidebar}>
        <QuestionNav
          total={total}
          currentIndex={index}
          results={results}
          onJump={handleJump}
        />
      </aside>
    </div>
  );
}
