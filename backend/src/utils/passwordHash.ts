// ADD THIS: reusable password hashing helpers independent of runtime env config
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

const scryptHash = async (
  plainPassword: string,
  salt: Buffer,
  keyLength: number,
  options: { N: number; r: number; p: number; maxmem: number },
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    scrypt(plainPassword, salt, keyLength, options, (error, derivedKey) => {
      if (error) {
        reject(error)
        return
      }

      resolve(derivedKey as Buffer)
    })
  })
}

const decodeBase64Url = (value: string): Buffer => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(normalized, 'base64')
}

const parsePasswordHash = (encodedHash: string) => {
  const parts = encodedHash.split('$')

  if (parts.length !== 6 || parts[0] !== 'scrypt') {
    throw new Error('Invalid password hash format')
  }

  const nRaw = parts[1]
  const rRaw = parts[2]
  const pRaw = parts[3]
  const salt = parts[4]
  const hash = parts[5]

  if (!nRaw || !rRaw || !pRaw || !salt || !hash) {
    throw new Error('Invalid password hash sections')
  }

  const n = Number(nRaw)
  const r = Number(rRaw)
  const p = Number(pRaw)

  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) {
    throw new Error('Invalid password hash parameters')
  }

  return { n, r, p, salt, hash }
}

export const generateRandomPassword = (length = 24): string => {
  return randomBytes(length).toString('base64url').slice(0, length)
}

export const createPasswordHash = async (plainPassword: string): Promise<string> => {
  const n = 16384
  const r = 8
  const p = 1
  const salt = randomBytes(16)

  const derivedKey = await scryptHash(plainPassword, salt, 64, {
    N: n,
    r,
    p,
    maxmem: 64 * 1024 * 1024,
  })

  return [
    'scrypt',
    String(n),
    String(r),
    String(p),
    salt.toString('base64url'),
    derivedKey.toString('base64url'),
  ].join('$')
}

export const verifyPasswordHash = async (
  plainPassword: string,
  encodedHash: string,
): Promise<boolean> => {
  const { n, r, p, salt, hash } = parsePasswordHash(encodedHash)
  const saltBuffer = decodeBase64Url(salt)
  const expectedHashBuffer = decodeBase64Url(hash)

  const derivedKey = await scryptHash(plainPassword, saltBuffer, expectedHashBuffer.length, {
    N: n,
    r,
    p,
    maxmem: 64 * 1024 * 1024,
  })

  if (derivedKey.length !== expectedHashBuffer.length) {
    return false
  }

  return timingSafeEqual(derivedKey, expectedHashBuffer)
}
