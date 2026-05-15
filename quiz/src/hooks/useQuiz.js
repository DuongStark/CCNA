import { useCallback, useEffect, useMemo, useState } from 'react';
import useSRS from './useSRS';

const VALID_KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalizeAnswerKey(value) {
  if (!value) return '';
  return String(value)
    .toUpperCase()
    .split('')
    .filter((c) => VALID_KEYS.includes(c))
    .sort()
    .join('');
}

export default function useQuiz(questions, mode = 'sequential', initialState = null) {
  const { recordAnswer, getSortedQuestions } = useSRS();

  const orderedQuestions = useMemo(() => {
    if (!Array.isArray(questions) || questions.length === 0) return [];
    if (mode === 'srs') return getSortedQuestions(questions);
    if (mode === 'random') return shuffle(questions);
    return questions;
    // getSortedQuestions is stable from useCallback; safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, mode]);

  const [currentIndex, setCurrentIndex] = useState(initialState?.currentIndex ?? 0);
  const [selectedAnswer, setSelectedAnswer] = useState(initialState?.selectedAnswer ?? '');
  const [isRevealed, setIsRevealed] = useState(initialState?.isRevealed ?? false);
  const [score, setScore] = useState(initialState?.score ?? 0);
  const [streak, setStreak] = useState(initialState?.streak ?? 0);
  const [wrongAnswers, setWrongAnswers] = useState(initialState?.wrongAnswers ?? []);
  const [results, setResults] = useState(() =>
    Array.isArray(initialState?.results) && initialState.results.length === orderedQuestions.length
      ? initialState.results
      : Array(orderedQuestions.length).fill(null)
  );
  const [isFinished, setIsFinished] = useState(orderedQuestions.length === 0);
  const [prevQuestions, setPrevQuestions] = useState(orderedQuestions);

  if (prevQuestions !== orderedQuestions) {
    setPrevQuestions(orderedQuestions);
    setCurrentIndex(0);
    setSelectedAnswer('');
    setIsRevealed(false);
    setScore(0);
    setStreak(0);
    setWrongAnswers([]);
    setResults(Array(orderedQuestions.length).fill(null));
    setIsFinished(orderedQuestions.length === 0);
  }

  const currentQuestion = orderedQuestions[currentIndex] || null;
  const isMultiple = currentQuestion?.type === 'multiple';

  const selectAnswer = useCallback(
    (key) => {
      if (isRevealed) return;
      if (!currentQuestion) return;
      const upper = String(key).toUpperCase();
      if (!VALID_KEYS.includes(upper)) return;
      if (!currentQuestion.options || !(upper in currentQuestion.options)) return;
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
    [isRevealed, currentQuestion, isMultiple]
  );

  const confirmAnswer = useCallback(() => {
    if (isRevealed || !currentQuestion || !selectedAnswer) return;
    const rawAnswer = Array.isArray(currentQuestion.answer)
      ? currentQuestion.answer.join('')
      : String(currentQuestion.answer || '');
    const correctNorm = normalizeAnswerKey(rawAnswer);
    const userNorm = normalizeAnswerKey(selectedAnswer);
    const correct = correctNorm === userNorm;

    setIsRevealed(true);
    setResults((prev) => {
      const next = [...prev];
      next[currentIndex] = correct ? 'correct' : 'incorrect';
      return next;
    });
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
      setWrongAnswers((prev) => [
        ...prev,
        {
          id: currentQuestion.id,
          uid: currentQuestion._uid || currentQuestion.id,
          question: currentQuestion.question,
          options: currentQuestion.options,
          explanation: currentQuestion.explanation,
          userAnswer: userNorm,
          correctAnswer: correctNorm,
        },
      ]);
    }
    const idForSrs = currentQuestion._uid || currentQuestion.id;
    recordAnswer(idForSrs, correct);
  }, [isRevealed, currentQuestion, selectedAnswer, recordAnswer, currentIndex]);

  const nextQuestion = useCallback(() => {
    if (!isRevealed) return;
    if (currentIndex >= orderedQuestions.length - 1) {
      setIsFinished(true);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelectedAnswer('');
    setIsRevealed(false);
  }, [isRevealed, currentIndex, orderedQuestions.length]);

  const jumpTo = useCallback(
    (i) => {
      if (i < 0 || i >= orderedQuestions.length) return;
      setCurrentIndex(i);
      setSelectedAnswer('');
      setIsRevealed(false);
    },
    [orderedQuestions.length]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (isFinished) return;
      const t = e.target;
      const inField =
        t instanceof HTMLElement &&
        (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (inField) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (isRevealed) nextQuestion();
        else confirmAnswer();
        return;
      }
      const upper = e.key.toUpperCase();
      if (VALID_KEYS.includes(upper)) {
        e.preventDefault();
        selectAnswer(upper);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFinished, isRevealed, confirmAnswer, nextQuestion, selectAnswer]);

  return {
    questions: orderedQuestions,
    currentQuestion,
    currentIndex,
    total: orderedQuestions.length,
    selectedAnswer,
    isRevealed,
    isMultiple,
    score,
    streak,
    wrongAnswers,
    results,
    isFinished,
    selectAnswer,
    confirmAnswer,
    nextQuestion,
    jumpTo,
  };
}
