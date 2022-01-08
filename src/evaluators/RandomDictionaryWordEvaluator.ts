import { GameParameters } from '../models/Interfaces'
import selectRandomWord from '../utils/selectRandomWord'
import LocalEvaluator from './LocalEvaluator'

export default class RandomDictionaryWordEvaluator extends LocalEvaluator {
  prepare = async (params: GameParameters) => {
    if (typeof this.answer === 'string') {
      return
    }
    this.answer = await selectRandomWord(params.answerLength)
  }
}
