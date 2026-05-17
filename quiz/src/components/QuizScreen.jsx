import { useEffect, useMemo, useRef, useState } from 'react';
import ProgressBar from './ProgressBar';
import OptionCard from './OptionCard';
import ExhibitImage from './ExhibitImage';
import QuestionNav from './QuestionNav';
import { getImagePath } from '../utils/dataLoader';
import { splitIntoSegments } from '../utils/cliUtils';
import { IconCheck, IconX, IconMenu, IconClose, IconCheckbox, IconArrowLeft } from '../icons';
import styles from './QuizScreen.module.css';

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

  const renderExplanation = (refTarget) =>
    isRevealed ? (
      <section
        ref={refTarget}
        className={`${styles.explanation} ${wasCorrect ? styles.explanationCorrect : styles.explanationWrong}`}
        aria-live="polite"
      >
        <div className={styles.explanationHeader}>
          <span className={styles.explanationStatus}>
            {wasCorrect ? <IconCheck /> : <IconX />}
            <span>{wasCorrect ? 'Đúng' : 'Sai'}</span>
          </span>
          <span className={styles.explanationAnswer}>
            Đáp án: <strong>{[...correctSet].sort().join('')}</strong>
          </span>
        </div>
        {question.explanation && (
          <div className={styles.explanationText}>
            {question.explanation.split('\n').filter(l => l.trim()).map((line, i) => {
              // render **bold** and `code` inline
              const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g).map((part, j) => {
                if (part.startsWith('**') && part.endsWith('**'))
                  return <strong key={j}>{part.slice(2, -2)}</strong>;
                if (part.startsWith('`') && part.endsWith('`'))
                  return <code key={j}>{part.slice(1, -1)}</code>;
                return part;
              });
              return <p key={i}>{parts}</p>;
            })}
          </div>
        )}
        {explanationImages.map((src, i) => (
          <ExhibitImage
            key={src}
            src={src}
            alt={`Explanation image ${i + 1}`}
          />
        ))}
      </section>
    ) : null;

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
              <IconClose />
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
              <IconMenu />
            </button>
            <button type="button" className={styles.exitButton} onClick={onExit}>
              <IconArrowLeft />
              <span>Thoát</span>
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
            {isMultiple && (
              <span className={styles.multipleBanner} role="note">
                <IconCheckbox />
                <span>Chọn {correctSet.size} đáp án</span>
                {!isRevealed && (
                  <span className={styles.multipleCounter}>
                    {selectedSet.size}/{correctSet.size}
                  </span>
                )}
              </span>
            )}
          </div>

          <QuestionBody text={question.question} />

          {questionImages.map((src, i) => (
            <ExhibitImage key={src} src={src} alt={`Question exhibit ${i + 1}`} />
          ))}

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

          <div className={styles.options}>
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
                  isMultiple={isMultiple}
                  onSelect={onSelect}
                />
              );
            })}
          </div>

          {renderExplanation(explanationRef)}
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
              {index + 1 >= total ? 'Hoàn thành' : 'Câu tiếp theo'}
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
