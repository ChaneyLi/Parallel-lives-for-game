import { Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase'
import { generateStory, generateCoverImagePrompt, StoryGenerationRequest, AIServiceError } from '../services/deepseekService'
import { generateImage, generateImagePromptForChapter, ImageGenerationError } from '../services/imageService'
import { AuthenticatedRequest } from '../middleware/auth'

/**
 * 生成新故事
 */
export const createStory = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      })
    }
    
    const { birthplace, career, personality, gender, birth_date, relationship, dream_regret, original_story, tone, generate_images } = req.body
    
    // 验证必填字段
    if (!birthplace || !career || !gender || !birth_date || !relationship || !dream_regret || !tone) {
      return res.status(400).json({
        success: false,
        message: '请填写所有必填字段'
      })
    }
    
    // 验证tone值
    const validTones = ['warm', 'funny', 'romantic', 'dark']
    if (!validTones.includes(tone)) {
      return res.status(400).json({
        success: false,
        message: '无效的故事语气'
      })
    }
    
    // 检查用户使用次数限制
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('plan, usage_count')
      .eq('id', req.user.userId)
      .single()
    
    if (user) {
      const maxUsage = user.plan === 'premium' ? 50 : 5 // 免费用户5次，付费用户50次
      if (user.usage_count >= maxUsage) {
        return res.status(403).json({
          success: false,
          message: `您已达到${user.plan === 'premium' ? '付费' : '免费'}计划的使用限制`
        })
      }
    }
    
    // 准备故事生成请求
    const storyRequest: StoryGenerationRequest = {
      birthplace,
      career,
      personality,
      gender,
      birth_date,
      relationship,
      dream_regret,
      original_story,
      tone
    }
    
    // 使用环境变量中的API密钥
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'DeepSeek API密钥未配置，请联系管理员',
        error_code: 'API_KEY_MISSING',
        retryable: false
      });
    }

    // 调用AI服务生成故事
    const generatedStory = await generateStory(storyRequest, apiKey)
    
    // 生成封面图片（如果需要）
    let coverImageUrl = null
    if (generate_images) {
      try {
        const imagePrompt = generateCoverImagePrompt(generatedStory, tone)
        coverImageUrl = await generateImage({
          prompt: imagePrompt,
          size: '1024x1024'
        })
      } catch (imageError) {
        console.error('Cover image generation failed:', imageError)
        // 封面图片生成失败不影响故事创建
      }
    }
    
    // 保存故事到数据库
    const { data: story, error: storyError } = await supabaseAdmin
      .from('stories')
      .insert({
        user_id: req.user.userId,
        title: generatedStory.title,
        summary: generatedStory.summary,
        input_data: storyRequest,
        tone,
        cover_image_url: coverImageUrl,
        is_public: true
      })
      .select()
      .single()
    
    if (storyError) {
      console.error('Story creation error:', storyError)
      return res.status(500).json({
        success: false,
        message: '故事保存失败'
      })
    }
    
    // 生成章节图片（如果需要）
    const segmentsWithImages = []
    const failedImageGenerations = []
    
    for (let i = 0; i < generatedStory.segments.length; i++) {
      const segment = generatedStory.segments[i]
      let imageUrl = null
      
      if (generate_images) {
        // 尝试生成图片，最多重试2次
        let retryCount = 0
        const maxRetries = 2
        
        while (retryCount <= maxRetries && !imageUrl) {
          try {
            const imagePrompt = generateImagePromptForChapter(segment.title, segment.content)
            imageUrl = await generateImage({
              prompt: imagePrompt,
              size: '1024x1024'
            })
            break // 成功生成，跳出重试循环
          } catch (imageError) {
            retryCount++
            console.error(`Chapter ${i + 1} image generation failed (attempt ${retryCount}):`, imageError)
            
            // 如果是不可重试的错误，直接跳出
            if (imageError instanceof ImageGenerationError && !imageError.retryable) {
              break
            }
            
            // 如果还有重试机会，等待一段时间后重试
            if (retryCount <= maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)) // 递增等待时间
            }
          }
        }
        
        // 如果最终还是失败了，记录失败信息
        if (!imageUrl) {
          failedImageGenerations.push(i + 1)
        }
      }
      
      segmentsWithImages.push({
        story_id: story.id,
        segment_order: segment.order || i + 1,
        title: segment.title,
        content: segment.content,
        image_url: imageUrl
      })
    }
    
    // 保存故事段落
    const segments = segmentsWithImages
    
    const { error: segmentsError } = await supabaseAdmin
      .from('story_segments')
      .insert(segments)
    
    if (segmentsError) {
      console.error('Story segments creation error:', segmentsError)
      // 不返回错误，因为主故事已创建成功
    }
    
    // 更新用户使用次数
    await supabaseAdmin
      .from('users')
      .update({ usage_count: (user?.usage_count || 0) + 1 })
      .eq('id', req.user.userId)
    
    // 构建响应消息
    let message = '故事生成成功'
    if (generate_images && failedImageGenerations.length > 0) {
      message += `，但第${failedImageGenerations.join('、')}章的配图生成失败`
    }
    
    res.status(201).json({
      success: true,
      message,
      story_id: story.id,
      story: {
        ...story,
        segments: generatedStory.segments
      },
      failed_image_generations: failedImageGenerations
    })
    
  } catch (error) {
    console.error('Story creation error:', error)
    
    // 处理AI服务错误
    if (error instanceof AIServiceError) {
      const statusCode = error.code === 'API_KEY_MISSING' || error.code === 'INVALID_API_KEY' ? 503 : 500
      return res.status(statusCode).json({
        success: false,
        message: error.userMessage,
        error_code: error.code,
        retryable: error.retryable
      })
    }
    
    // 处理其他错误
    res.status(500).json({
      success: false,
      message: '故事生成失败，请稍后重试',
      error_code: 'UNKNOWN_ERROR',
      retryable: true
    })
  }
}

/**
 * 获取故事详情
 */
export const getStory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    // 获取故事基本信息
    const { data: story, error: storyError } = await supabaseAdmin
      .from('stories')
      .select(`
        *,
        users!inner(nickname, avatar_url)
      `)
      .eq('id', id)
      .single()
    
    if (storyError || !story) {
      return res.status(404).json({
        success: false,
        message: '故事不存在'
      })
    }
    
    // 检查访问权限
    if (!story.is_public && (!req.user || req.user.userId !== story.user_id)) {
      return res.status(403).json({
        success: false,
        message: '无权访问此故事'
      })
    }
    
    // 获取故事段落
    const { data: segments } = await supabaseAdmin
      .from('story_segments')
      .select('*')
      .eq('story_id', id)
      .order('segment_order')
    
    // 更新浏览次数
    await supabaseAdmin
      .from('stories')
      .update({ views_count: story.views_count + 1 })
      .eq('id', id)
    
    res.json({
      success: true,
      story: {
        ...story,
        segments: segments || [],
        user: {
          nickname: Array.isArray(story.users) ? story.users[0]?.nickname : story.users?.nickname,
          avatar_url: Array.isArray(story.users) ? story.users[0]?.avatar_url : story.users?.avatar_url
        }
      }
    })
    
  } catch (error) {
    console.error('Get story error:', error)
    res.status(500).json({
      success: false,
      message: '获取故事失败'
    })
  }
}

/**
 * 获取故事列表
 */
export const getStories = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, user_id, tone, sort = 'latest' } = req.query
    const offset = (Number(page) - 1) * Number(limit)
    
    let query = supabaseAdmin
      .from('stories')
      .select(`
        id,
        title,
        summary,
        tone,
        cover_image_url,
        likes_count,
        comments_count,
        views_count,
        created_at,
        users!inner(nickname, avatar_url)
      `, { count: 'exact' })
      .eq('is_public', true)
      .range(offset, offset + Number(limit) - 1)
    
    // 根据排序参数设置排序方式
    switch (sort) {
      case 'popular':
        query = query.order('likes_count', { ascending: false })
        break
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      case 'latest':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }
    
    // 按用户筛选
    if (user_id) {
      query = query.eq('user_id', user_id)
    }
    
    // 按语气筛选
    if (tone) {
      query = query.eq('tone', tone)
    }
    
    const { data: stories, error, count } = await query
    
    if (error) {
      console.error('Get stories error:', error)
      return res.status(500).json({
        success: false,
        message: '获取故事列表失败'
      })
    }
    
    // 如果用户已登录，获取点赞状态
    let storiesWithLikeStatus = stories || []
    if (req.user && stories && stories.length > 0) {
      const storyIds = stories.map(story => story.id)
      const { data: likes } = await supabaseAdmin
        .from('likes')
        .select('story_id')
        .eq('user_id', req.user.userId)
        .in('story_id', storyIds)
      
      const likedStoryIds = new Set(likes?.map(like => like.story_id) || [])
      
      storiesWithLikeStatus = stories.map(story => ({
        ...story,
        is_liked: likedStoryIds.has(story.id),
        user: {
          nickname: (story.users as any)?.nickname || '',
          avatar_url: (story.users as any)?.avatar_url || ''
        }
      }))
    } else {
      storiesWithLikeStatus = stories?.map(story => ({
        ...story,
        is_liked: false,
        user: {
          nickname: (story.users as any)?.nickname || '',
          avatar_url: (story.users as any)?.avatar_url || ''
        }
      })) || []
    }
    
    res.json({
      success: true,
      stories: storiesWithLikeStatus,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / Number(limit))
      }
    })
    
  } catch (error) {
    console.error('Get stories error:', error)
    res.status(500).json({
      success: false,
      message: '获取故事列表失败'
    })
  }
}

/**
 * 获取用户的故事列表
 */
export const getUserStories = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      })
    }
    
    const { page = 1, limit = 10 } = req.query
    const offset = (Number(page) - 1) * Number(limit)
    
    const { data: stories, error, count } = await supabaseAdmin
      .from('stories')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1)
    
    if (error) {
      console.error('Get user stories error:', error)
      return res.status(500).json({
        success: false,
        message: '获取用户故事失败'
      })
    }
    
    res.json({
      success: true,
      stories: stories || [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / Number(limit))
      }
    })
    
  } catch (error) {
    console.error('Get user stories error:', error)
    res.status(500).json({
      success: false,
      message: '获取用户故事失败'
    })
  }
}

/**
 * 切换故事可见性
 */
export const toggleStoryVisibility = async (req: Request, res: Response) => {
  try {
    const { id: storyId } = req.params
    const { is_public } = req.body
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      })
    }
    
    // 检查故事是否存在且属于当前用户
    const { data: story, error: storyError } = await supabaseAdmin
      .from('stories')
      .select('id, user_id')
      .eq('id', storyId)
      .eq('user_id', req.user.userId)
      .single()
    
    if (storyError || !story) {
      return res.status(404).json({
        success: false,
        message: '故事不存在或无权限'
      })
    }
    
    // 更新可见性
    const { error: updateError } = await supabaseAdmin
      .from('stories')
      .update({ is_public })
      .eq('id', storyId)
      .eq('user_id', req.user.userId)
    
    if (updateError) {
      console.error('Update story visibility error:', updateError)
      return res.status(500).json({
        success: false,
        message: '更新故事可见性失败'
      })
    }
    
    res.json({
      success: true,
      message: is_public ? '故事已公开' : '故事已设为私密'
    })
    
  } catch (error) {
    console.error('Toggle story visibility error:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

/**
 * 重新生成故事
 */
export const regenerateStory = async (req: Request, res: Response) => {
  try {
    const { id: storyId } = req.params
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      })
    }
    
    // 获取原故事的input_data和图片设置
    const { data: originalStory, error: storyError } = await supabaseAdmin
      .from('stories')
      .select('input_data, tone, user_id, cover_image_url')
      .eq('id', storyId)
      .eq('user_id', req.user.userId)
      .single()
    
    // 检查原故事是否有图片生成
    const hasImages = originalStory?.cover_image_url !== null
    
    // 如果原故事有图片，检查是否有章节图片
    let hasChapterImages = false
    if (hasImages) {
      const { data: segments } = await supabaseAdmin
        .from('story_segments')
        .select('image_url')
        .eq('story_id', storyId)
        .limit(1)
      
      hasChapterImages = segments && segments.length > 0 && segments[0].image_url !== null
    }
    
    if (storyError || !originalStory) {
      return res.status(404).json({
        success: false,
        message: '故事不存在或无权限'
      })
    }
    
    // 检查用户使用次数限制
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('plan, usage_count')
      .eq('id', req.user.userId)
      .single()
    
    if (user) {
      const maxUsage = user.plan === 'premium' ? 50 : 5
      if (user.usage_count >= maxUsage) {
        return res.status(403).json({
          success: false,
          message: `您已达到${user.plan === 'premium' ? '付费' : '免费'}计划的使用限制`
        })
      }
    }
    
    // 使用原有的input_data重新生成故事
    const storyRequest: StoryGenerationRequest = originalStory.input_data
    
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'DeepSeek API密钥未配置，请联系管理员',
        error_code: 'API_KEY_MISSING',
        retryable: false
      })
    }
    
    // 调用AI服务生成新故事
    const generatedStory = await generateStory(storyRequest, apiKey)
    
    // 生成封面图片（如果原故事有图片）
    let coverImageUrl = null
    if (hasImages) {
      try {
        const imagePrompt = generateCoverImagePrompt(generatedStory, originalStory.tone)
        coverImageUrl = await generateImage({
          prompt: imagePrompt,
          size: '1024x1024'
        })
      } catch (imageError) {
        console.error('Cover image generation failed:', imageError)
        // 封面图片生成失败不影响故事创建
      }
    }
    
    // 创建新故事
    const { data: newStory, error: newStoryError } = await supabaseAdmin
      .from('stories')
      .insert({
        user_id: req.user.userId,
        title: generatedStory.title,
        summary: generatedStory.summary,
        input_data: storyRequest,
        tone: originalStory.tone,
        cover_image_url: coverImageUrl,
        is_public: true
      })
      .select()
      .single()
    
    if (newStoryError) {
      console.error('New story creation error:', newStoryError)
      return res.status(500).json({
        success: false,
        message: '故事保存失败'
      })
    }
    
    // 生成章节图片（如果原故事有章节图片）
    const segmentsWithImages = []
    const failedImageGenerations = []
    
    for (let i = 0; i < generatedStory.segments.length; i++) {
      const segment = generatedStory.segments[i]
      let imageUrl = null
      
      if (hasChapterImages) {
        // 尝试生成图片，最多重试2次
        let retryCount = 0
        const maxRetries = 2
        
        while (retryCount <= maxRetries && !imageUrl) {
          try {
            const imagePrompt = generateImagePromptForChapter(segment.title, segment.content)
            imageUrl = await generateImage({
              prompt: imagePrompt,
              size: '1024x1024'
            })
            break // 成功生成，跳出重试循环
          } catch (imageError) {
            retryCount++
            console.error(`Chapter ${i + 1} image generation failed (attempt ${retryCount}):`, imageError)
            
            // 如果是不可重试的错误，直接跳出
            if (imageError instanceof ImageGenerationError && !imageError.retryable) {
              break
            }
            
            // 如果还有重试机会，等待一段时间后重试
            if (retryCount <= maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)) // 递增等待时间
            }
          }
        }
        
        // 如果最终还是失败了，记录失败信息
        if (!imageUrl) {
          failedImageGenerations.push(i + 1)
        }
      }
      
      segmentsWithImages.push({
        story_id: newStory.id,
        segment_order: segment.order || i + 1,
        title: segment.title,
        content: segment.content,
        image_url: imageUrl
      })
    }
    
    // 保存新故事段落
    const segments = segmentsWithImages
    
    const { error: segmentsError } = await supabaseAdmin
      .from('story_segments')
      .insert(segments)
    
    if (segmentsError) {
      console.error('New story segments creation error:', segmentsError)
    }
    
    // 更新用户使用次数
    await supabaseAdmin
      .from('users')
      .update({ usage_count: (user?.usage_count || 0) + 1 })
      .eq('id', req.user.userId)
    
    // 构建响应消息
    let message = '新故事生成成功'
    if (hasChapterImages && failedImageGenerations.length > 0) {
      message += `，但第${failedImageGenerations.join('、')}章的配图生成失败`
    }
    
    res.status(201).json({
      success: true,
      message,
      story_id: newStory.id,
      story: {
        ...newStory,
        segments: generatedStory.segments
      },
      failed_image_generations: failedImageGenerations
    })
    
  } catch (error) {
    console.error('Regenerate story error:', error)
    
    if (error instanceof AIServiceError) {
      const statusCode = error.code === 'API_KEY_MISSING' || error.code === 'INVALID_API_KEY' ? 503 : 500
      return res.status(statusCode).json({
        success: false,
        message: error.userMessage,
        error_code: error.code,
        retryable: error.retryable
      })
    }
    
    res.status(500).json({
      success: false,
      message: '故事生成失败，请稍后重试',
      error_code: 'UNKNOWN_ERROR',
      retryable: true
    })
  }
}

/**
 * 获取用户点赞的故事
 */
export const getLikedStories = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      })
    }
    
    const { page = 1, limit = 10 } = req.query
    const offset = (Number(page) - 1) * Number(limit)
    
    // 获取用户点赞的故事
    const { data: likedStories, error } = await supabaseAdmin
      .from('likes')
      .select(`
        story_id,
        created_at,
        stories!inner (
          id,
          title,
          description,
          tone,
          created_at,
          likes_count,
          comments_count,
          users!inner (
            nickname
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1)
    
    if (error) {
      console.error('Get liked stories error:', error)
      return res.status(500).json({
        success: false,
        message: '获取点赞故事失败'
      })
    }
    
    // 格式化数据
    const formattedStories = likedStories?.map((like: any) => ({
      id: like.stories.id,
      title: like.stories.title,
      description: like.stories.description,
      tone: like.stories.tone,
      created_at: like.stories.created_at,
      likes_count: like.stories.likes_count,
      comments_count: like.stories.comments_count,
      author_nickname: like.stories.users.nickname,
      liked_at: like.created_at
    })) || []
    
    res.json({
      success: true,
      stories: formattedStories
    })
    
  } catch (error) {
    console.error('Get liked stories error:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

/**
 * 删除故事
 */
export const deleteStory = async (req: Request, res: Response) => {
  try {
    const { id: storyId } = req.params
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      })
    }
    
    // 检查故事是否存在且属于当前用户
    const { data: story, error: storyError } = await supabaseAdmin
      .from('stories')
      .select('id, user_id')
      .eq('id', storyId)
      .eq('user_id', req.user.userId)
      .single()
    
    if (storyError || !story) {
      return res.status(404).json({
        success: false,
        message: '故事不存在或无权限'
      })
    }
    
    // 删除故事段落
    await supabaseAdmin.from('story_segments').delete().eq('story_id', storyId)
    
    // 删除故事
    const { error: deleteError } = await supabaseAdmin
      .from('stories')
      .delete()
      .eq('id', storyId)
      .eq('user_id', req.user.userId)
    
    if (deleteError) {
      console.error('Delete story error:', deleteError)
      return res.status(500).json({
        success: false,
        message: '删除故事失败'
      })
    }
    
    res.json({
      success: true,
      message: '故事已删除'
    })
    
  } catch (error) {
    console.error('Delete story error:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}