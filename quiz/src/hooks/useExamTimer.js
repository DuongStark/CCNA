import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Exam countdown timer hook.
 * @param {number} durationMinutes - Total exam duration in minutes
 * @param {boolean} isRunning - Whether the timer is currently running
 * @param {Function} onTimeUp - Callback when time reaches 0
 */
export default function useExamTimer(durationMinutes, isRunning, onTimeUp) {
  const [remainingSeconds, setRemainingSeconds] = useState(durationMinutes * 60);
  const intervalRef = useRef(null);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    if (!isRunning || remainingSeconds <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setTimeout(() => onTimeUpRef.current?.(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, remainingSeconds <= 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatTime = useCallback(() => {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [remainingSeconds]);

  const elapsedSeconds = durationMinutes * 60 - remainingSeconds;

  return {
    remainingSeconds,
    formattedTime: formatTime(),
    elapsedSeconds,
    isLow: remainingSeconds <= 300, // 5 minutes warning
    isCritical: remainingSeconds <= 60, // 1 minute warning
  };
}
