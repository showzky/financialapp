// ADD THIS: one-time secure local auth credential generator
import { randomBytes } from 'node:crypto'
import { createPasswordHash, generateRandomPassword } from '../utils/passwordHash.js'

const run = async () => {
  const password = generateRandomPassword(24)
  const passwordHash = await createPasswordHash(password)
  const jwtSecret = randomBytes(48).toString('base64url')

  // ADD THIS: output env-ready values for secure local auth setup
  // eslint-disable-next-line no-console
  console.log('Copy these values into backend/.env:')
  // eslint-disable-next-line no-console
  console.log('APP_USERNAME=owner@financetracker.local')
  // eslint-disable-next-line no-console
  console.log(`APP_PASSWORD_HASH=${passwordHash}`)
  // eslint-disable-next-line no-console
  console.log(`LOCAL_AUTH_JWT_SECRET=${jwtSecret}`)
  // eslint-disable-next-line no-console
  console.log(`GENERATED_PASSWORD=${password}`)
}

run().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Failed to generate credentials', error)
  process.exit(1)
})
