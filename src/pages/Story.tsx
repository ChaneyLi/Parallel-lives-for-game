import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, MessageCircle, Share2, Clock, User, Eye, EyeOff, Download, Send, Trash2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'

interface StorySegment {
  id: string
  story_id: string
  segment_order: number
  title: string
  content: string
  image_prompt?: string
  image_url?: string
  created_at: string
}

interface Story {
  id: string
  user_id: string
  title: string
  description: string
  summary?: string
  tone: string
  is_public: boolean
  created_at: string
  updated_at: string
  user?: {
    nickname: string
  }
  segments: StorySegment[]
  likes_count: number
  comments_count: number
  is_liked?: boolean
}

const Story: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token, isAuthenticated, user } = useAuthStore()
  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showImages, setShowImages] = useState(true)
  const [isLiking, setIsLiking] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [showComments, setShowComments] = useState(true)
  const [commentsLoading, setCommentsLoading] = useState(false)
  
  const API_URL = import.meta.env.VITE_API_URL || window.location.origin
 // 获取故事数据
  useEffect(() => {
    if (id) {
      fetchStory()
      // 确保页面滚动到顶部
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [id])
  
  const fetchStory = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch(`${API_URL}/api/stories/${id}`, {
        headers
      })
      
      const data = await response.json()
      
      if (data.success) {
        setStory(data.story)
      } else {
        setError(data.message || '获取故事失败')
      }
    } catch (error) {
      console.error('Fetch story error:', error)
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }
  
  const handleLike = async () => {
    if (!isAuthenticated || !token) {
      toast.error('请先登录')
      return
    }
    
    if (isLiking || !story) return
    
    setIsLiking(true)
    
    try {
      const response = await fetch(`${API_URL}/api/stories/${story.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setStory(prev => prev ? {
          ...prev,
          is_liked: data.is_liked,
          likes_count: data.likes_count
        } : null)
        
        toast.success(data.is_liked ? '已点赞' : '已取消点赞')
      } else {
        toast.error(data.message || '操作失败')
      }
    } catch (error) {
      console.error('Like error:', error)
      toast.error('网络错误，请稍后重试')
    } finally {
      setIsLiking(false)
    }
  }
  
  const handleShare = async () => {
    if (!story) return
    
    const shareUrl = window.location.href
    const shareText = `${story.title} - ${story.description}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: story.title,
          text: shareText,
          url: shareUrl
        })
      } catch (error) {
        // 用户取消分享
      }
    } else {
      // 复制到剪贴板
      try {
        await navigator.clipboard.writeText(shareUrl)
        toast.success('链接已复制到剪贴板')
      } catch (error) {
        toast.error('复制失败')
      }
    }
  }
  
  const handleRegenerate = async () => {
    if (!isAuthenticated || !token) {
      toast.error('请先登录')
      return
    }

    if (isRegenerating) return

    setIsRegenerating(true)
    try {
      const response = await fetch(`${API_URL}/api/stories/${id}/regenerate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('新故事生成成功！')
        // 跳转到新生成的故事页面并滚动到顶部
        navigate(`/story/${data.story_id}`, { replace: true })
        // 确保页面滚动到顶部
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 100)
      } else {
        toast.error(data.message || '重新生成失败')
      }
    } catch (error) {
      console.error('Regenerate error:', error)
      toast.error('重新生成失败，请稍后重试')
    } finally {
      setIsRegenerating(false)
    }
  }
  
  const handleDownloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('图片下载成功！')
    } catch (error) {
      console.error('Download image error:', error)
      toast.error('图片下载失败，请稍后重试')
    }
  }

  // 获取评论列表
  const fetchComments = async () => {
    if (!id) return
    
    setCommentsLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/comments/story/${id}`)
      const data = await response.json()
      
      if (data.success) {
        setComments(data.comments || [])
      } else {
        toast.error('获取评论失败')
      }
    } catch (error) {
      console.error('Fetch comments error:', error)
      toast.error('获取评论失败')
    } finally {
      setCommentsLoading(false)
    }
  }

  // 提交评论
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !isAuthenticated || !id) return
    
    setIsSubmittingComment(true)
    try {
      const response = await fetch(`${API_URL}/api/comments/story/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment.trim() })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setNewComment('')
        await fetchComments()
        // 更新故事的评论数
        if (story) {
          setStory({
            ...story,
            comments_count: (story.comments_count || 0) + 1
          })
        }
        toast.success('评论发布成功！')
      } else {
        toast.error(data.message || '评论发布失败')
      }
    } catch (error) {
      console.error('Submit comment error:', error)
      toast.error('评论发布失败')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  // 删除评论
  const handleDeleteComment = async (commentId: string) => {
    if (!isAuthenticated) return
    
    try {
      const response = await fetch(`${API_URL}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchComments()
        // 更新故事的评论数
        if (story) {
          setStory({
            ...story,
            comments_count: Math.max((story.comments_count || 0) - 1, 0)
          })
        }
        toast.success('评论删除成功！')
      } else {
        toast.error(data.message || '评论删除失败')
      }
    } catch (error) {
      console.error('Delete comment error:', error)
      toast.error('评论删除失败')
    }
  }

  // 跳转到评论区
  const scrollToComments = () => {
    const commentsSection = document.getElementById('comments-section')
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // 获取评论数据
  useEffect(() => {
    if (id) {
      fetchComments()
    }
  }, [id])
  
  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'warm': return 'from-orange-400 to-red-400'
      case 'funny': return 'from-yellow-400 to-orange-400'
      case 'romantic': return 'from-pink-400 to-purple-400'
      case 'dark': return 'from-gray-600 to-gray-800'
      default: return 'from-purple-400 to-pink-400'
    }
  }
  
  const getToneLabel = (tone: string) => {
    switch (tone) {
      case 'warm': return '温暖感人'
      case 'funny': return '幽默风趣'
      case 'romantic': return '浪漫唯美'
      case 'dark': return '深沉思辨'
      default: return '未知'
    }
  }
  
  const generateImageUrl = (prompt: string) => {
    const encodedPrompt = encodeURIComponent(prompt)
    return `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodedPrompt}&image_size=landscape_16_9`
  }
  
  const getChapterTitle = (segmentNumber: number) => {
    const chineseNumbers = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
    if (segmentNumber <= 10) {
      return `第${chineseNumbers[segmentNumber]}章`
    }
    return `第${segmentNumber}章`
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">正在加载故事...</p>
        </div>
      </div>
    )
  }
  
  if (error || !story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">故事不存在</h2>
          <p className="text-gray-600 mb-6">{error || '找不到指定的故事'}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回
          </button>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowImages(!showImages)}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              {showImages ? <EyeOff className="w-5 h-5 mr-1" /> : <Eye className="w-5 h-5 mr-1" />}
              {showImages ? '隐藏图片' : '显示图片'}
            </button>
            
            <button
              onClick={handleShare}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Share2 className="w-5 h-5 mr-1" />
              分享
            </button>
          </div>
        </div>
        
        {/* Story Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getToneColor(story.tone)}`} />
              <span className="text-sm font-medium text-gray-600">{getToneLabel(story.tone)}</span>
              {!story.is_public && (
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                  私密
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {new Date(story.created_at).toLocaleDateString()}
              </div>
              {story.user && (
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {story.user.nickname}
                </div>
              )}
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{story.title}</h1>
          
          {/* 人生概览 */}
          {story.summary && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-purple-700 mb-2">人生概览</h3>
              <p className="text-gray-700 leading-relaxed">{story.summary}</p>
            </div>
          )}
          
          <p className="text-lg text-gray-600 mb-6">{story.description}</p>
          
          {/* Actions */}
          <div className="flex items-center space-x-6">
            <button
              onClick={handleLike}
              disabled={isLiking || !isAuthenticated}
              className={`flex items-center space-x-2 transition-colors ${
                story.is_liked
                  ? 'text-red-500'
                  : 'text-gray-500 hover:text-red-500'
              } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Heart className={`w-5 h-5 ${story.is_liked ? 'fill-current' : ''}`} />
              <span>{story.likes_count}</span>
            </button>
            
            <button
              onClick={scrollToComments}
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{story.comments_count || 0}</span>
            </button>
          </div>
        </div>
        
        {/* Story Segments */}
        <div className="space-y-8">
          {story.segments.map((segment, index) => (
            <div key={segment.id} className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Segment Image */}
              {showImages && segment.image_url && (
                <div className="relative h-64 md:h-80 overflow-hidden">
                  <img
                    src={segment.image_url}
                    alt={segment.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-6 text-white">
                    <h3 className="text-xl font-bold mb-1">{segment.title}</h3>
                    <p className="text-sm opacity-90">{getChapterTitle(segment.segment_order)}</p>
                  </div>
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownloadImage(segment.image_url!, `${segment.title}.jpg`)
                      }}
                      className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                      title="下载图片"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Segment Content */}
              <div className="p-8">
                {(!showImages || !segment.image_url) && (
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{segment.title}</h3>
                    <p className="text-sm text-gray-500">{getChapterTitle(segment.segment_order)}</p>
                  </div>
                )}
                
                <div className="prose prose-lg max-w-none">
                  {segment.content.split('\n').map((paragraph, pIndex) => (
                    paragraph.trim() && (
                      <p key={pIndex} className="text-gray-700 leading-relaxed mb-4">
                        {paragraph.trim()}
                      </p>
                    )
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Comments Section */}
        <div id="comments-section" className="bg-white rounded-2xl shadow-xl p-8 mt-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6">评论 ({story.comments_count || 0})</h3>
          
          {/* Comment Input */}
          {isAuthenticated ? (
            <div className="mb-8">
              <div className="flex flex-col space-y-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="写下你的想法..."
                  className="w-full p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  maxLength={500}
                />
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {newComment.length}/500
                  </div>
                  <button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || isSubmittingComment}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmittingComment ? '发布中...' : '发布'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-600">请先登录后再发表评论</p>
            </div>
          )}
            
            {/* Comments List */}
            {commentsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4" />
                <p className="text-gray-600">正在加载评论...</p>
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
                        {comment.users?.nickname?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-800">
                              {comment.users?.nickname || '匿名用户'}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          {isAuthenticated && user && comment.user_id === user.id && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              title="删除评论"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">还没有评论，快来抢沙发吧！</p>
              </div>
            )}
        </div>
        
        {/* Footer */}
        <div className="text-center mt-12 py-8">
          <p className="text-gray-500 mb-4">故事到此结束，但人生未完待续</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/create')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              创作我的故事
            </button>
            {isAuthenticated && user && story.user_id === user.id && (
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isRegenerating ? '生成中...' : '再次探索人生'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Story
