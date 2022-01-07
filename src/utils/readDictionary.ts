import readline from 'readline'
import path from 'path'
import fs from 'fs-extra'

const DICTIONARY_FILE_PATH = path.join(__dirname, 'words_alpha.txt')

export default async function readDictionary(wordLength?: number): Promise<string[]> {
  return new Promise<string[]>((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(DICTIONARY_FILE_PATH),
      output: process.stdout,
      terminal: false,
    })
    const words: string[] = []
    rl.on('error', reject)
    rl.on('close', () => resolve(words))
    if (typeof wordLength === 'number') {
      rl.on('line', (content) => {
        const trimmedContent = content.trim()
        if (trimmedContent.length !== wordLength) return
        words.push(trimmedContent)
      })
    } else {
      rl.on('line', (content) => words.push(content.trim()))
    }
  })
}
