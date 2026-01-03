import dotenv from 'dotenv'

dotenv.config()

const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3')
const RETRY_DELAY = parseInt(process.env.RETRY_DELAY || '1000') // milliseconds

// 错误类型定义
export class AIServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string,
    public retryable: boolean = false
  ) {
    super(message)
    this.name = 'AIServiceError'
  }
}

// 延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export interface StoryGenerationRequest {
  birthplace: string
  career: string
  personality?: string
  gender: string
  birth_date: string
  relationship: string
  dream_regret: string
  original_story?: string
  tone: 'warm' | 'funny' | 'romantic' | 'dark'
}

export interface StorySegment {
  title: string
  content: string
  order: number
  image_url?: string
}

export interface GeneratedStory {
  title: string
  summary: string
  segments: StorySegment[]
}

/**
 * 生成故事提示词
 */
const generatePrompt = (request: StoryGenerationRequest): string => {
  const toneMap = {
    warm: '温暖感人',
    funny: '幽默风趣',
    romantic: '浪漫唯美',
    dark: '深沉思辨'
  }
  
  const toneDescription = toneMap[request.tone]
  
  return `请为我创作一个平行人生故事，要求如下：

你要用 **第二人称** 讲述故事，让读者仿佛亲身经历。故事必须充分结合用户提供的个人设定，并在细节、情感和场景描写上丰富多彩。故事必须流畅丝滑连贯，尽量符合实际。

背景设定（所有内容请在故事中自然融合，而不是生硬罗列）：
- 出生地/成长环境：${request.birthplace}
- 职业方向：${request.career}
- 性格特点：${request.personality || '未指定'}
- 性别：${request.gender}
- 出生日期：${request.birth_date}（请根据年龄设定合适的人生阶段）
- 感情状态：${request.relationship}
- 梦想或遗憾：${request.dream_regret}
- 故事语气：${toneDescription}（保持整体基调，但允许在不同阶段有情绪起伏）${request.original_story ? `
- 用户真实人生经历参考：${request.original_story}` : ''}

故事要求：
1. **标题**：有吸引力、有画面感，能体现平行人生的主题。
2. **人生概览**（100字以内）：用一段简洁、生动的语言总结这个平行世界里的"你"，让读者一眼感受到不同的人生轨迹。${request.original_story ? `
3. **创作参考**：基于用户提供的真实人生经历，创造一个既有相似性又有差异性的平行世界故事。保持核心性格特质，但在关键选择、机遇、环境等方面创造不同的可能性。` : ''}
${request.original_story ? '4' : '3'}. **五个人生阶段**：
   - 每个阶段要有一个富有意境的标题（如“风起少年时”“穿越霓虹之城”）。
   - 每个阶段 不少于500 字，用生动细节刻画场景（包括视觉、听觉、嗅觉或触觉描写）。
   - 必须体现用户输入的元素，例如职业、性格、梦想/遗憾等，记住梦想或遗憾是要完整实现的，如果有用户人生经历参考，这部分内容一定要涵盖，可以是不同的选择导致的不同的结果，让读者感觉故事就是为他们量身定制。
   - 情节中要有情绪变化：喜悦、犹豫、挑战、成长、领悟。
   - 描述要让读者感到自己真的“身在其中”，用“你”作为主语（如“你握紧车票，感到手心微微出汗”）。
${request.original_story ? '5' : '4'}. 故事内容积极向上、富有想象力，同时要引发读者共鸣和思考。

输出格式（必须是合法 JSON）：
{
  "title": "故事标题",
  "summary": "人生概览",
  "segments": [
    {
      "title": "阶段标题",
      "content": "阶段详细内容（不少于500字）",
      "order": 1
    },
    {
      "title": "阶段标题",
      "content": "阶段详细内容（不少于500字）",
      "order": 2
    },
    ...
  ]
}
`
}

/**
 * 调用DeepSeek R1 API生成故事（带重试机制）
 */
export const generateStory = async (request: StoryGenerationRequest, apiKey?: string): Promise<GeneratedStory> => {
  if (!apiKey) {
    throw new AIServiceError(
      'DeepSeek API key not configured',
      'API_KEY_MISSING',
      'DeepSeek API密钥未配置，请联系管理员',
      false
    )
  }
  
  const prompt = generatePrompt(request)
  let lastError: Error | null = null
  
  // 重试机制
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Attempting to generate story (attempt ${attempt}/${MAX_RETRIES})`)
      
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: process.env.DEEPSEEK_MODEL || 'ep-20260103131239-g4t5l',
          messages: [
            {
              role: 'system',
              content: '你是豆包，是由字节跳动开发的 AI 人工智能助手。你是一个专业的故事创作者，擅长创作引人入胜的平行人生故事。请严格按照用户要求的JSON格式返回结果。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.8,
          top_p: 0.9
        })
      })
      
      // 处理HTTP错误
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`DeepSeek API error (attempt ${attempt}):`, response.status, errorText)
        
        if (response.status === 401) {
          throw new AIServiceError(
            'Invalid API key',
            'INVALID_API_KEY',
            'AI服务密钥无效，请联系管理员',
            false
          )
        } else if (response.status === 429) {
          throw new AIServiceError(
            'Rate limit exceeded',
            'RATE_LIMIT',
            'AI服务请求过于频繁，请稍后再试',
            true
          )
        } else if (response.status >= 500) {
          throw new AIServiceError(
            `Server error: ${response.status}`,
            'SERVER_ERROR',
            'AI服务暂时不可用，请稍后再试',
            true
          )
        } else {
          throw new AIServiceError(
            `HTTP error: ${response.status}`,
            'HTTP_ERROR',
            'AI服务请求失败，请稍后再试',
            true
          )
        }
      }
      
      const data = await response.json()
      
      // 验证响应结构
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new AIServiceError(
          'Invalid response format from DeepSeek API',
          'INVALID_RESPONSE',
          'AI服务返回格式错误，请稍后再试',
          true
        )
      }
      
      const content = data.choices[0].message.content
      
      // 尝试解析JSON响应
      try {
        // 清理响应内容，移除可能的markdown代码块标记
        let cleanContent = content.trim()
        
        // 移除markdown代码块标记
        if (cleanContent.startsWith('```json')) {
          cleanContent = cleanContent.replace(/^```json\s*/, '')
        }
        if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/^```\s*/, '')
        }
        if (cleanContent.endsWith('```')) {
          cleanContent = cleanContent.replace(/\s*```$/, '')
        }
        
        // 尝试提取JSON部分（如果有其他文本）
        const jsonMatch = cleanContent.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          cleanContent = jsonMatch[0]
        }
        
        console.log('Attempting to parse cleaned content:', cleanContent.substring(0, 200) + '...')
        
        const storyData = JSON.parse(cleanContent)
        
        // 验证故事格式
        if (!storyData.title || !storyData.summary || !Array.isArray(storyData.segments)) {
          throw new Error('Invalid story format')
        }
        
        // 验证段落格式
        for (const segment of storyData.segments) {
          if (!segment.title || !segment.content || typeof segment.order !== 'number') {
            throw new Error('Invalid segment format')
          }
        }
        
        console.log('Story generated successfully')
        return storyData as GeneratedStory
        
      } catch (parseError) {
        console.error(`Failed to parse DeepSeek response as JSON (attempt ${attempt}):`, content)
        
        // 如果是最后一次尝试，返回默认故事
        if (attempt === MAX_RETRIES) {
          console.log('Creating fallback story due to parsing failure')
          return createFallbackStory(content, request)
        }
        
        throw new AIServiceError(
          'Failed to parse AI response',
          'PARSE_ERROR',
          'AI服务返回内容格式错误，正在重试',
          true
        )
      }
      
    } catch (error) {
      lastError = error as Error
      
      // 如果是不可重试的错误，直接抛出
      if (error instanceof AIServiceError && !error.retryable) {
        throw error
      }
      
      // 如果不是最后一次尝试，等待后重试
      if (attempt < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY}ms...`)
        await delay(RETRY_DELAY * attempt) // 指数退避
        continue
      }
    }
  }
  
  // 所有重试都失败了
  console.error('All retry attempts failed:', lastError)
  throw new AIServiceError(
    'Failed to generate story after all retries',
    'MAX_RETRIES_EXCEEDED',
    '故事生成失败，请稍后再试或联系客服',
    false
  )
}

/**
 * 创建备用故事（当AI服务失败时）
 */
const createFallbackStory = (rawContent: string, request: StoryGenerationRequest): GeneratedStory => {
  const toneMap = {
    warm: '温暖',
    funny: '有趣',
    romantic: '浪漫',
    dark: '深刻'
  }
  
  return {
    title: `${request.career}的${toneMap[request.tone]}人生`,
    summary: `这是一个关于在${request.birthplace}成长，从事${request.career}工作的${toneMap[request.tone]}故事。虽然AI服务暂时不可用，但我们为您准备了这个简单的故事框架。`,
    segments: [
      {
        title: '人生起点',
        content: `在${request.birthplace}这个地方，一个怀着${request.dream_regret}梦想的人开始了自己的人生旅程。作为一个${request.personality || '独特'}的人，他们选择了${request.career}这条道路。`,
        order: 1
      },
      {
        title: '成长历程',
        content: `随着时间的推移，他们在${request.career}领域不断成长。${request.relationship}的感情状态让他们对生活有了不同的理解和感悟。`,
        order: 2
      },
      {
        title: '人生感悟',
        content: `回望来路，${request.dream_regret}这个梦想或遗憾成为了人生中重要的一部分。每个选择都塑造了独特的人生轨迹。`,
        order: 3
      }
    ]
  }
}

/**
 * 生成故事封面图片描述
 */
export const generateCoverImagePrompt = (story: GeneratedStory, tone: string): string => {
  const toneStyles = {
    warm: 'warm lighting, soft colors, cozy atmosphere',
    funny: 'bright colors, playful elements, cheerful mood',
    romantic: 'soft pastels, dreamy atmosphere, elegant composition',
    dark: 'dramatic lighting, deep colors, contemplative mood'
  }
  
  const style = toneStyles[tone as keyof typeof toneStyles] || 'balanced lighting, natural colors'
  
  return `Create a book cover illustration for "${story.title}". ${story.summary}. Style: ${style}, high quality, artistic, book cover design, no text overlay.`
}