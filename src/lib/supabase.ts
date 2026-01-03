import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库类型定义
export interface User {
  id: string
  email: string
  nickname: string
  avatar_url?: string
  plan: 'free' | 'premium'
  usage_count: number
  created_at: string
  updated_at: string
}

export interface Story {
  id: string
  user_id: string
  title: string
  summary: string
  input_data: {
    birthplace: string
    career: string
    personality?: string
    relationship: string
    dream_regret: string
  }
  tone: 'warm' | 'funny' | 'romantic' | 'dark'
  cover_image_url?: string
  likes_count: number
  views_count: number
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface StorySegment {
  id: string
  story_id: string
  segment_order: number
  title: string
  content: string
  image_url?: string
  created_at: string
}

export interface Like {
  id: string
  user_id: string
  story_id: string
  created_at: string
}

export interface Comment {
  id: string
  user_id: string
  story_id: string
  content: string
  created_at: string
}