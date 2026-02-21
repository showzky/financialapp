export const WISHLIST_NOTES_MAX_LENGTH = 2000

const stripControlCharacters = (value: string): string =>
  Array.from(value)
    .filter((character) => {
      const codePoint = character.codePointAt(0) ?? 0
      const isAsciiControl =
        (codePoint >= 0 && codePoint <= 8) || codePoint === 11 || codePoint === 12
      const isMoreAsciiControl = (codePoint >= 14 && codePoint <= 31) || codePoint === 127
      return !isAsciiControl && !isMoreAsciiControl
    })
    .join('')

export const normalizeWishlistNotes = (value: string | undefined) => {
  if (value === undefined) {
    return undefined
  }

  const withoutControlCharacters = stripControlCharacters(value)
  const normalizedLineBreaks = withoutControlCharacters.replace(/\r\n?/g, '\n')
  const normalizedWhitespace = normalizedLineBreaks
    .replace(/[ \t]+/g, ' ')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim()

  if (normalizedWhitespace === '') {
    return null
  }

  return normalizedWhitespace
}
