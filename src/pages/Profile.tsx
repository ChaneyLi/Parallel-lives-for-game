import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Heart, MessageCircle, Clock, Eye, EyeOff, Trash2, Edit, Plus, Crown, Zap } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'

interface UserStory {
  id: string
  title: string
  description: string
  tone: string
  is_public: boolean
  created_at: string
  likes_count: number
  comments_count: number
}

interface LikedStory {
  id: string
  title: string
  description: string
  tone: string
  created_at: string
  likes_count: number
  comments_count: number
  author_nickname: string
  liked_at: string
}

const Profile: React.FC = () => {
  const navigate = useNavigate()
  const { user, token, isAuthenticated, logout } = useAuthStore()
  const [stories, setStories] = useState<UserStory[]>([])
  const [likedStories, setLikedStories] = useState<LikedStory[]>([])
  const [loading, setLoading] = useState(true)
  const [likedStoriesLoading, setLikedStoriesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [likedStoriesError, setLikedStoriesError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'stories' | 'liked' | 'settings'>('stories')
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchUserStories()
  }, [isAuthenticated])
  
  useEffect(() => {
    if (activeTab === 'liked' && likedStories.length === 0) {
      fetchLikedStories()
    }
  }, [activeTab])
  
  const fetchUserStories = async () => {
    if (!token) return
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${API_URL}/api/stories/user/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setStories(data.stories)
      } else {
        setError(data.message || '获取故事列表失败')
      }
    } catch (error) {
      console.error('Fetch user stories error:', error)
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }
  
  const fetchLikedStories = async () => {
    if (!token) return
    
    try {
      setLikedStoriesLoading(true)
      setLikedStoriesError(null)
      
      const response = await fetch(`${API_URL}/api/stories/liked`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setLikedStories(data.stories)
      } else {
        setLikedStoriesError(data.message || '获取点赞故事列表失败')
      }
    } catch (error) {
      console.error('Fetch liked stories error:', error)
      setLikedStoriesError('网络错误，请稍后重试')
    } finally {
      setLikedStoriesLoading(false)
    }
  }
  
  const toggleStoryVisibility = async (storyId: string, isPublic: boolean) => {
    if (!token) return
    
    try {
      const response = await fetch(`${API_URL}/api/stories/${storyId}/visibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_public: !isPublic })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setStories(prev => prev.map(story => 
          story.id === storyId 
            ? { ...story, is_public: !isPublic }
            : story
        ))
        
        toast.success(isPublic ? '故事已设为私密' : '故事已公开')
      } else {
        toast.error(data.message || '操作失败')
      }
    } catch (error) {
      console.error('Toggle visibility error:', error)
      toast.error('网络错误，请稍后重试')
    }
  }
  
  const deleteStory = async (storyId: string) => {
    if (!token) return
    
    if (!confirm('确定要删除这个故事吗？此操作无法撤销。')) {
      return
    }
    
    try {
      const response = await fetch(`${API_URL}/api/stories/${storyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setStories(prev => prev.filter(story => story.id !== storyId))
        toast.success('故事已删除')
      } else {
        toast.error(data.message || '删除失败')
      }
    } catch (error) {
      console.error('Delete story error:', error)
      toast.error('网络错误，请稍后重试')
    }
  }
  
  const handleLogout = () => {
    logout()
    navigate('/')
    toast.success('已退出登录')
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
  
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">请先登录</h2>
          <button
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            前往登录
          </button>
        </div>
      </div>
    )
  }
  
  const maxUsage = user.plan === 'premium' ? 50 : 5
  const usagePercentage = ((user.usage_count || 0) / maxUsage) * 100
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="flex items-center space-x-6 mb-6 md:mb-0">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-800">{user.nickname}</h1>
                  {user.plan === 'premium' && (
                    <div className="flex items-center bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full text-sm font-medium">
                      <Crown className="w-4 h-4 mr-1" />
                      付费用户
                    </div>
                  )}
                </div>
                
                <p className="text-gray-600 mb-2">{user.email}</p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>加入时间：{new Date(user.created_at).toLocaleDateString()}</span>
                  <span>故事数量：{stories.length}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => navigate('/create')}
                className="flex items-center bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                创作新故事
              </button>
              
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-800 transition-colors text-sm"
              >
                退出登录
              </button>
            </div>
          </div>
          
          {/* Usage Stats */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-800">使用情况</span>
              </div>
              
              <span className="text-sm text-gray-600">
                {user.usage_count || 0} / {maxUsage}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
            
            {user.plan === 'free' && usagePercentage > 80 && (
              <p className="text-sm text-orange-600 mt-2">
                使用次数即将用完，升级到付费版本获得更多次数
              </p>
            )}
          </div>
        </div>
        
        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('stories')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'stories'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                我的故事
              </button>
              
              <button
                onClick={() => setActiveTab('liked')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'liked'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                我点赞的故事
              </button>
              
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                账户设置
              </button>
            </nav>
          </div>
          
          <div className="p-8">
            {activeTab === 'stories' && (
              <div>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600">正在加载故事...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">加载失败</h3>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button
                      onClick={fetchUserStories}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold"
                    >
                      重试
                    </button>
                  </div>
                ) : stories.length === 0 ? (
                  <div className="text-center py-12">
                    <Edit className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">还没有故事</h3>
                    <p className="text-gray-500 mb-6">创作你的第一个平行人生故事吧</p>
                    <button
                      onClick={() => navigate('/create')}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold"
                    >
                      开始创作
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stories.map((story) => (
                      <div
                        key={story.id}
                        className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200"
                      >
                        {/* Story Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getToneColor(story.tone)}`} />
                            <span className="text-sm font-medium text-gray-600">
                              {getToneLabel(story.tone)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleStoryVisibility(story.id, story.is_public)}
                              className="text-gray-500 hover:text-gray-700 transition-colors"
                              title={story.is_public ? '设为私密' : '设为公开'}
                            >
                              {story.is_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                            
                            <button
                              onClick={() => deleteStory(story.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title="删除故事"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Story Content */}
                        <h3 
                          className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 cursor-pointer hover:text-purple-600 transition-colors"
                          onClick={() => navigate(`/story/${story.id}`)}
                        >
                          {story.title}
                        </h3>
                        
                        <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                          {story.description}
                        </p>
                        
                        {/* Story Meta */}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Heart className="w-4 h-4" />
                              <span>{story.likes_count}</span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="w-4 h-4" />
                              <span>{story.comments_count}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(story.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        {/* Story Status */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              story.is_public 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {story.is_public ? '公开' : '私密'}
                            </span>
                            
                            <button
                              onClick={() => navigate(`/story/${story.id}`)}
                              className="text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors"
                            >
                              查看详情
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'liked' && (
              <div>
                {likedStoriesLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600">正在加载点赞的故事...</p>
                  </div>
                ) : likedStoriesError ? (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">加载失败</h3>
                    <p className="text-gray-500 mb-6">{likedStoriesError}</p>
                    <button
                      onClick={fetchLikedStories}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold"
                    >
                      重试
                    </button>
                  </div>
                ) : likedStories.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">还没有点赞的故事</h3>
                    <p className="text-gray-500 mb-6">去社区发现更多精彩故事吧</p>
                    <button
                      onClick={() => navigate('/community')}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold"
                    >
                      探索社区
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {likedStories.map((story) => (
                      <div
                        key={story.id}
                        className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200"
                      >
                        {/* Story Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getToneColor(story.tone)}`} />
                            <span className="text-sm font-medium text-gray-600">
                              {getToneLabel(story.tone)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                            <span>已点赞</span>
                          </div>
                        </div>
                        
                        {/* Story Content */}
                        <h3 
                          className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 cursor-pointer hover:text-purple-600 transition-colors"
                          onClick={() => navigate(`/story/${story.id}`)}
                        >
                          {story.title}
                        </h3>
                        
                        <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                          {story.description}
                        </p>
                        
                        {/* Author Info */}
                        <div className="flex items-center space-x-2 mb-4">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">作者：{story.author_nickname}</span>
                        </div>
                        
                        {/* Story Meta */}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Heart className="w-4 h-4" />
                              <span>{story.likes_count}</span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="w-4 h-4" />
                              <span>{story.comments_count}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(story.liked_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        {/* Action */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              点赞于 {new Date(story.liked_at).toLocaleDateString()}
                            </span>
                            
                            <button
                              onClick={() => navigate(`/story/${story.id}`)}
                              className="text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors"
                            >
                              查看详情
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div className="max-w-2xl">
                <h3 className="text-xl font-bold text-gray-800 mb-6">账户设置</h3>
                
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-800 mb-4">基本信息</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          昵称
                        </label>
                        <input
                          type="text"
                          value={user.nickname}
                          disabled
                          className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          邮箱
                        </label>
                        <input
                          type="email"
                          value={user.email}
                          disabled
                          className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Plan Info */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-800 mb-4">套餐信息</h4>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800">
                          {user.plan === 'premium' ? '付费版' : '免费版'}
                        </p>
                        <p className="text-sm text-gray-600">
                          每月可生成 {maxUsage} 个故事
                        </p>
                      </div>
                      
                      {user.plan === 'free' && (
                        <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium text-sm">
                          升级套餐
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Danger Zone */}
                  <div className="bg-red-50 rounded-lg p-6">
                    <h4 className="font-semibold text-red-800 mb-4">危险操作</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-red-600 mb-3">
                          删除账户将永久删除您的所有数据，包括故事和个人信息。此操作无法撤销。
                        </p>
                        
                        <button className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-red-700 transition-colors">
                          删除账户
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile