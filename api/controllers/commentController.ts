import { Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase.js'

/**
 * 获取故事的评论列表
 */
export const getComments = async (req: Request, res: Response) => {
  try {
    const { storyId } = req.params
    const { page = 1, limit = 20 } = req.query
    
    const offset = (Number(page) - 1) * Number(limit)
    
    // 获取评论列表
    const { data: comments, error } = await supabaseAdmin
      .from('comments')
      .select(`
        *,
        users!inner(nickname, avatar_url)
      `)
      .eq('story_id', storyId)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1)
    
    if (error) {
      console.error('Get comments error:', error)
      return res.status(500).json({
        success: false,
        message: '获取评论失败'
      })
    }
    
    // 获取评论总数
    const { count, error: countError } = await supabaseAdmin
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('story_id', storyId)
    
    if (countError) {
      console.error('Get comments count error:', countError)
    }
    
    res.json({
      success: true,
      comments: comments || [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    })
    
  } catch (error) {
    console.error('Get comments error:', error)
    res.status(500).json({
      success: false,
      message: '获取评论失败'
    })
  }
}

/**
 * 创建评论
 */
export const createComment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      })
    }
    
    const { storyId } = req.params
    const { content } = req.body
    
    // 验证评论内容
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '评论内容不能为空'
      })
    }
    
    if (content.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: '评论内容不能超过500个字符'
      })
    }
    
    // 检查故事是否存在
    const { data: story, error: storyError } = await supabaseAdmin
      .from('stories')
      .select('id, is_public')
      .eq('id', storyId)
      .single()
    
    if (storyError || !story) {
      return res.status(404).json({
        success: false,
        message: '故事不存在'
      })
    }
    
    // 检查故事是否公开
    if (!story.is_public) {
      return res.status(403).json({
        success: false,
        message: '无法评论私密故事'
      })
    }
    
    // 创建评论
    const { data: comment, error: commentError } = await supabaseAdmin
      .from('comments')
      .insert({
        user_id: req.user.userId,
        story_id: storyId,
        content: content.trim()
      })
      .select(`
        *,
        users!inner(nickname, avatar_url)
      `)
      .single()
    
    if (commentError) {
      console.error('Create comment error:', commentError)
      return res.status(500).json({
        success: false,
        message: '评论创建失败'
      })
    }
    
    // 更新故事的评论数
    const { error: updateError } = await supabaseAdmin
      .rpc('increment_comments_count', { story_id: storyId })
    
    if (updateError) {
      console.error('Update comments count error:', updateError)
    }
    
    res.status(201).json({
      success: true,
      message: '评论创建成功',
      comment
    })
    
  } catch (error) {
    console.error('Create comment error:', error)
    res.status(500).json({
      success: false,
      message: '评论创建失败'
    })
  }
}

/**
 * 删除评论
 */
export const deleteComment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      })
    }
    
    const { commentId } = req.params
    
    // 获取评论信息
    const { data: comment, error: getError } = await supabaseAdmin
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .single()
    
    if (getError || !comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      })
    }
    
    // 检查权限（只有评论作者可以删除）
    if (comment.user_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: '无权删除此评论'
      })
    }
    
    // 删除评论
    const { error: deleteError } = await supabaseAdmin
      .from('comments')
      .delete()
      .eq('id', commentId)
    
    if (deleteError) {
      console.error('Delete comment error:', deleteError)
      return res.status(500).json({
        success: false,
        message: '评论删除失败'
      })
    }
    
    // 更新故事的评论数
    const { error: updateError } = await supabaseAdmin
      .rpc('decrement_comments_count', { story_id: comment.story_id })
    
    if (updateError) {
      console.error('Update comments count error:', updateError)
    }
    
    res.json({
      success: true,
      message: '评论删除成功'
    })
    
  } catch (error) {
    console.error('Delete comment error:', error)
    res.status(500).json({
      success: false,
      message: '评论删除失败'
    })
  }
}
