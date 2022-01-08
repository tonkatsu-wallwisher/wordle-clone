import chalk from 'chalk'
import readline from 'readline'
import {
  EvaluationResult,
  GameParameters,
  GameState,
  Guesser,
  GuessEvaluation,
} from '../models/Interfaces'
import formatCharEvaluation from '../utils/formatCharEvaluation'
import readDictionary from '../utils/readDictionary'

// Used to display available/used characters to user
const KEYBOARD_LAYOUT = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'].map((row) => row.split(''))
// The maximum length of the string printed out for a keyboard row
const MAX_KB_ROW_LENGTH = Math.max(...KEYBOARD_LAYOUT.map((row) => row.length)) * 2 - 1
// Sometimes the same character will have multiple evaluations across multiple
// rows. We resolve the maximum evaluation based on their rank.
const EVALUATION_RESULT_RANK: { [result in EvaluationResult]: number } = {
  correct: 2,
  misplaced: 1,
  wrong: 0,
}

export default class HumanGuesser implements Guesser {
  private validWords!: Set<string>

  prepare = async (params: GameParameters): Promise<void> => {
    this.validWords = new Set(await readDictionary(params.answerLength))
  }

  private printKeyboard = (evaluations: GuessEvaluation[]) => {
    const usedCharacters: { [char: string]: EvaluationResult } = {}

    // Using the `EVALUATION_RESULT_RANK` above to get the best evaluation we've
    // got for the current key so far.
    function resolveEvaluationResult(
      oldResult: EvaluationResult | undefined,
      newResult: EvaluationResult
    ): EvaluationResult {
      if (!oldResult) return newResult
      return EVALUATION_RESULT_RANK[oldResult] < EVALUATION_RESULT_RANK[newResult]
        ? newResult
        : oldResult
    }

    for (const evaluation of evaluations) {
      for (const charEvaluation of evaluation) {
        usedCharacters[charEvaluation.character] = resolveEvaluationResult(
          usedCharacters[charEvaluation.character],
          charEvaluation.result
        )
      }
    }
    for (const keyboardRow of KEYBOARD_LAYOUT) {
      const rowLength = keyboardRow.length * 2 - 1
      const leadingSpaces = (MAX_KB_ROW_LENGTH - rowLength) / 2
      console.log(
        ' '.repeat(leadingSpaces) +
          keyboardRow.map((key) => formatCharEvaluation(key, usedCharacters[key])).join(' ')
      )
    }
  }

  private printGameState = (state: GameState) => {
    console.log(chalk.bold('----------------'))
    console.log(chalk.bold('Guesses:'))
    state.guesses.forEach((guess, guessIndex) => {
      console.log(
        guessIndex + 1,
        state.guesses[guessIndex]
          .map(({ character, result }) => formatCharEvaluation(character, result))
          .join('')
      )
    })
    console.log()
    this.printKeyboard(state.guesses)
    console.log()
  }

  nextGuess(state: GameState): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (state.guesses.length) {
        this.printGameState(state)
      }
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      })

      rl.on('error', reject)

      const promptForGuess = () =>
        new Promise<string>((resolve) => {
          rl.question('Next guess: ', (guess) => resolve(guess.trim().toLowerCase()))
        })

      const promptForValidGuess = async (): Promise<string> => {
        const guess = await promptForGuess()
        if (guess.length !== state.answerLength) {
          console.log(chalk.yellow(`'${guess}' is not ${state.answerLength} characters long.`))
          return promptForValidGuess()
        }
        if (!this.validWords.has(guess)) {
          console.log(chalk.yellow(`'${guess}' is not a valid English word.`))
          return promptForValidGuess()
        }
        return guess
      }

      promptForValidGuess().then((guess) => {
        rl.close()
        resolve(guess)
      })
    })
  }
}
