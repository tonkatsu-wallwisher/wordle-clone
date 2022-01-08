import chalk from 'chalk'
import { EvaluationResult } from '../models/Interfaces'

export default function formatCharEvaluation(
  char: string,
  evaluationResult: EvaluationResult
): string {
  let formatFunction: (string: string) => string
  switch (evaluationResult) {
    case 'correct':
      formatFunction = chalk.green
      break
    case 'misplaced':
      formatFunction = chalk.yellow
      break
    case 'wrong':
      formatFunction = chalk.gray
      break
    default:
      formatFunction = chalk.white
      break
  }
  return formatFunction(char.toUpperCase())
}
