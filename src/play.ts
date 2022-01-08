import chalk from 'chalk'
import LocalEvaluator from './evaluators/LocalEvaluator'
import RandomDictionaryWordEvaluator from './evaluators/RandomDictionaryWordEvaluator'
import GameCoordinator from './game/GameCoordinator'
import HumanGuesser from './guessers/HumanGuesser'
import { Evaluator, GameParameters, Guesser } from './models/Interfaces'
import _ from 'lodash'
import formatCharEvaluation from './utils/formatCharEvaluation'
import ParametricGuesser from './guessers/ParametricGuesser'

const WORD_LENGTH = 5
const MAX_GUESSES = 6

const gameParams: GameParameters = {
  answerLength: WORD_LENGTH,
  maxGuesses: MAX_GUESSES,
}

const evaluator: Evaluator = new RandomDictionaryWordEvaluator()
const guesser: Guesser = new ParametricGuesser({
  uniqueness: 0.58,
  presence: 0.71,
  position: 0.23,
})

const coordinator = new GameCoordinator({ ...gameParams })

async function main() {
  await Promise.all([evaluator.prepare(gameParams), guesser.prepare(gameParams)])
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

  console.log()

  // Print out the user's guesses
  stats.guesses.forEach((guess, index) => {
    console.log(
      index + 1,
      guess.map(({ character, result }) => formatCharEvaluation(character, result)).join('')
    )
  })

  console.log()

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
