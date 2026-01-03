import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

interface User {
  id: string
  email: string
  nickname: string
  avatar_url?: string
  plan: 'free' | 'premium'
  usage_count: number
  created_at: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  register: (email: string, password: string, nickname: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  getCurrentUser: () => Promise<void>
  setLoading: (loading: boolean) => void
}

const API_URL = import.meta.env.VITE_API_URL || window.location.origin

export const useAuthStore = create<AuthState>()(persist(
  (set, get) => ({
    user: null,
    token: null,
    isLoading: false,
    isAuthenticated: false,
    
    login: async (email: string, password: string) => {
      set({ isLoading: true })
      
      try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        })
        
        const data = await response.json()
        
        if (data.success) {
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false
          })
          return { success: true }
        } else {
          set({ isLoading: false })
          return { success: false, message: data.message }
        }
      } catch (error) {
        console.error('Login error:', error)
        set({ isLoading: false })
        return { success: false, message: '网络错误，请稍后重试' }
      }
    },
    
    register: async (email: string, password: string, nickname: string) => {
      set({ isLoading: true })
      
      try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password, nickname })
        })
        
        const data = await response.json()
        
        if (data.success) {
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false
          })
          return { success: true }
        } else {
          set({ isLoading: false })
          return { success: false, message: data.message }
        }
      } catch (error) {
        console.error('Register error:', error)
        set({ isLoading: false })
        return { success: false, message: '网络错误，请稍后重试' }
      }
    },
    
    logout: () => {
      set({
        user: null,
        token: null,
        isAuthenticated: false
      })
    },
    
    getCurrentUser: async () => {
      const { token } = get()
      
      if (!token) {
        return
      }
      
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        const data = await response.json()
        
        if (data.success) {
          set({ user: data.user })
        } else {
          // Token可能已过期，清除认证状态
          set({
            user: null,
            token: null,
            isAuthenticated: false
          })
        }
      } catch (error) {
        console.error('Get current user error:', error)
      }
    },
    
    setLoading: (loading: boolean) => {
      set({ isLoading: loading })
    }
  }),
  {
    name: 'auth-storage',
    partialize: (state) => ({
      user: state.user,
      token: state.token,
      isAuthenticated: state.isAuthenticated
    })
  }
))
