import { db } from '../config/db.js'

export type AuthSettings = {
  publicRegistrationEnabled: boolean
}

type AuthSettingsRow = {
  publicRegistrationEnabled: boolean
}

const SETTINGS_KEY = 'auth.public_registration_enabled'

const readPublicRegistrationEnabled = async (): Promise<boolean> => {
  const result = await db.query<{ value: unknown }>(
    `
    SELECT value
    FROM app_settings
    WHERE key = $1
    LIMIT 1
    `,
    [SETTINGS_KEY],
  )

  const row = result.rows[0]
  if (!row) {
    return true
  }

  if (typeof row.value === 'boolean') {
    return row.value
  }

  if (typeof row.value === 'string') {
    return row.value.toLowerCase() === 'true'
  }

  return true
}

export const authSettingsModel = {
  async get(): Promise<AuthSettings> {
    const publicRegistrationEnabled = await readPublicRegistrationEnabled()
    return { publicRegistrationEnabled }
  },

  async update(input: Partial<AuthSettings>): Promise<AuthSettings> {
    if (typeof input.publicRegistrationEnabled === 'boolean') {
      await db.query<AuthSettingsRow>(
        `
        INSERT INTO app_settings (key, value)
        VALUES ($1, to_jsonb($2::boolean))
        ON CONFLICT (key)
        DO UPDATE SET
          value = EXCLUDED.value,
          updated_at = NOW()
        `,
        [SETTINGS_KEY, input.publicRegistrationEnabled],
      )
    }

    return this.get()
  },
}
