import { useState } from 'react';
import { looksLikeCli, splitIntoSegments } from '../utils/cliUtils';
import ExhibitImage from './ExhibitImage';
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

function OptionItem({ letter, text, isCorrect, revealed }) {
  const segments = splitIntoSegments(text);
  const cls = [styles.option];
  if (revealed && isCorrect) cls.push(styles.optionCorrect);

  return (
    <div className={cls.join(' ')}>
      <span className={`${styles.optionBadge} ${revealed && isCorrect ? styles.optionBadgeCorrect : ''}`}>
        {letter}
      </span>
      <span className={styles.optionBody}>
        {segments.length === 0 ? (
          <span>{text}</span>
        ) : (
          segments.map((seg, i) =>
            seg.kind === 'cli' ? (
              <pre key={i} className={styles.codeBlock}><code>{seg.text}</code></pre>
            ) : (
              <span key={i}>{seg.text}</span>
            )
          )
        )}
      </span>
    </div>
  );
}

function QuestionCard({ question, index, sourceId }) {
  const [revealed, setRevealed] = useState(false);
  const [showVi, setShowVi] = useState(false);

  const correctLetters = new Set(
    typeof question.answer === 'string'
      ? question.answer.split('')
      : question.answer
  );

  const options = Object.entries(question.options || {});
  const isMultiple = correctLetters.size > 1;

  // image folder logic (mirrors dataLoader)
  const getImageSrc = (filename) => {
    if (!filename) return null;
    if (sourceId === 'pdf') {
      const folder = question.imageFolder || '';
      return `${import.meta.env.BASE_URL}images/pdf/${folder}/${filename}`.replace(/\/+/g, '/');
    }
    if (sourceId === 'docx') {
      const folder = question.imageFolder || '';
      return `${import.meta.env.BASE_URL}images/docx/${folder}/${filename}`.replace(/\/+/g, '/');
    }
    if (sourceId === 'odt') {
      const folder = question.imageFolder || '';
      return `${import.meta.env.BASE_URL}images/odt/${folder}/${filename}`.replace(/\/+/g, '/');
    }
    return null;
  };

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.index}>{index + 1}</span>
        {isMultiple && (
          <span className={styles.multipleBadge}>Chọn {correctLetters.size} đáp án</span>
        )}
      </div>

      {(question.question_images || []).map((img, i) => {
        const src = getImageSrc(img);
        return src ? <ExhibitImage key={i} src={src} alt={`Hình minh họa ${i + 1}`} /> : null;
      })}

      <div className={styles.questionText}>
        {splitIntoSegments(question.question).map((seg, i) =>
          seg.kind === 'cli' ? (
            <pre key={i} className={styles.codeBlock}><code>{seg.text}</code></pre>
          ) : (
            <p key={i}>{seg.text}</p>
          )
        )}
      </div>

      {question.question_vi && (
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
            isCorrect={correctLetters.has(letter)}
            revealed={revealed}
          />
        ))}
      </div>

      {!revealed ? (
        <button
          type="button"
          className={styles.revealBtn}
          onClick={() => setRevealed(true)}
        >
          Xem đáp án
        </button>
      ) : (
        <div className={styles.explanation}>
          <span className={styles.explanationLabel}>Giải thích</span>
          <div className={styles.explanationText}>
            {renderMarkdown(question.explanation || 'Chưa có giải thích.')}
          </div>
        </div>
      )}
    </article>
  );
}

export default function ScrollScreen({ questions, sourceId, onExit }) {
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button type="button" className={styles.exitBtn} onClick={onExit}>
          ← Thoát
        </button>
        <span className={styles.total}>{questions.length} câu</span>
      </header>

      <div className={styles.list}>
        {questions.map((q, i) => (
          <QuestionCard
            key={q._uid || q.id || i}
            question={q}
            index={i}
            sourceId={sourceId}
          />
        ))}
      </div>
    </div>
  );
}
