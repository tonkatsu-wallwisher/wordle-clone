import chalk from 'chalk'
import LocalEvaluator from './evaluators/LocalEvaluator'
import RandomDictionaryWordEvaluator from './evaluators/RandomDictionaryWordEvaluator'
import GameCoordinator from './game/GameCoordinator'
import HumanGuesser from './guessers/HumanGuesser'
import { Evaluator, Guesser } from './models/Interfaces'

const WORD_LENGTH = 5

const evaluator: Evaluator = new RandomDictionaryWordEvaluator(WORD_LENGTH)
const guesser: Guesser = new HumanGuesser()

const coordinator = new GameCoordinator({
  wordLength: WORD_LENGTH,
  maxGuesses: 6,
})

async function main() {
  await Promise.all([evaluator.prepare(), guesser.prepare()])
  const stats = await coordinator.play(evaluator, guesser)
  switch (stats.result) {
    case 'success':
      console.log(chalk.green('Congratulations!'))
      break
    case 'failure':
      console.log(chalk.red('Close, but no cigars!'))
      break
  }
  console.log('Guesses:')
  for (const guess of stats.guesses) {
    console.log(guess)
  }
  if (typeof (evaluator as LocalEvaluator).answer === 'string') {
    console.log('Answer:', chalk.yellow((evaluator as LocalEvaluator).answer))
  }
}

main()
