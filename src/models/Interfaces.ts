export type EvaluationResult = 'correct' | 'misplaced' | 'wrong'

export interface GuessCharacterEvaluation {
  character: string
  result: EvaluationResult
}

export type GuessEvaluation = Array<GuessCharacterEvaluation>

export interface GameParameters {
  readonly answerLength: number
  readonly maxGuesses: number
}

export interface GameState extends GameParameters {
  guesses: GuessEvaluation[]
}

export interface Evaluator {
  prepare(): Promise<void>
  evaluateGuess(guess: string): Promise<GuessEvaluation>
}

export interface Guesser {
  prepare(): Promise<void>
  nextGuess(state: GameState): Promise<string>
}
