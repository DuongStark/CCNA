import { useCallback, useState } from 'react';
import {
  getAllCards,
  recordAnswer as recordAnswerUtil,
  resetAll as resetAllUtil,
  sortByPriority,
} from '../utils/srs';

export default function useSRS() {
  const [srsData, setSrsData] = useState(() => getAllCards());

  const recordAnswer = useCallback((id, correct) => {
    recordAnswerUtil(id, correct);
    setSrsData(getAllCards());
  }, []);

  const getSortedQuestions = useCallback((questions) => {
    if (!Array.isArray(questions) || questions.length === 0) return [];
    const ids = questions.map((q) => q._uid || q.id);
    const order = sortByPriority(ids);
    const byId = new Map(questions.map((q) => [q._uid || q.id, q]));
    return order.map((id) => byId.get(id)).filter(Boolean);
  }, []);

  const resetAll = useCallback(() => {
    resetAllUtil();
    setSrsData({});
  }, []);

  return { srsData, recordAnswer, getSortedQuestions, resetAll };
}
