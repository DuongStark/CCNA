/**
 * Shuffle option order of a question while remapping the correct answer.
 *
 * Example:
 *   Original: options = { A:'opt1', B:'opt2', C:'opt3', D:'opt4' }, answer = 'B'
 *   Shuffled order: [C, A, D, B] → new options = { A:'opt3', B:'opt1', C:'opt4', D:'opt2' }
 *   Old→New mapping: C→A, A→B, D→C, B→D
 *   New answer: B→D → 'D'
 *
 * @param {Object} question - A question object
 * @returns {Object} A new question with shuffled options and remapped answer
 */
export function shuffleOptions(question) {
  if (!question.options || typeof question.options !== 'object') return question;

  const oldLetters = Object.keys(question.options).sort(); // ['A','B','C','D']
  if (oldLetters.length < 2) return question;

  // Fisher-Yates shuffle of letter positions
  const shuffled = [...oldLetters];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Build mapping: oldLetter → newLetter
  // shuffled[i] = old letter at new position i
  // new letter for position i = oldLetters[i]
  const oldToNew = {};
  for (let i = 0; i < shuffled.length; i++) {
    oldToNew[shuffled[i]] = oldLetters[i];
  }

  // Build new options object (keys in order: A, B, C, D...)
  const newOptions = {};
  const newOptionsVi = question.options_vi ? {} : null;
  for (let i = 0; i < oldLetters.length; i++) {
    const newLetter = oldLetters[i];
    const oldLetter = shuffled[i]; // old letter that goes to new position i
    newOptions[newLetter] = question.options[oldLetter];
    if (newOptionsVi) {
      newOptionsVi[newLetter] = question.options_vi?.[oldLetter] ?? '';
    }
  }

  // Remap answer
  let newAnswer = question.answer;
  if (typeof question.answer === 'string') {
    newAnswer = question.answer
      .split('')
      .map((c) => oldToNew[c] || c)
      .sort()
      .join('');
  } else if (Array.isArray(question.answer)) {
    newAnswer = question.answer.map((c) => oldToNew[c] || c).sort();
  }

  return {
    ...question,
    options: newOptions,
    options_vi: newOptionsVi || question.options_vi,
    answer: newAnswer,
  };
}

/**
 * Apply shuffleOptions to an array of questions.
 * @param {Array} questions
 * @returns {Array} New array with shuffled questions
 */
export function shuffleAllOptions(questions) {
  if (!Array.isArray(questions)) return questions;
  return questions.map(shuffleOptions);
}
