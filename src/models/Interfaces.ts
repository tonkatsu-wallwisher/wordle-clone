export interface GuessCharacterEvaluation {
  character: string
  result: 'correct' | 'misplaced' | 'wrong'
}

export type GuessEvaluation = Array<GuessCharacterEvaluation>

export interface GameState {
  answerLength: number
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
