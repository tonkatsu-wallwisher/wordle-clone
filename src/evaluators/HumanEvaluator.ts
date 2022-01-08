import chalk from 'chalk'
import readline from 'readline'
import {
  Evaluator,
  GameParameters,
  GuessCharacterEvaluation,
  GuessEvaluation,
} from '../models/Interfaces'
import formatCharEvaluation from '../utils/formatCharEvaluation'

export default class HumanEvaluator implements Evaluator {
  prepare = async (_params: GameParameters): Promise<void> => {
    // Do nothing
  }

  evaluateGuess = async (guess: string): Promise<GuessEvaluation> => {
    console.log(chalk.bold('----------------'))
    console.log(chalk.bold('Guesser guessed'), chalk.bold.yellow(guess.toUpperCase()))
    return new Promise<GuessEvaluation>((resolve, reject) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      })
      rl.on('error', (error) => {
        rl.close()
        reject(error)
      })
      const promptForEvaluation = () =>
        new Promise<string>((resolve) => {
          rl.question(
            `Evaluate (${chalk.green('O - correct')}, ${chalk.yellow(
              'M - misplaced'
            )}, ${chalk.gray('X - wrong')}): `,
            (evaluation) => resolve(evaluation.trim().toUpperCase())
          )
        })
      const promptForValidEvaluation = async (): Promise<GuessEvaluation> => {
        const evaluation = await promptForEvaluation()
        if (evaluation.length !== guess.length) {
          console.log(chalk.yellow('Evaluation must have the same length as the guess.'))
          return promptForValidEvaluation()
        }
        if (!/^[OMX]+$/.test(evaluation)) {
          console.log(chalk.yellow('Invalid characters found in the evaluation.'))
          return promptForValidEvaluation()
        }
        return [...evaluation].map(
          (symbol, index): GuessCharacterEvaluation => ({
            character: guess[index],
            result: symbol === 'O' ? 'correct' : symbol === 'M' ? 'misplaced' : 'wrong',
          })
        )
      }

      promptForValidEvaluation().then((evaluation) => {
        rl.close()

        console.log('Evaluated guess:')
        console.log(
          evaluation
            .map(({ character, result }) => formatCharEvaluation(character, result))
            .join('')
        )

        resolve(evaluation)
      })
    })
  }
}
