import { Evaluator, GameState, Guesser } from '../models/Interfaces'

export interface GameOptions {
  wordLength: number
  maxGuesses: number
}

export default class GameCoordinator {
  readonly options: GameOptions

  constructor(options: GameOptions) {
    this.options = options
  }

  play = async (evaluator: Evaluator, guesser: Guesser): Promise<GameState> => {
    let guessedCorrectly = false
    const guesses: string[] = []
    const gameState: GameState = {
      answerLength: this.options.wordLength,
      guesses: [],
    }

    for (
      let guessNumber = 0;
      guessNumber < this.options.maxGuesses && !guessedCorrectly;
      ++guessNumber
    ) {
      const guess = await guesser.nextGuess(gameState)
      if (guess.length !== this.options.wordLength) {
        throw new Error('Guesser made an invalid guess')
      }
      guesses.push(guess)

      const evaluation = await evaluator.evaluateGuess(guess)
      gameState.guesses.push(evaluation)

      guessedCorrectly = evaluation.every((char) => char.result === 'correct')
    }

    return gameState
  }
}
