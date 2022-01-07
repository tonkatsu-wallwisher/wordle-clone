import { Evaluator, GuessEvaluation } from '../models/Interfaces'

export default class LocalEvaluator implements Evaluator {
  answer!: string

  prepare = async () => {
    // Do nothing
  }

  evaluateGuess = async (guess: string): Promise<GuessEvaluation> => {
    if (typeof this.answer !== 'string') {
      throw new Error('Answer has not been populated')
    }

    const evaluations: GuessEvaluation = []
    for (let charIndex = 0; charIndex < this.answer.length; charIndex++) {
      const char = guess[charIndex]
      if (char === this.answer[charIndex]) {
        evaluations.push({ character: char, result: 'correct' })
        continue
      }
      const charPosition = this.answer.indexOf(char)
      if (charPosition > -1) {
        evaluations.push({ character: char, result: 'misplaced' })
      } else {
        evaluations.push({ character: char, result: 'wrong' })
      }
    }
    return evaluations
  }
}
