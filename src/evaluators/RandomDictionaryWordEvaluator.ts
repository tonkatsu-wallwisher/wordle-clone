import selectRandomWord from '../utils/selectRandomWord'
import LocalEvaluator from './LocalEvaluator'

export default class RandomDictionaryWordEvaluator extends LocalEvaluator {
  readonly wordLength: number

  constructor(wordLength: number) {
    super()
    this.wordLength = wordLength
  }

  prepare = async () => {
    if (typeof this.answer === 'string') {
      return
    }
    this.answer = await selectRandomWord(this.wordLength)
  }
}
