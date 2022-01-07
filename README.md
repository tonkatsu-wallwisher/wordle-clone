## Wordle Clone

[![asciicast](https://asciinema.org/a/5h2Be1cIUnAE1xLDqKnRF2Ffk.svg)](https://asciinema.org/a/5h2Be1cIUnAE1xLDqKnRF2Ffk)

How to play locally:

```sh
yarn install
yarn play
```

How to change game parameters:

```typescript
// src/play.ts

const WORD_LENGTH = 5 // Change this to guess words of a different length
const MAX_GUESSES = 6 // Change this to have more/fewer guesses
```
