import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Clock, User, Eye, Filter, Search } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'

interface StoryItem {
  id: string
  title: string
  description: string
  tone: string
  created_at: string
  user: {
    nickname: string
  }
  likes_count: number
  comments_count: number
  is_liked?: boolean
}

type SortOption = 'latest' | 'popular' | 'oldest'
type ToneFilter = 'all' | 'warm' | 'funny' | 'romantic' | 'dark'

const Stories: React.FC = () => {
  const navigate = useNavigate()
  const { token, isAuthenticated } = useAuthStore()
  const [stories, setStories] = useState<StoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('latest')
  const [toneFilter, setToneFilter] = useState<ToneFilter>('all')
  const [showFilters, setShowFilters] = useState(false)
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'
  
  useEffect(() => {
    fetchStories()
  }, [sortBy, toneFilter])
  
  const fetchStories = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (sortBy !== 'latest') params.append('sort', sortBy)
      if (toneFilter !== 'all') params.append('tone', toneFilter)
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch(`${API_URL}/api/stories?${params.toString()}`, {
        headers
      })
      
      const data = await response.json()
      
      if (data.success) {
        setStories(data.stories)
      } else {
        setError(data.message || '获取故事列表失败')
      }
    } catch (error) {
      console.error('Fetch stories error:', error)
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }
  
  const handleLike = async (storyId: string) => {
    if (!isAuthenticated || !token) {
      toast.error('请先登录')
      return
    }
    
    try {
      const response = await fetch(`${API_URL}/api/stories/${storyId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setStories(prev => prev.map(story => 
          story.id === storyId 
            ? { ...story, is_liked: data.is_liked, likes_count: data.likes_count }
            : story
        ))
        
        toast.success(data.is_liked ? '已点赞' : '已取消点赞')
      } else {
        toast.error(data.message || '操作失败')
      }
    } catch (error) {
      console.error('Like error:', error)
      toast.error('网络错误，请稍后重试')
    }
  }
  
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
  
  const filteredStories = stories.filter(story => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        story.title.toLowerCase().includes(searchLower) ||
        story.description.toLowerCase().includes(searchLower) ||
        story.user.nickname.toLowerCase().includes(searchLower)
      )
    }
    return true
  })
  
  const toneOptions = [
    { value: 'all', label: '全部语气' },
    { value: 'warm', label: '温暖感人' },
    { value: 'funny', label: '幽默风趣' },
    { value: 'romantic', label: '浪漫唯美' },
    { value: 'dark', label: '深沉思辨' }
  ]
  
  const sortOptions = [
    { value: 'latest', label: '最新发布' },
    { value: 'popular', label: '最受欢迎' },
    { value: 'oldest', label: '最早发布' }
  ]
  
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
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">加载失败</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchStories}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            重试
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">精彩故事</h1>
          <p className="text-lg text-gray-600">探索其他用户创作的平行人生故事，发现不同的人生可能</p>
        </div>
        
        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
              placeholder="搜索故事标题、描述或作者..."
            />
          </div>
          
          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Filter className="w-5 h-5 mr-2" />
              筛选选项
            </button>
            
            <div className="text-sm text-gray-500">
              共 {filteredStories.length} 个故事
            </div>
          </div>
          
          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sort Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    排序方式
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Tone Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    故事语气
                  </label>
                  <select
                    value={toneFilter}
                    onChange={(e) => setToneFilter(e.target.value as ToneFilter)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {toneOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Stories Grid */}
        {filteredStories.length === 0 ? (
          <div className="text-center py-12">
            <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchTerm ? '没有找到匹配的故事' : '暂无故事'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? '尝试调整搜索条件或筛选选项' : '成为第一个分享故事的人吧'}
            </p>
            <button
              onClick={() => navigate('/create')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              创作故事
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => (
              <div
                key={story.id}
                className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-200 cursor-pointer"
                onClick={() => navigate(`/story/${story.id}`)}
              >
                {/* Story Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getToneColor(story.tone)}`} />
                      <span className="text-sm font-medium text-gray-600">
                        {getToneLabel(story.tone)}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(story.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                    {story.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                    {story.description}
                  </p>
                  
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <User className="w-4 h-4 mr-1" />
                    {story.user.nickname}
                  </div>
                </div>
                
                {/* Story Actions */}
                <div className="px-6 pb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleLike(story.id)
                        }}
                        disabled={!isAuthenticated}
                        className={`flex items-center space-x-1 transition-colors ${
                          story.is_liked
                            ? 'text-red-500'
                            : 'text-gray-500 hover:text-red-500'
                        } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Heart className={`w-4 h-4 ${story.is_liked ? 'fill-current' : ''}`} />
                        <span className="text-sm">{story.likes_count}</span>
                      </button>
                      
                      <div className="flex items-center space-x-1 text-gray-500">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm">{story.comments_count}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/story/${story.id}`)
                      }}
                      className="text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors"
                    >
                      阅读故事
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Load More Button (if needed) */}
        {filteredStories.length > 0 && (
          <div className="text-center mt-12">
            <button
              onClick={() => navigate('/create')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              创作我的故事
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Stories