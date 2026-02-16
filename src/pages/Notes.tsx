// ADD THIS: Notes page equivalent for Vite/React (Next.js app route alternative)
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase/client'

type Note = {
  id: string
  [key: string]: unknown
}

export const Notes = () => {
  const [notes, setNotes] = useState<Note[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // ADD THIS: fetch notes from Supabase table on page load
    const loadNotes = async () => {
      const { data, error: supabaseError } = await supabase.from('notes').select('*')

      if (supabaseError) {
        setError(supabaseError.message)
        return
      }

      setNotes((data ?? []) as Note[])
    }

    void loadNotes()
  }, [])

  if (error) {
    return <pre>{JSON.stringify({ error }, null, 2)}</pre>
  }

  return <pre>{JSON.stringify(notes, null, 2)}</pre>
}
