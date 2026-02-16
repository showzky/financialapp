// ADD THIS: Supabase browser client for querying public data with anon key
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// ADD THIS: avoid throwing at module load so the whole app does not crash
let client: SupabaseClient | null = null

export const getSupabaseClient = (): SupabaseClient | null => {
  if (client) return client
  if (!supabaseUrl || !supabaseAnonKey) return null

  client = createClient(supabaseUrl, supabaseAnonKey)
  return client
}
