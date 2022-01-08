import { GameParameters, GameState, Guesser } from '../models/Interfaces'

export default class ParametricGuesser implements Guesser {
  prepare = async (params: GameParameters): Promise<void> => {
    throw new Error('Method not implemented.')
  }

  nextGuess = async (state: GameState): Promise<string> => {
    throw new Error('Method not implemented.')
  }
}
