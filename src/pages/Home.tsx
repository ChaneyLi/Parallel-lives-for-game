import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles, Heart, BookOpen, Users, Clock, User, TrendingUp, MessageCircle, Mail, Phone, MessageSquare } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import BackgroundEffects from '../components/BackgroundEffects'

interface PopularStory {
  id: string
  title: string
  description: string
  summary?: string
  tone: string
  created_at: string
  user?: {
    nickname: string
  }
  likes_count: number
  comments_count: number
}

const Home: React.FC = () => {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [popularStories, setPopularStories] = useState<PopularStory[]>([])
  const [loadingStories, setLoadingStories] = useState(false)
  
  const API_URL = import.meta.env.VITE_API_URL || window.location.origin
  
  useEffect(() => {
    fetchPopularStories()
  }, [])
  
  const fetchPopularStories = async () => {
    setLoadingStories(true)
    try {
      const response = await fetch(`${API_URL}/api/stories?page=1&limit=6&sort=popular`)
      const data = await response.json()
      
      if (data.success) {
        setPopularStories(data.stories || [])
      }
    } catch (error) {
      console.error('Fetch popular stories error:', error)
    } finally {
      setLoadingStories(false)
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
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 relative overflow-hidden">
      {/* 背景装饰效果 */}
      <BackgroundEffects />
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-full">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-6">
            Parallel Lives
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
            探索无限可能的平行人生，用AI重新书写你的故事
          </p>
          
          <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
            每个选择都通向不同的人生道路。在这里，你可以体验那些未曾走过的路，
            发现另一个可能的自己，感受不同选择带来的精彩人生。
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link
                to="/create"
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
              >
                开始创作我的故事
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  免费开始体验
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/stories"
                  className="border-2 border-purple-600 text-purple-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-purple-600 hover:text-white transition-all duration-200"
                >
                  浏览精彩故事
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="bg-gradient-to-r from-purple-100 to-purple-200 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <Heart className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">个性化定制</h3>
            <p className="text-gray-600 leading-relaxed">
              根据你的出生地、职业选择、性格特点等信息，AI为你量身定制独一无二的平行人生故事。
            </p>
          </div>
          
          <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="bg-gradient-to-r from-pink-100 to-pink-200 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-pink-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">沉浸式体验</h3>
            <p className="text-gray-600 leading-relaxed">
              精心编织的故事情节，配以精美的AI生成插图，让你完全沉浸在另一个可能的人生中。
            </p>
          </div>
          
          <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">社区分享</h3>
            <p className="text-gray-600 leading-relaxed">
              与其他用户分享你的平行人生故事，发现更多精彩的人生可能性，互相启发和感动。
            </p>
          </div>
        </div>
      </div>
      
      {/* Popular Stories Section */}
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-2 mb-4">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              热门作品
            </h2>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            发现社区中最受欢迎的平行人生故事，感受不同的人生可能性
          </p>
        </div>
        
        {loadingStories ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">正在加载热门故事...</p>
          </div>
        ) : popularStories.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {popularStories.map((story) => (
              <div
                key={story.id}
                onClick={() => navigate(`/story/${story.id}`)}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getToneColor(story.tone)}`} />
                      <span className="text-sm font-medium text-gray-600">{getToneLabel(story.tone)}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Heart className="w-4 h-4 mr-1" />
                        <span>{story.likes_count}</span>
                      </div>
                      <div className="flex items-center">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        <span>{story.comments_count}</span>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">
                    {story.title}
                  </h3>
                  
                  {story.summary && (
                    <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
                      {story.summary}
                    </p>
                  )}
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {story.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {story.user?.nickname || '匿名用户'}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(story.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">暂无热门故事，快来创作第一个吧！</p>
          </div>
        )}
        
        <div className="text-center mt-12">
          <Link
            to="/stories"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            查看更多故事
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 py-16 relative z-10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            准备好探索你的平行人生了吗？
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            每一个未曾做出的选择，都是一个等待被发现的故事
          </p>
          {!isAuthenticated && (
            <Link
              to="/register"
              className="bg-white text-purple-600 px-8 py-4 rounded-full font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 inline-flex items-center gap-2"
            >
              立即开始免费体验
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      </div>
      
      {/* Footer Section - Unified Background Style */}
      <footer className="bg-gradient-to-br from-gray-50 to-white text-gray-800 py-16 relative z-10 border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Main Content */}
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              {/* Brand Section */}
              <div className="md:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  <h3 className="text-xl font-bold text-gray-800">Parallel Lives</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  探索无限可能的平行人生，用AI重新书写你的故事
                </p>
              </div>
              
              {/* Features */}
              <div>
                <h4 className="font-semibold mb-4 text-gray-800">功能特色</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><a href="#" className="hover:text-purple-600 transition-colors">AI故事生成</a></li>
                  <li><a href="#" className="hover:text-purple-600 transition-colors">个性化定制</a></li>
                  <li><a href="#" className="hover:text-purple-600 transition-colors">智能配图</a></li>
                  <li><a href="#" className="hover:text-purple-600 transition-colors">性格测试</a></li>
                </ul>
              </div>
              
              {/* Community */}
              <div>
                <h4 className="font-semibold mb-4 text-gray-800">社区 &amp; 服务</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><Link to="/stories" className="hover:text-purple-600 transition-colors">精彩故事</Link></li>
                  <li><a href="#" className="hover:text-purple-600 transition-colors">用户指南</a></li>
                  <li><a href="#" className="hover:text-purple-600 transition-colors">常见问题</a></li>
                  <li><a href="#" className="hover:text-purple-600 transition-colors">隐私政策</a></li>
                </ul>
              </div>
              
              {/* Support */}
              <div>
                <h4 className="font-semibold mb-4 text-gray-800">联系支持</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>
                    <a 
                      href="mailto:feedback@parallellives.com?subject=Parallel Lives 意见反馈" 
                      className="hover:text-purple-600 transition-colors flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      意见反馈
                    </a>
                  </li>
                  <li>
                    <a 
                      href="mailto:support@parallellives.com?subject=Parallel Lives 技术支持" 
                      className="hover:text-purple-600 transition-colors flex items-center gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      技术支持
                    </a>
                  </li>
                  <li>
                    <a 
                      href="mailto:business@parallellives.com?subject=Parallel Lives 商务合作" 
                      className="hover:text-purple-600 transition-colors flex items-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      商务合作
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Bottom Bar */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-gray-600 text-sm">
                  © 2024 Parallel Lives. All rights reserved.
                </p>
                <div className="flex items-center gap-4">
                  <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">
                    <span className="sr-only">Twitter</span>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">
                    <span className="sr-only">GitHub</span>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">
                    <span className="sr-only">WeChat</span>
                    <MessageCircle className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
