import chalk from 'chalk'
import LocalEvaluator from './evaluators/LocalEvaluator'
import RandomDictionaryWordEvaluator from './evaluators/RandomDictionaryWordEvaluator'
import GameCoordinator from './game/GameCoordinator'
import HumanGuesser from './guessers/HumanGuesser'
import { Evaluator, Guesser } from './models/Interfaces'
import _ from 'lodash'

const WORD_LENGTH = 5
const MAX_GUESSES = 6

const evaluator: Evaluator = new RandomDictionaryWordEvaluator(WORD_LENGTH)
const guesser: Guesser = new HumanGuesser()

const coordinator = new GameCoordinator({
  wordLength: WORD_LENGTH,
  maxGuesses: MAX_GUESSES,
})

async function main() {
  await Promise.all([evaluator.prepare(), guesser.prepare()])
  const stats = await coordinator.play(evaluator, guesser)
  if (_.last(stats.guesses)!.every((char) => char.result === 'correct')) {
    console.log(chalk.green('Congratulations!'))
  } else {
    console.log(chalk.red('Close, but no cigar!'))
  }
  if (typeof (evaluator as LocalEvaluator).answer === 'string') {
    const { answer } = evaluator as LocalEvaluator
    console.log('Answer:', chalk.yellow(answer.toUpperCase()))
  }

  console.log('')

  // Log standard Wordle shareable
  console.log(`Wordle ${stats.guesses.length}/${MAX_GUESSES}`)
  for (const guess of stats.guesses) {
    console.log(
      guess
        .map(({ result }) => {
          switch (result) {
            case 'correct':
              return '🟩'
            case 'misplaced':
              return '🟨'
            case 'wrong':
              return '⬜️'
          }
        })
        .join('')
    )
  }
}

main()
