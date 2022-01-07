import LocalEvaluator from './LocalEvaluator'

export default class PredeterminedAnswerEvaluator extends LocalEvaluator {
  constructor(answer: string) {
    super()
    this.answer = answer
  }
}
