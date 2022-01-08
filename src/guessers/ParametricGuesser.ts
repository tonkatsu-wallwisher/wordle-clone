import _ from 'lodash'
import { GameParameters, GameState, Guesser, GuessEvaluation } from '../models/Interfaces'
import readDictionary from '../utils/readDictionary'

export interface GuessParameters {
  uniqueness: number
  presence: number
  position: number
}

interface GuessMetadata {
  /**
   * A collection of all characters that have been guessed, regardless of their
   * correctness.
   */
  guessedCharacters: Set<string>
  /**
   * These are the positions of the correct characters, in the form of char ->
   * indexes
   */
  correctCharacters: { [char: string]: number[] }
  /**
   * This is the reversed version of `definitiveCharacters`, in case we need to
   * access data from the index instead.
   */
  correctIndexes: { [index: number]: string }
  /**
   * Misplaced characters and the indexes where they should NOT be.
   */
  misplacedCharacters: { [char: string]: number[] }
  /**
   * Characters that don't appear in the correct answer at all.
   */
  wrongCharacters: Set<string>
}

export default class ParametricGuesser implements Guesser {
  readonly guessParams: GuessParameters
  /** List of all eligible words. */
  private dictionary: string[] = []
  /** List of words that are possible candidates for a correct guess. */
  private filteredDictionary: string[] = []
  /** List of probability that a character occurs at a certain position. */
  private charProbabilities: Array<{ [char: string]: number }> = []

  constructor(guessParams: GuessParameters) {
    this.guessParams = guessParams
  }

  prepare = async (params: GameParameters): Promise<void> => {
    this.dictionary = await readDictionary(params.answerLength)
    this.refilterDictionary([])
  }

  private wordSatisfiesEvaluation = (word: string, evaluation: GuessEvaluation): boolean => {
    for (let charIndex = 0; charIndex < evaluation.length; ++charIndex) {
      const { character, result } = evaluation[charIndex]
      if (result === 'correct' && character !== word[charIndex]) return false
      if (result === 'misplaced' && (word[charIndex] === character || !word.includes(character))) {
        return false
      }
      if (result === 'wrong' && character === word[charIndex]) return false
    }
    return true
  }

  private refilterDictionary = (guesses: GuessEvaluation[]) => {
    if (guesses.length === 0) {
      this.filteredDictionary = [...this.dictionary]
    } else {
      this.filteredDictionary = this.filteredDictionary.filter((word) =>
        guesses.every((guess) => this.wordSatisfiesEvaluation(word, guess))
      )
    }
    const charCounts: Array<{ [char: string]: number }> = _.range(
      0,
      this.filteredDictionary[0].length
    ).map(() => ({}))
    for (const word of this.filteredDictionary) {
      for (let charIndex = 0; charIndex < word.length; ++charIndex) {
        charCounts[charIndex][word[charIndex]] = (charCounts[charIndex][word[charIndex]] ?? 0) + 1
      }
    }
    this.charProbabilities = charCounts.map((charCountMap) =>
      _.mapValues(charCountMap, (count) => count / this.filteredDictionary.length)
    )
  }

  private calculateGuessMetadata = (guesses: GuessEvaluation[]): GuessMetadata => {
    const guessedCharacters: GuessMetadata['guessedCharacters'] = new Set()
    const correctCharacters: GuessMetadata['correctCharacters'] = {}
    const correctIndexes: GuessMetadata['correctIndexes'] = {}
    const misplacedCharacters: GuessMetadata['misplacedCharacters'] = {}
    const wrongCharacters: GuessMetadata['wrongCharacters'] = new Set()

    // Process correct guesses first
    for (const guess of guesses) {
      guess.forEach(({ character, result }, index) => {
        if (result !== 'correct') return
        if (!correctCharacters[character]) {
          correctCharacters[character] = []
        }
        correctCharacters[character].push(index)
        correctIndexes[index] = character
      })
    }

    // Process misplacements
    for (const guess of guesses) {
      guess.forEach(({ character, result }, index) => {
        if (result !== 'misplaced') return
        // If we have already guessed correctly where this character belongs, we
        // don't consider this misplacement
        if (!_.isEmpty(correctCharacters[character])) return
        if (!misplacedCharacters[character]) {
          misplacedCharacters[character] = []
        }
        misplacedCharacters[character].push(index)
      })
    }

    // Process wrong guesses
    guesses.forEach((guess) =>
      guess
        .filter(({ result }) => result === 'wrong')
        .forEach(({ character }) => wrongCharacters.add(character))
    )

    // Process all guesses last
    guesses
      .flatMap((guess) => guess)
      .map(({ character }) => character)
      .forEach((character) => guessedCharacters.add(character))

    return {
      guessedCharacters,
      correctCharacters,
      correctIndexes,
      misplacedCharacters,
      wrongCharacters,
    }
  }

  /**
   * @param word The word to be evaluated.
   * @param metadata The metadata describing the guesses we've made so far.
   */
  private evaluateWordChoice = (
    word: string,
    metadata: GuessMetadata,
    urgencyFactor: number
  ): number => {
    const characterMetrics = [...word].map((character, charIndex): number => {
      // How unique this character is, with 1 being unique and 0 being too common.
      const uniquenessFactor = 1 / [...word].filter((wordChar) => character === wordChar).length
      // Presence entropy indicates how much we will know more about which
      // characters are present and absent from the answer if we choose this
      // word. If we have already guessed this character this value will be 0
      // since we know nothing more about the presence of the character even if
      // we guess it. If we haven't, then how much more we will know depends on
      // how common this character is among all the rest of the words.
      const presenceEntropy = metadata.guessedCharacters.has(character)
        ? 0
        : _.mean(this.charProbabilities.map((probs) => probs[character] ?? 0))
      // Position entropy indicates how much information we will gain about
      // the location of misplaced characters if we pick this word.
      const positionEntropy = metadata.misplacedCharacters[character]
        ? _.mean(
            this.charProbabilities
              .filter((_, index) => !metadata.misplacedCharacters[character].includes(index))
              .map((probs) => probs[character] ?? 0)
          )
        : 0
      // Defines how much we are exploiting the result vs exploring
      const exploitationFactor =
        metadata.correctIndexes[charIndex] === character
          ? 1
          : metadata.misplacedCharacters[character] &&
            !metadata.misplacedCharacters[character].includes(charIndex)
          ? 0.67
          : metadata.wrongCharacters.has(character)
          ? 0
          : 0.33

      return (
        (uniquenessFactor * this.guessParams.uniqueness +
          presenceEntropy * this.guessParams.presence +
          positionEntropy * this.guessParams.position) /
          Object.keys(this.guessParams).length /
          urgencyFactor +
        exploitationFactor * urgencyFactor
      )
    })
    return _.mean(characterMetrics)
  }

  nextGuess = async (state: GameState): Promise<string> => {
    if (state.guesses.length) {
      this.refilterDictionary(state.guesses)
    }

    const guessMetadata = this.calculateGuessMetadata(state.guesses)
    const urgencyFactor = state.guesses.length / (state.maxGuesses - 1)

    let bestScore = 0
    let bestGuess: string | undefined

    for (const word of this.filteredDictionary) {
      const score = this.evaluateWordChoice(word, guessMetadata, urgencyFactor)
      if (score <= bestScore) continue
      bestScore = score
      bestGuess = word
    }

    if (!bestGuess) {
      return _.first(this.filteredDictionary) ?? _.first(this.dictionary)!
    } else {
      return bestGuess
    }
  }
}
