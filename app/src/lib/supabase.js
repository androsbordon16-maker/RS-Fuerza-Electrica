import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wlxijxrbhuecnopybdwc.supabase.co'
const SUPABASE_KEY = 'sb_publishable_Ii6rNzeuy0dra82D0AbGBA_hYHsSygc'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
