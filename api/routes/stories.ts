import { Router } from 'express'
import { createStory, getStory, getStories, getUserStories, getLikedStories, toggleStoryVisibility, deleteStory, regenerateStory } from '../controllers/storyController'
import { authenticateToken, optionalAuth } from '../middleware/auth'
import { toggleLike } from '../controllers/likeController'
import rateLimit from 'express-rate-limit'

const router = Router()

// 故事生成的速率限制
const storyGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 10, // 每小时最多10次生成
  message: {
    success: false,
    message: '故事生成请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// 创建新故事（需要认证和速率限制）
router.post('/generate', authenticateToken, storyGenerationLimiter, createStory)

// 获取公开故事列表（可选认证，用于显示点赞状态）
router.get('/', optionalAuth, getStories)

// 获取用户的故事列表（需要认证）
router.get('/user/me', authenticateToken, getUserStories)

// 获取用户点赞的故事列表（需要认证）
router.get('/liked', authenticateToken, getLikedStories)

// 获取故事详情（可选认证，用于检查访问权限）
router.get('/:id', optionalAuth, getStory)

// 点赞/取消点赞故事
router.post('/:id/like', authenticateToken, toggleLike)

// 切换故事可见性
router.patch('/:id/visibility', authenticateToken, toggleStoryVisibility)

// 重新生成故事（需要认证和速率限制）
router.post('/:id/regenerate', authenticateToken, storyGenerationLimiter, regenerateStory)

// 删除故事
router.delete('/:id', authenticateToken, deleteStory)

export default router