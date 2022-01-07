import readDictionary from './readDictionary'

export default async function selectRandomWord(wordLength: number): Promise<string> {
  const limitedWords = await readDictionary(wordLength)
  const randomWordIndex = Math.floor(Math.random() * limitedWords.length)
  const randomWord = limitedWords[randomWordIndex]
  return randomWord
}
