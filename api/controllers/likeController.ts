import { Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase.js'
import { AuthenticatedRequest } from '../middleware/auth.js'

export const toggleLike = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: storyId } = req.params
    const userId = req.user?.userId
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
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
    
    // 检查是否已经点赞
    const { data: existingLike, error: likeCheckError } = await supabaseAdmin
      .from('likes')
      .select('id')
      .eq('story_id', storyId)
      .eq('user_id', userId)
      .single()
    
    if (likeCheckError && likeCheckError.code !== 'PGRST116') {
      console.error('Check like error:', likeCheckError)
      return res.status(500).json({
        success: false,
        message: '检查点赞状态失败'
      })
    }
    
    let isLiked = false
    
    if (existingLike) {
      // 取消点赞
      const { error: deleteError } = await supabaseAdmin
        .from('likes')
        .delete()
        .eq('story_id', storyId)
        .eq('user_id', userId)
      
      if (deleteError) {
        console.error('Delete like error:', deleteError)
        return res.status(500).json({
          success: false,
          message: '取消点赞失败'
        })
      }
      
      isLiked = false
    } else {
      // 添加点赞
      const { error: insertError } = await supabaseAdmin
        .from('likes')
        .insert({
          story_id: storyId,
          user_id: userId
        })
      
      if (insertError) {
        console.error('Insert like error:', insertError)
        return res.status(500).json({
          success: false,
          message: '点赞失败'
        })
      }
      
      isLiked = true
    }
    
    // 获取更新后的故事信息（包含最新的点赞数）
    const { data: updatedStory, error: storyUpdateError } = await supabaseAdmin
      .from('stories')
      .select('likes_count')
      .eq('id', storyId)
      .single()
    
    if (storyUpdateError) {
      console.error('Get updated story error:', storyUpdateError)
      return res.status(500).json({
        success: false,
        message: '获取更新后的故事信息失败'
      })
    }
    
    res.json({
      success: true,
      is_liked: isLiked,
      likes_count: updatedStory.likes_count || 0
    })
    
  } catch (error) {
    console.error('Toggle like error:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}
