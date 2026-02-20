export const WISHLIST_NOTES_MAX_LENGTH = 2000

const controlCharactersPattern = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

export const normalizeWishlistNotes = (value: string | undefined) => {
  if (value === undefined) {
    return undefined
  }

  const withoutControlCharacters = value.replace(controlCharactersPattern, '')
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
