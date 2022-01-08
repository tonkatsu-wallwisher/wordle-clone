import { GameState, GuessCharacterEvaluation, Guesser, GuessEvaluation } from '../models/Interfaces'
import readline from 'readline'
import chalk from 'chalk'
import readDictionary from '../utils/readDictionary'

// Used to display available/used characters to user
const KEYBOARD_LAYOUT = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'].map((row) => row.split(''))
// The maximum length of the string printed out for a keyboard row
const MAX_KB_ROW_LENGTH = Math.max(...KEYBOARD_LAYOUT.map((row) => row.length)) * 2 - 1

export default class HumanGuesser implements Guesser {
  private validWords!: Set<string>

  prepare = async (): Promise<void> => {
    this.validWords = new Set(await readDictionary())
  }

  private printKeyboard = (evaluations: GuessEvaluation[]) => {
    const usedCharacters: { [char: string]: GuessCharacterEvaluation['result'] } = {}
    for (const evaluation of evaluations) {
      for (const charEvaluation of evaluation) {
        usedCharacters[charEvaluation.character] = charEvaluation.result
      }
    }
    for (const keyboardRow of KEYBOARD_LAYOUT) {
      const rowLength = keyboardRow.length * 2 - 1
      const leadingSpaces = (MAX_KB_ROW_LENGTH - rowLength) / 2
      console.log(
        ' '.repeat(leadingSpaces) +
          keyboardRow
            .map((key) => {
              switch (usedCharacters[key]) {
                case 'correct':
                  return chalk.green(key.toUpperCase())
                case 'misplaced':
                  return chalk.yellow(key.toUpperCase())
                case 'wrong':
                  return chalk.gray(key.toUpperCase())
                default:
                  return chalk.white(key.toUpperCase())
              }
            })
            .join(' ')
      )
    }
  }

  private printGameState = (state: GameState) => {
    console.log(chalk.bold('----------------'))
    console.log(chalk.bold('Guesses:'))
    for (let guessIndex = 0; guessIndex < state.guesses.length; ++guessIndex) {
      console.log(
        guessIndex + 1,
        state.guesses[guessIndex]
          .map((char) => {
            switch (char.result) {
              case 'correct':
                return chalk.green(char.character.toUpperCase())
              case 'misplaced':
                return chalk.yellow(char.character.toUpperCase())
              case 'wrong':
                return chalk.gray(char.character.toUpperCase())
            }
          })
          .join('')
      )
    }
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
