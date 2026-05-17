import { useCallback, useEffect, useMemo, useState, Component } from 'react';
import HomeScreen from './components/HomeScreen';
import QuizScreen from './components/QuizScreen';
import ResultScreen from './components/ResultScreen';
import ScrollScreen from './components/ScrollScreen';
import { loadSource } from './utils/dataLoader';
import useQuiz from './hooks/useQuiz';
import './App.css';

const SESSION_KEY = 'ccna_quiz_session';
const PROGRESS_KEY = 'ccna_quiz_progress';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'monospace' }}>
          <h2 style={{ color: '#C0392B' }}>Runtime Error</h2>
          <pre style={{ background: '#1a1a1a', color: '#f0f0f0', padding: '16px', borderRadius: '8px', overflow: 'auto', fontSize: '13px' }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
          <button onClick={() => this.setState({ error: null })} style={{ marginTop: '16px', padding: '8px 16px' }}>
            Dismiss
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function pickQuestions(all, count) {
  if (!count || count >= all.length) return all;
  const a = [...all];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, count);
}

function HomeContainer({ onStart }) {
  return <HomeScreen onStart={onStart} />;
}

function QuizContainer({ session, initialProgress, onExit, onFinish }) {
  const quiz = useQuiz(session.questions, session.mode, initialProgress);

  useEffect(() => {
    if (quiz.isFinished) {
      onFinish({
        total: quiz.total,
        correctCount: quiz.score,
        wrongAnswers: quiz.wrongAnswers,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.isFinished]);

  useEffect(() => {
    if (!quiz.currentQuestion) return;
    sessionStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({
        currentIndex: quiz.currentIndex,
        score: quiz.score,
        streak: quiz.streak,
        wrongAnswers: quiz.wrongAnswers,
        results: quiz.results,
        isRevealed: quiz.isRevealed,
        selectedAnswer: quiz.selectedAnswer,
      })
    );
  }, [quiz.currentIndex, quiz.isRevealed, quiz.selectedAnswer]);

  if (!quiz.currentQuestion) return null;

  return (
    <QuizScreen
      question={quiz.currentQuestion}
      index={quiz.currentIndex}
      total={quiz.total}
      selectedAnswer={quiz.selectedAnswer}
      isRevealed={quiz.isRevealed}
      isMultiple={quiz.isMultiple}
      results={quiz.results}
      onSelect={quiz.selectAnswer}
      onConfirm={quiz.confirmAnswer}
      onNext={quiz.nextQuestion}
      onJump={quiz.jumpTo}
      onExit={onExit}
      sourceId={session.sourceId}
      topicId={session.topicId}
    />
  );
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [session, setSession] = useState(null);
  const [initialProgress, setInitialProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (!saved) return;
    try {
      const s = JSON.parse(saved);
      if (s && s.questions && s.questions.length) {
        const progress = JSON.parse(sessionStorage.getItem(PROGRESS_KEY) || 'null');
        setSession(s);
        setInitialProgress(progress);
        setScreen('quiz');
      }
    } catch {
      // ignore
    }
  }, []);

  const handleStart = useCallback(async ({ sourceId, topicId, count, srsMode, randomOrder, scrollMode }) => {
    setLoading(true);
    setError(null);
    try {
      const all = await loadSource(sourceId, topicId);
      if (!all.length) throw new Error('No questions available for this topic.');
      const subset = pickQuestions(all, count);
      const mode = randomOrder ? 'random' : 'sequential';
      const newSession = {
        sourceId,
        topicId,
        mode,
        questions: subset,
        scrollMode: !!scrollMode,
      };
      setSession(newSession);
      setInitialProgress(null);
      setResult(null);
      setScreen(scrollMode ? 'scroll' : 'quiz');
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
      sessionStorage.removeItem(PROGRESS_KEY);
    } catch (e) {
      setError(e.message || 'Failed to load questions.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFinish = useCallback((res) => {
    setResult(res);
    setScreen('result');
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(PROGRESS_KEY);
  }, []);

  const handleExit = useCallback(() => {
    setSession(null);
    setInitialProgress(null);
    setResult(null);
    setError(null);
    setScreen('home');
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(PROGRESS_KEY);
  }, []);

  const handleRepeat = useCallback(() => {
    if (!session) return;
    const newSession = { ...session };
    setSession(newSession);
    setInitialProgress(null);
    setResult(null);
    setScreen('quiz');
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    sessionStorage.removeItem(PROGRESS_KEY);
  }, [session]);

  const handleReviewWrong = useCallback(() => {
    if (!result || !session) return;
    const wrongIds = new Set(result.wrongAnswers.map((w) => w.uid || w.id));
    const wrongQuestions = session.questions.filter((q) =>
      wrongIds.has(q._uid || q.id)
    );
    if (!wrongQuestions.length) return;
    const newSession = { ...session, mode: 'sequential', questions: wrongQuestions };
    setSession(newSession);
    setInitialProgress(null);
    setResult(null);
    setScreen('quiz');
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    sessionStorage.removeItem(PROGRESS_KEY);
  }, [result, session]);

  const overlay = useMemo(() => {
    if (loading) {
      return (
        <div className="app-overlay">
          <div className="app-overlay-card">Loading questions…</div>
        </div>
      );
    }
    if (error) {
      return (
        <div className="app-overlay">
          <div className="app-overlay-card app-overlay-error">
            <p>{error}</p>
            <button type="button" onClick={() => setError(null)}>
              Dismiss
            </button>
          </div>
        </div>
      );
    }
    return null;
  }, [loading, error]);

  return (
    <>
      {screen === 'home' && <HomeContainer onStart={handleStart} />}
      {screen === 'scroll' && session && (
        <ScrollScreen
          questions={session.questions}
          sourceId={session.sourceId}
          onExit={handleExit}
        />
      )}
      {screen === 'quiz' && session && (
        <ErrorBoundary>
          <QuizContainer
            session={session}
            initialProgress={initialProgress}
            onExit={handleExit}
            onFinish={handleFinish}
          />
        </ErrorBoundary>
      )}
      {screen === 'result' && result && (
        <ResultScreen
          total={result.total}
          correctCount={result.correctCount}
          wrongAnswers={result.wrongAnswers}
          onReviewWrong={handleReviewWrong}
          onRepeat={handleRepeat}
          onNewSession={handleExit}
        />
      )}
      {overlay}
    </>
  );
}
