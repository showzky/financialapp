// ADD THIS: reusable bcrypt password helpers independent of runtime env config
import bcrypt from 'bcryptjs'
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const BCRYPT_ROUNDS = 12

const decodeBase64Url = (value: string): Buffer => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4
  const padded = padding === 0 ? normalized : normalized + '='.repeat(4 - padding)
  return Buffer.from(padded, 'base64')
}

const verifyLegacyScryptHash = async (
  plainPassword: string,
  encodedHash: string,
): Promise<boolean> => {
  const parts = encodedHash.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') {
    return false
  }

  const [, nRaw, rRaw, pRaw, saltRaw, expectedRaw] = parts as [
    string,
    string,
    string,
    string,
    string,
    string,
  ]

  const n = Number(nRaw)
  const r = Number(rRaw)
  const p = Number(pRaw)
  if (!Number.isFinite(n) || !Number.isFinite(r) || !Number.isFinite(p)) {
    return false
  }

  try {
    const salt = decodeBase64Url(saltRaw)
    const expected = decodeBase64Url(expectedRaw)
    const derived = scryptSync(plainPassword, salt, expected.length, {
      N: n,
      r,
      p,
    })

    return expected.length === derived.length && timingSafeEqual(expected, derived)
  } catch {
    return false
  }
}

export const generateRandomPassword = (length = 24): string => {
  return randomBytes(length).toString('base64url').slice(0, length)
}

export const createPasswordHash = async (plainPassword: string): Promise<string> => {
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS)
}

export const verifyPasswordHash = async (
  plainPassword: string,
  encodedHash: string,
): Promise<boolean> => {
  if (encodedHash.startsWith('scrypt$')) {
    return verifyLegacyScryptHash(plainPassword, encodedHash)
  }

  try {
    return await bcrypt.compare(plainPassword, encodedHash)
  } catch {
    return false
  }
}
