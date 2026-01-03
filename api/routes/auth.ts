import { Router } from 'express'
import { register, login, getCurrentUser } from '../controllers/authController.js'
import { authenticateToken } from '../middleware/auth.js'
import rateLimit from 'express-rate-limit'

const router = Router()

// 登录和注册的速率限制
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次尝试
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// 用户注册
router.post('/register', authLimiter, register)

// 用户登录
router.post('/login', authLimiter, login)

// 获取当前用户信息（需要认证）
router.get('/me', authenticateToken, getCurrentUser)

export default router
