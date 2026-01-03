import { Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase'
import { hashPassword, verifyPassword, validatePasswordStrength } from '../utils/password'
import { generateToken } from '../utils/jwt'

/**
 * 用户注册
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, nickname } = req.body
    
    // 验证必填字段
    if (!email || !password || !nickname) {
      return res.status(400).json({
        success: false,
        message: '邮箱、密码和昵称都是必填项'
      })
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: '邮箱格式不正确'
      })
    }
    
    // 验证密码强度
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      })
    }
    
    // 检查邮箱是否已存在
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: '该邮箱已被注册'
      })
    }
    
    // 哈希密码
    const hashedPassword = await hashPassword(password)
    
    // 创建用户
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        password_hash: hashedPassword,
        nickname,
        plan: 'free',
        usage_count: 0
      })
      .select('id, email, nickname, plan, usage_count, created_at')
      .single()
    
    if (error) {
      console.error('User creation error:', error)
      return res.status(500).json({
        success: false,
        message: '用户创建失败'
      })
    }
    
    // 生成JWT令牌
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email
    })
    
    res.status(201).json({
      success: true,
      message: '注册成功',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        nickname: newUser.nickname,
        plan: newUser.plan,
        usage_count: newUser.usage_count,
        created_at: newUser.created_at
      }
    })
    
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
}

/**
 * 用户登录
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    
    // 验证必填字段
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '邮箱和密码都是必填项'
      })
    }
    
    // 查找用户
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, password_hash, nickname, plan, usage_count, created_at')
      .eq('email', email)
      .single()
    
    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      })
    }
    
    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.password_hash)
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      })
    }
    
    // 生成JWT令牌
    const token = generateToken({
      userId: user.id,
      email: user.email
    })
    
    res.json({
      success: true,
      message: '登录成功',
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        plan: user.plan,
        usage_count: user.usage_count,
        created_at: user.created_at
      }
    })
    
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
}

/**
 * 获取当前用户信息
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未认证的用户'
      })
    }
    
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, nickname, avatar_url, plan, usage_count, created_at, updated_at')
      .eq('id', req.user.userId)
      .single()
    
    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }
    
    res.json({
      success: true,
      user
    })
    
  } catch (error) {
    console.error('Get current user error:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
}