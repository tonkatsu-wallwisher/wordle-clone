## Wordle Clone

[![asciicast](https://asciinema.org/a/5h2Be1cIUnAE1xLDqKnRF2Ffk.svg)](https://asciinema.org/a/5h2Be1cIUnAE1xLDqKnRF2Ffk)

How to play locally:

```
yarn install
yarn play
```

You can run `yarn play --help` to see available parameters for the game:

```
$ yarn play

Usage: play [options]

Options:
  -l, --length <number>   length of the word (default: 5)
  -g, --guesses <number>  maximum number of guesses (default: 6)
  -p, --player <type>     player of the game (choices: "ai", "human", default: "human")
  -e, --evaluator <type>  evaluator of player's guesses (choices: "random", "human", default: "random")
  -h, --help              display help for command
```
