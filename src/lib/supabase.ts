import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface UserSave {
  id?: string
  user_id: string
  save_name: string
  save_data: any
  created_at?: string
  updated_at?: string
}

// Auth helper functions
export const getCurrentUser = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { user: session?.user || null, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}