import wordsToNumbers from 'words-to-numbers'

/**
 * Author: Spencer Kline
 *
 * Example:
 *  original => 'address is one two three new york avenue'
 *  parsed => 'address is 1 2 3 new york avenue'
 *  result => 'address is 123 three new york avenue'
 *
 * @param {string} transcript
 * @return {string}
*/

export const formatTranscript = (transcript: string): string => {
  const parsedWords = String(wordsToNumbers(transcript))

  const words = parsedWords.split(' ')
  let result = words[0]

  words.forEach((word, index) => {
    if (index > 0) {
      const previousIsNumber = parseInt(words[index - 1], 10) >= 0
      const currentIsNumber = parseInt(word, 10) >= 0
      result += (previousIsNumber && currentIsNumber) ? word : ` ${word}`
    }
  })
  return result
}
