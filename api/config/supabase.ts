import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

// 服务端使用 service role key 进行管理操作
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// 客户端使用 anon key
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
if (!supabaseAnonKey) {
  throw new Error('Missing Supabase anon key')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)