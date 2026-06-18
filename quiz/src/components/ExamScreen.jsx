import { useCallback, useEffect, useMemo, useState } from 'react';
import ExhibitImage from './ExhibitImage';
import { getImagePath } from '../utils/dataLoader';
import { splitIntoSegments } from '../utils/cliUtils';
import { IconArrowLeft } from '../icons';
import useExamTimer from '../hooks/useExamTimer';
import styles from './ExamScreen.module.css';

function QuestionBody({ text }) {
  const segments = useMemo(() => splitIntoSegments(text), [text]);
  if (segments.length === 0) {
    return <p className={styles.questionText}>{text}</p>;
  }
  return (
    <div className={styles.questionBody}>
      {segments.map((seg, i) =>
        seg.kind === 'cli' ? (
          <pre key={i} className="code-block">
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

export default function ExamScreen({
  questions,
  sourceId,
  onExit,
  onFinish,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [savedAnswers, setSavedAnswers] = useState(Array(questions.length).fill(''));
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [isRunning, setIsRunning] = useState(true);
  const [showVi, setShowVi] = useState(false);
  const [prevId, setPrevId] = useState(null);

  const question = questions[currentIndex];
  const isLastQuestion = currentIndex >= questions.length - 1;

  // Reset translation on question change
  const currentId = question?._uid || question?.id || null;
  if (prevId !== currentId) {
    setPrevId(currentId);
    setShowVi(false);
  }

  const rawAnswer = Array.isArray(question?.answer)
    ? question.answer.join('')
    : String(question?.answer || '');
  const correctSet = new Set(rawAnswer.toUpperCase().split('').filter(Boolean));
  const selectedSet = new Set(selectedAnswer.split('').filter(Boolean));
  const isMultiple = correctSet.size > 1;
  const optionEntries = Object.entries(question?.options || {});
  const canConfirm = selectedSet.size > 0;
  const answeredCount = savedAnswers.filter((a) => a !== '').length;

  const questionImages = (question?.question_images || [])
    .map((f) => getImagePath(question._source || sourceId, question._topic || 'all', f))
    .filter(Boolean);

  // Calculate final score
  const calculateResults = useCallback(() => {
    return questions.map((q, i) => {
      const ans = savedAnswers[i];
      if (!ans) return null;
      const raw = Array.isArray(q.answer) ? q.answer.join('') : String(q.answer || '');
      const correct = raw.split('').sort().join('') === ans.split('').sort().join('');
      return correct ? 'correct' : 'incorrect';
    });
  }, [questions, savedAnswers]);

  const handleTimeUp = useCallback(() => {
    setIsRunning(false);
    const results = calculateResults();
    const correctCount = results.filter((r) => r === 'correct').length;
    const wrongAnswers = [];
    questions.forEach((q, i) => {
      if (results[i] === 'incorrect') {
        const raw = Array.isArray(q.answer) ? q.answer.join('') : String(q.answer || '');
        wrongAnswers.push({
          id: q.id,
          uid: q._uid || q.id,
          question: q.question,
          options: q.options,
          explanation: q.explanation,
          question_vi: q.question_vi,
          options_vi: q.options_vi,
          userAnswer: savedAnswers[i] || '',
          correctAnswer: raw.split('').sort().join(''),
        });
      }
    });
    onFinish?.({
      total: questions.length,
      correctCount,
      wrongAnswers,
      results,
      timeUp: true,
    });
  }, [questions, savedAnswers, calculateResults, onFinish]);

  const { formattedTime, isLow, isCritical } = useExamTimer(120, isRunning, handleTimeUp);

  // Select answer
  const selectAnswer = useCallback(
    (key) => {
      const upper = String(key).toUpperCase();
      if (!['A', 'B', 'C', 'D', 'E', 'F'].includes(upper)) return;
      if (!question?.options || !(upper in question.options)) return;
      setSelectedAnswer((prev) => {
        if (isMultiple) {
          const set = new Set(prev.split('').filter(Boolean));
          if (set.has(upper)) set.delete(upper);
          else set.add(upper);
          return [...set].sort().join('');
        }
        return upper;
      });
    },
    [question, isMultiple]
  );

  // Confirm & move to next — save answer, no reveal
  const confirmAndNext = useCallback(() => {
    if (!selectedAnswer) return;
    // Save answer
    const newAnswers = [...savedAnswers];
    newAnswers[currentIndex] = selectedAnswer;
    setSavedAnswers(newAnswers);

    if (isLastQuestion) {
      setConfirmEnd(true);
      return;
    }
    // Move to next
    setCurrentIndex((i) => i + 1);
    // Restore saved answer for next question if exists
    setSelectedAnswer(newAnswers[currentIndex + 1] || '');
  }, [selectedAnswer, savedAnswers, currentIndex, isLastQuestion]);

  // End exam
  const handleEndExam = useCallback(() => {
    setConfirmEnd(false);
    setIsRunning(false);
    const results = calculateResults();
    const correctCount = results.filter((r) => r === 'correct').length;
    const wrongAnswers = [];
    questions.forEach((q, i) => {
      if (results[i] === 'incorrect') {
        const raw = Array.isArray(q.answer) ? q.answer.join('') : String(q.answer || '');
        wrongAnswers.push({
          id: q.id,
          uid: q._uid || q.id,
          question: q.question,
          options: q.options,
          explanation: q.explanation,
          question_vi: q.question_vi,
          options_vi: q.options_vi,
          userAnswer: savedAnswers[i] || '',
          correctAnswer: raw.split('').sort().join(''),
        });
      }
    });
    onFinish?.({
      total: questions.length,
      correctCount,
      wrongAnswers,
      results,
      timeUp: false,
    });
  }, [questions, savedAnswers, calculateResults, onFinish]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (confirmEnd) return;
      const t = e.target;
      const inField =
        t instanceof HTMLElement &&
        (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (inField) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        confirmAndNext();
        return;
      }
      const upper = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D', 'E', 'F'].includes(upper)) {
        e.preventDefault();
        selectAnswer(upper);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmEnd, confirmAndNext, selectAnswer]);

  if (!question) return null;

  return (
    <div className={styles.screen}>
      {/* Confirm end dialog */}
      {confirmEnd && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmCard}>
            <h3>Nộp bài?</h3>
            <p>Đã trả lời {answeredCount}/{questions.length} câu.</p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.confirmCancel}
                onClick={() => setConfirmEnd(false)}
              >
                Làm tiếp
              </button>
              <button
                type="button"
                className={styles.confirmSubmit}
                onClick={handleEndExam}
                autoFocus
              >
                Nộp bài
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <button type="button" className={styles.exitButton} onClick={onExit}>
            <IconArrowLeft />
            <span>Thoát</span>
          </button>
        </div>
        <div className={`${styles.timer} ${isLow ? styles.timerLow : ''} ${isCritical ? styles.timerCritical : ''}`}>
          {formattedTime}
        </div>
        <div className={styles.topBarRight}>
          <span className={styles.progress}>
            {answeredCount}/{questions.length}
          </span>
          <button
            type="button"
            className={styles.endBtn}
            onClick={() => setConfirmEnd(true)}
          >
            Nộp bài
          </button>
        </div>
      </header>

      {/* Question card */}
      <article key={question._uid || question.id} className={styles.card}>
        <div className={styles.questionHeader}>
          <span className={styles.questionId}>#{question.id}</span>
          <span className={styles.questionCounter}>
            {currentIndex + 1} / {questions.length}
          </span>
          {isMultiple && (
            <span className={styles.multipleBanner}>
              Chọn {correctSet.size} đáp án
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
            >
              {showVi ? 'Ẩn bản dịch' : 'Dịch tiếng Việt'}
            </button>
            {showVi && (
              <div className={styles.translateContent}>
                <p className={styles.translateText}>{question.question_vi}</p>
              </div>
            )}
          </div>
        )}

        <div className={styles.options}>
          {optionEntries.map(([letter, text]) => {
            const isSelected = selectedSet.has(letter);
            const cls = [styles.option];
            if (isSelected) cls.push(styles.optionSelected);
            return (
              <button
                key={letter}
                type="button"
                className={cls.join(' ')}
                onClick={() => selectAnswer(letter)}
              >
                <span className={styles.optionBadge}>{letter}</span>
                <span className={styles.optionText}>
                  {text.split('\n').map((line, i, arr) => (
                    <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                  ))}
                  {showVi && question.options_vi?.[letter] && (
                    <span className={styles.optionVi}>{question.options_vi[letter]}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </article>

      {/* Actions */}
      <footer className={styles.actions}>
        <button
          type="button"
          className={isLastQuestion ? styles.finishButton : styles.primaryButton}
          onClick={confirmAndNext}
          disabled={!canConfirm}
        >
          {isLastQuestion ? 'Nộp bài' : 'Câu tiếp theo'}
        </button>
        <span className={styles.shortcutHint}>
          {selectedSet.size === 0 && (
            <><kbd>A</kbd>–<kbd>{String.fromCharCode(64 + optionEntries.length)}</kbd> để chọn</>
          )}
          {selectedSet.size > 0 && (
            <><kbd>Space</kbd> {isLastQuestion ? 'nộp bài' : 'tiếp tục'}</>
          )}
        </span>
      </footer>
    </div>
  );
}
