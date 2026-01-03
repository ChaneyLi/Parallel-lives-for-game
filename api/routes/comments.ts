import express from 'express'
import { getComments, createComment, deleteComment } from '../controllers/commentController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// 获取故事的评论列表（公开接口）
router.get('/story/:storyId', getComments)

// 创建评论（需要认证）
router.post('/story/:storyId', authenticateToken, createComment)

// 删除评论（需要认证）
router.delete('/:commentId', authenticateToken, deleteComment)

export default router
