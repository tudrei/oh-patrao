import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wqrjvgmhqcaxskspatwv.supabase.co/rest/v1/E'
const supabaseAnonKey = 'sb_publishable_TsWKUdaD5A6t3uwy4z8qRQ_PRnozG0V'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
