import axios from 'axios'

interface ImageGenerationRequest {
  prompt: string
  size?: string
  seed?: number
  guidance_scale?: number
  watermark?: boolean
}

interface ImageGenerationResponse {
  model: string
  created: number
  data: Array<{
    url: string
  }>
  usage: {
    generated_images: number
    output_tokens: number
    total_tokens: number
  }
}

export class ImageGenerationError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = true,
    public userMessage: string = '图片生成失败，请稍后重试'
  ) {
    super(message)
    this.name = 'ImageGenerationError'
  }
}

/**
 * 使用火山引擎Doubao-Seedream-3.0-t2i模型生成图片
 */
export const generateImage = async (request: ImageGenerationRequest): Promise<string> => {
  const apiKey = process.env.DOUBAO_API_KEY
  
  if (!apiKey) {
    throw new ImageGenerationError(
      'Doubao API key is missing',
      'API_KEY_MISSING',
      false,
      'Doubao API密钥未配置，请联系管理员'
    )
  }

  try {
    const response = await axios.post<ImageGenerationResponse>(
      'https://ark.cn-beijing.volces.com/api/v3/images/generations',
      {
        model: process.env.DOUBAO_MODEL || 'ep-20260103131810-56m7v',
        prompt: request.prompt,
        response_format: 'url',
        size: request.size || process.env.DEFAULT_IMAGE_SIZE || '1024x1024',
        seed: request.seed || Math.floor(Math.random() * 1000000),
        guidance_scale: request.guidance_scale || parseFloat(process.env.DEFAULT_GUIDANCE_SCALE || '2.5'),
        watermark: request.watermark !== false,
        sequential_image_generation: 'disabled',
        stream: false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 60000 // 60秒超时
      }
    )

    if (!response.data?.data?.[0]?.url) {
      throw new ImageGenerationError(
        'Invalid response format from Doubao API',
        'INVALID_RESPONSE',
        true,
        '图片生成服务返回格式错误'
      )
    }

    return response.data.data[0].url
  } catch (error) {
    console.error('Image generation error:', error)

    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const errorData = error.response?.data

      if (status === 401) {
        throw new ImageGenerationError(
          'Invalid API key',
          'INVALID_API_KEY',
          false,
          'API密钥无效，请联系管理员'
        )
      }

      if (status === 429) {
        throw new ImageGenerationError(
          'Rate limit exceeded',
          'RATE_LIMIT_EXCEEDED',
          true,
          '请求过于频繁，请稍后重试'
        )
      }

      if (status === 400) {
        throw new ImageGenerationError(
          'Invalid request parameters',
          'INVALID_PARAMETERS',
          false,
          '请求参数错误'
        )
      }

      if (status && status >= 500) {
        throw new ImageGenerationError(
          'Doubao API server error',
          'SERVER_ERROR',
          true,
          '图片生成服务暂时不可用，请稍后重试'
        )
      }

      throw new ImageGenerationError(
        `HTTP ${status}: ${errorData?.message || error.message}`,
        'HTTP_ERROR',
        true
      )
    }

    if (error.code === 'ECONNABORTED') {
      throw new ImageGenerationError(
        'Request timeout',
        'TIMEOUT',
        true,
        '图片生成超时，请稍后重试'
      )
    }

    throw new ImageGenerationError(
      error.message || 'Unknown error',
      'UNKNOWN_ERROR',
      true
    )
  }
}

/**
 * 为故事章节生成图片提示词
 * 直接使用章节故事内容作为提示词，并添加基本的图片风格描述
 */
export const generateImagePromptForChapter = (chapterTitle: string, chapterContent: string): string => {
  // 从环境变量获取图片风格配置
  const imageStyle = process.env.IMAGE_STYLE || '温馨治愈，柔和色调，简约现代，情感丰富，高质量，4K分辨率，专业摄影，美学构图'
  
  // 直接使用章节内容作为主要提示词，添加基本的风格描述
  return `${chapterContent.substring(0, 500)}，${imageStyle}`
}
