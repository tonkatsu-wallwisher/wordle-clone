import { GameState, Guesser } from '../models/Interfaces'
import readline from 'readline'
import chalk from 'chalk'
import readDictionary from '../utils/readDictionary'

export default class HumanGuesser implements Guesser {
  private validWords!: Set<string>

  prepare = async (): Promise<void> => {
    this.validWords = new Set(await readDictionary())
  }

  nextGuess(state: GameState): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (state.guesses.length) {
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
