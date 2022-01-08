import chalk from 'chalk'
import { program, Option } from 'commander'
import _ from 'lodash'
import HumanEvaluator from './evaluators/HumanEvaluator'
import LocalEvaluator from './evaluators/LocalEvaluator'
import RandomDictionaryWordEvaluator from './evaluators/RandomDictionaryWordEvaluator'
import GameCoordinator from './game/GameCoordinator'
import HumanGuesser from './guessers/HumanGuesser'
import ParametricGuesser from './guessers/ParametricGuesser'
import { Evaluator, GameParameters, Guesser } from './models/Interfaces'
import formatCharEvaluation from './utils/formatCharEvaluation'

async function main() {
  program
    .addOption(new Option('-l, --length <number>', 'length of the word').default(5))
    .addOption(new Option('-g, --guesses <number>', 'maximum number of guesses').default(6))
    .addOption(
      new Option('-p, --player <type>', 'player of the game')
        .choices(['ai', 'human'])
        .default('human')
    )
    .addOption(
      new Option('-e, --evaluator <type>', "evaluator of player's guesses")
        .choices(['random', 'human'])
        .default('random')
    )
    .parse(process.argv)

  const options = program.opts()
  const answerLength = parseInt(options.length)
  const maxGuesses = parseInt(options.guesses)
  const player = options.player as 'ai' | 'human'
  const evaluatorType = options.evaluator as 'random' | 'human'

  const gameParams: GameParameters = {
    answerLength,
    maxGuesses,
  }

  // Decide who's evaluating the guesses
  let evaluator: Evaluator
  if (evaluatorType === 'human') {
    evaluator = new HumanEvaluator()
  } else {
    evaluator = new RandomDictionaryWordEvaluator()
  }

  // Decide who's playing the game
  let guesser: Guesser
  if (player === 'ai') {
    guesser = new ParametricGuesser({
      uniqueness: 0.58,
      presence: 0.71,
      position: 0.23,
    })
  } else {
    guesser = new HumanGuesser()
  }

  const coordinator = new GameCoordinator({ ...gameParams })

  // Prepare the agents
  await Promise.all([evaluator.prepare(gameParams), guesser.prepare(gameParams)])

  // Play the game
  const stats = await coordinator.play(evaluator, guesser)

  // Print out the result
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
  console.log(`Wordle ${stats.guesses.length}/${maxGuesses}`)
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
