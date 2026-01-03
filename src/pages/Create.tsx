import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MapPin, Briefcase, User, Heart, Target, Palette, Image, Settings, BookOpen, Sparkles, Users, Calendar, Shuffle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'
import PersonalityTest from '../components/PersonalityTest'

interface StoryFormData {
  birthplace: string
  career: string
  personality: string
  gender: string
  birth_date: string
  relationship: string
  dream_regret: string
  original_story: string
  tone: 'warm' | 'funny' | 'romantic' | 'dark'
  generate_images: boolean
  personality_test_result?: string
}

const Create: React.FC = () => {
  const { user, token, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryable, setRetryable] = useState(false)
  
  // 参考选项数据
  const referenceOptions = {
    birthplace: ['北京', '上海', '广州', '深圳', '小县城', '农村', '海外', '港澳台'],
    career: ['医生', '教师', '程序员', '艺术家', '律师', '工程师', '创业者', '公务员', '记者', '设计师'],
    personality: ['内向沉静', '外向活泼', '冒险进取', '谨慎稳重', '创意无限', '理性务实', '乐观开朗', '敏感细腻'],
    relationship: ['单身', '恋爱中', '已婚', '离异', '丧偶'],
    dream_regret: [
      '想成为一名作家，用文字改变世界',
      '后悔没有学习音乐，错过了艺术梦想',
      '希望环游世界，体验不同的文化',
      '想要创办自己的公司，实现财务自由',
      '后悔没有陪伴家人更多时间',
      '梦想成为一名科学家，探索未知领域',
      '想要帮助更多需要帮助的人',
      '后悔没有勇敢追求真爱'
    ]
  }
  
  const [formData, setFormData] = useState({
    birthplace: '',
    career: '',
    personality: '',
    gender: '',
    birth_date: '',
    relationship: '',
    dream_regret: '',
    original_story: '',
    tone: '',
    generate_images: false,
    personality_test_result: ''
  })
  
  const [showPersonalityTest, setShowPersonalityTest] = useState(false)
  
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isDraftSaved, setIsDraftSaved] = useState(false)
  
  // 从localStorage加载草稿
  React.useEffect(() => {
    const savedDraft = localStorage.getItem('story-draft')
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft)
        setFormData(draft)
        setIsDraftSaved(true)
      } catch (error) {
        console.error('Failed to load draft:', error)
      }
    }
  }, [])
  
  // 自动保存草稿
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.birthplace || formData.career || formData.dream_regret) {
        localStorage.setItem('story-draft', JSON.stringify(formData))
        setIsDraftSaved(true)
      }
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [formData])
  
  const clearDraft = () => {
    localStorage.removeItem('story-draft')
    setIsDraftSaved(false)
  }
  
  const toneOptions = [
    { value: 'warm', label: '温暖感人', description: '充满温情和感动的故事', color: 'from-orange-400 to-red-400' },
    { value: 'funny', label: '幽默风趣', description: '轻松愉快的喜剧故事', color: 'from-yellow-400 to-orange-400' },
    { value: 'romantic', label: '浪漫唯美', description: '充满爱情和美好的故事', color: 'from-pink-400 to-purple-400' },
    { value: 'dark', label: '深沉思辨', description: '引人深思的哲理故事', color: 'from-gray-600 to-gray-800' }
  ]
  
  const validateField = (field: keyof StoryFormData, value: string): string => {
    switch (field) {
      case 'birthplace':
        if (!value.trim()) return '请填写出生地或成长环境'
        if (value.length < 2) return '出生地至少需要2个字符'
        if (value.length > 50) return '出生地不能超过50个字符'
        return ''
      case 'career':
        if (!value.trim()) return '请填写职业方向'
        if (value.length < 2) return '职业方向至少需要2个字符'
        if (value.length > 50) return '职业方向不能超过50个字符'
        return ''
      case 'personality':
        if (!value.trim()) return '请填写或选择性格特点'
        if (value.length > 100) return '性格特点不能超过100个字符'
        return ''
      case 'gender':
        if (!value.trim()) return '请选择性别'
        return ''
      case 'birth_date':
        if (!value.trim()) return '请选择出生日期'
        return ''
      case 'relationship':
        if (!value.trim()) return '请选择感情状态'
        return ''
      case 'dream_regret':
        if (!value.trim()) return '请填写梦想或遗憾'
        if (value.length < 5) return '梦想或遗憾至少需要5个字符'
        if (value.length > 200) return '梦想或遗憾不能超过200个字符'
        return ''
      default:
        return ''
    }
  }
  
  const handleInputChange = (field: keyof StoryFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // 实时验证
    if (typeof value === 'string') {
      const error = validateField(field, value)
      setFieldErrors(prev => ({ ...prev, [field]: error }))
    }
    
    // 清除错误状态
    setError(null)
    setIsDraftSaved(false)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isAuthenticated || !token) {
      toast.error('请先登录')
      navigate('/login')
      return
    }
    
    // 验证所有字段
    const errors: Record<string, string> = {}
    errors.birthplace = validateField('birthplace', formData.birthplace)
    errors.career = validateField('career', formData.career)
    errors.personality = validateField('personality', formData.personality)
    errors.gender = validateField('gender', formData.gender)
    errors.birth_date = validateField('birth_date', formData.birth_date)
    errors.relationship = validateField('relationship', formData.relationship)
    errors.dream_regret = validateField('dream_regret', formData.dream_regret)
    
    // 过滤掉空错误
    const validationErrors = Object.entries(errors).filter(([_, error]) => error !== '')
    
    if (validationErrors.length > 0) {
      setFieldErrors(errors)
      toast.error('请修正表单中的错误')
      return
    }
    
    setIsLoading(true)
    setError(null)
    setRetryable(false)
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'
      
      const response = await fetch(`${API_URL}/api/stories/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('故事生成成功！')
        clearDraft() // 清除草稿
        // 跳转到故事页面并滚动到顶部
        navigate(`/story/${data.story_id}`, { replace: true })
        // 确保页面滚动到顶部
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 100)
      } else {
        // 处理不同类型的错误
        setError(data.message || '故事生成失败')
        setRetryable(data.retryable || false)
        
        if (data.error_code === 'API_KEY_MISSING' || data.error_code === 'INVALID_API_KEY') {
          toast.error('AI服务配置错误，请联系管理员')
        } else if (data.error_code === 'RATE_LIMIT') {
          toast.error('请求过于频繁，请稍后再试')
        } else if (data.retryable) {
          toast.error(data.message + ' - 您可以重试')
        } else {
          toast.error(data.message || '故事生成失败')
        }
      }
    } catch (error) {
      console.error('Story generation error:', error)
      setError('网络连接错误，请检查网络后重试')
      setRetryable(true)
      toast.error('网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleRetry = () => {
    setError(null)
    setRetryable(false)
    // 重新提交表单
    const form = document.querySelector('form') as HTMLFormElement
    if (form) {
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
    }
  }
  
  const handlePersonalityTestResult = (personality: string, description: string) => {
    setFormData(prev => ({ 
      ...prev, 
      personality_test_result: `${personality}: ${description}` 
    }))
    toast.success('性格测试完成！结果将帮助生成更精准的故事')
  }
  
  // 随机生成功能
  const handleRandomGenerate = () => {
    const randomBirthplace = referenceOptions.birthplace[Math.floor(Math.random() * referenceOptions.birthplace.length)]
    const randomCareer = referenceOptions.career[Math.floor(Math.random() * referenceOptions.career.length)]
    const randomPersonality = referenceOptions.personality[Math.floor(Math.random() * referenceOptions.personality.length)]
    const randomGender = ['男', '女'][Math.floor(Math.random() * 2)]
    const randomRelationship = referenceOptions.relationship[Math.floor(Math.random() * referenceOptions.relationship.length)]
    const randomDreamRegret = referenceOptions.dream_regret[Math.floor(Math.random() * referenceOptions.dream_regret.length)]
    const randomTone = toneOptions[Math.floor(Math.random() * toneOptions.length)].value
    
    // 生成随机出生日期（1970-2005年之间）
    const startYear = 1970
    const endYear = 2005
    const randomYear = Math.floor(Math.random() * (endYear - startYear + 1)) + startYear
    const randomMonth = Math.floor(Math.random() * 12) + 1
    const randomDay = Math.floor(Math.random() * 28) + 1 // 使用28天避免月份天数问题
    const randomBirthDate = `${randomYear}-${randomMonth.toString().padStart(2, '0')}-${randomDay.toString().padStart(2, '0')}`
    
    setFormData({
      birthplace: randomBirthplace,
      career: randomCareer,
      personality: randomPersonality,
      gender: randomGender,
      birth_date: randomBirthDate,
      relationship: randomRelationship,
      dream_regret: randomDreamRegret,
      original_story: '',
      tone: randomTone,
      generate_images: true,
      personality_test_result: ''
    })
    
    // 重置性格测试状态
    setShowPersonalityTest(false)
    
    // 清除所有字段错误
    setFieldErrors({})
    
    toast.success('已随机生成人生设定！')
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">请先登录</h2>
          <p className="text-gray-600 mb-6">您需要登录后才能创作故事</p>
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
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-full">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            创作你的平行人生
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            告诉我们关于你的信息，AI将为你创作一个独特的平行人生故事
          </p>
        </div>
        
        {/* User Info */}
        <div className="bg-white rounded-lg p-4 mb-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">当前用户：{user?.nickname}</p>
              <p className="text-xs text-gray-500">
                {user?.plan === 'premium' ? '付费用户' : '免费用户'} · 
                已使用 {user?.usage_count || 0} 次
              </p>
              {isDraftSaved && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ 草稿已自动保存
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">
                剩余次数：{user?.plan === 'premium' ? 50 - (user?.usage_count || 0) : 5 - (user?.usage_count || 0)}
              </p>
              {isDraftSaved && (
                <button
                  type="button"
                  onClick={clearDraft}
                  className="text-xs text-gray-500 hover:text-gray-700 mt-1"
                >
                  清除草稿
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Random Generate Button */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">快速开始</h3>
            <p className="text-gray-600 mb-4">想要完全不一样的人生？让AI为你随机生成一个有趣的人生设定</p>
            <button
              type="button"
              onClick={handleRandomGenerate}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 mx-auto"
            >
              <Shuffle className="w-5 h-5" />
              一键随机生成
            </button>
          </div>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          {/* 出生地/成长环境 */}
          <div>
            <label className="flex items-center text-lg font-semibold text-gray-800 mb-3">
              <MapPin className="w-5 h-5 mr-2 text-purple-600" />
              出生地或成长环境 *
            </label>
            <div className="space-y-3">
              <div className="relative">
                <select
                  value={referenceOptions.birthplace.includes(formData.birthplace) ? formData.birthplace : 'custom'}
                  onChange={(e) => {
                    if (e.target.value !== 'custom') {
                      handleInputChange('birthplace', e.target.value)
                    }
                  }}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                >
                  <option value="">请选择出生地或成长环境</option>
                  {referenceOptions.birthplace.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                  <option value="custom">自定义输入</option>
                </select>
              </div>
              
              {(!referenceOptions.birthplace.includes(formData.birthplace) || formData.birthplace === '') && (
                <div className="relative">
                  <input
                    type="text"
                    value={formData.birthplace}
                    onChange={(e) => handleInputChange('birthplace', e.target.value)}
                    className={`w-full p-4 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                      fieldErrors.birthplace ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="请输入您的出生地或成长环境"
                    maxLength={50}
                    required
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">{formData.birthplace.length}/50</span>
                    {fieldErrors.birthplace && (
                      <span className="text-xs text-red-600">{fieldErrors.birthplace}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* 职业方向 */}
          <div>
            <label className="flex items-center text-lg font-semibold text-gray-800 mb-3">
              <Briefcase className="w-5 h-5 mr-2 text-purple-600" />
              职业方向 *
            </label>
            <div className="space-y-3">
              <div className="relative">
                <select
                  value={referenceOptions.career.includes(formData.career) ? formData.career : 'custom'}
                  onChange={(e) => {
                    if (e.target.value !== 'custom') {
                      handleInputChange('career', e.target.value)
                    }
                  }}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                >
                  <option value="">请选择职业方向</option>
                  {referenceOptions.career.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                  <option value="custom">自定义输入</option>
                </select>
              </div>
              
              {(!referenceOptions.career.includes(formData.career) || formData.career === '') && (
                <div className="relative">
                  <input
                    type="text"
                    value={formData.career}
                    onChange={(e) => handleInputChange('career', e.target.value)}
                    className={`w-full p-4 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                      fieldErrors.career ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="请输入您的职业方向"
                    maxLength={50}
                    required
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">{formData.career.length}/50</span>
                    {fieldErrors.career && (
                      <span className="text-xs text-red-600">{fieldErrors.career}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* 性格特点 */}
          <div>
            <label className="flex items-center text-lg font-semibold text-gray-800 mb-3">
              <User className="w-5 h-5 mr-2 text-purple-600" />
              性格特点 *
            </label>
            <div className="space-y-3">
              <div className="relative">
                <select
                  value={referenceOptions.personality.includes(formData.personality) ? formData.personality : 'custom'}
                  onChange={(e) => {
                    if (e.target.value !== 'custom') {
                      handleInputChange('personality', e.target.value)
                    }
                  }}
                  className={`w-full p-4 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                    fieldErrors.personality ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">请选择性格特点</option>
                  {referenceOptions.personality.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                  <option value="custom">自定义输入</option>
                </select>
              </div>
              
              {(!referenceOptions.personality.includes(formData.personality) || formData.personality === '') && (
                <div className="relative">
                  <input
                    type="text"
                    value={formData.personality}
                    onChange={(e) => handleInputChange('personality', e.target.value)}
                    className={`w-full p-4 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                      fieldErrors.personality ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="请输入您的性格特点"
                    maxLength={100}
                    required
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">{formData.personality.length}/100</span>
                    {fieldErrors.personality && (
                      <span className="text-xs text-red-600">{fieldErrors.personality}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* AI性格测试 */}
          <div>
            <PersonalityTest
              onResult={handlePersonalityTestResult}
              isVisible={showPersonalityTest}
              onToggle={() => setShowPersonalityTest(!showPersonalityTest)}
            />
            {formData.personality_test_result && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>测试结果：</strong>{formData.personality_test_result}
                </p>
              </div>
            )}
          </div>
          
          {/* 性别选择 */}
          <div>
            <label className="flex items-center text-lg font-semibold text-gray-800 mb-3">
              <Users className="w-5 h-5 mr-2 text-purple-600" />
              性别 *
            </label>
            <div className="relative">
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className={`w-full p-4 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                  fieldErrors.gender ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                required
              >
                <option value="">请选择性别</option>
                <option value="男">男</option>
                <option value="女">女</option>
                <option value="未知">未知</option>
              </select>
              {fieldErrors.gender && (
                <div className="mt-1">
                  <span className="text-xs text-red-600">{fieldErrors.gender}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* 出生日期 */}
          <div>
            <label className="flex items-center text-lg font-semibold text-gray-800 mb-3">
              <Calendar className="w-5 h-5 mr-2 text-purple-600" />
              出生日期 *
            </label>
            <div className="relative">
              <input
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleInputChange('birth_date', e.target.value)}
                className={`w-full p-4 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                  fieldErrors.birth_date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                required
                max={new Date().toISOString().split('T')[0]}
              />
              {fieldErrors.birth_date && (
                <div className="mt-1">
                  <span className="text-xs text-red-600">{fieldErrors.birth_date}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* 感情状态 */}
          <div>
            <label className="flex items-center text-lg font-semibold text-gray-800 mb-3">
              <Heart className="w-5 h-5 mr-2 text-purple-600" />
              感情状态 *
            </label>
            <div className="relative">
              <select
                value={formData.relationship}
                onChange={(e) => handleInputChange('relationship', e.target.value)}
                className={`w-full p-4 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                  fieldErrors.relationship ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                required
              >
                <option value="">请选择感情状态</option>
                <option value="单身">单身</option>
                <option value="恋爱中">恋爱中</option>
                <option value="已婚">已婚</option>
                <option value="离异">离异</option>
                <option value="丧偶">丧偶</option>
              </select>
              {fieldErrors.relationship && (
                <div className="mt-1">
                  <span className="text-xs text-red-600">{fieldErrors.relationship}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* 梦想或遗憾 */}
          <div>
            <label className="flex items-center text-lg font-semibold text-gray-800 mb-3">
              <Target className="w-5 h-5 mr-2 text-purple-600" />
              梦想或遗憾 *
            </label>
            <div className="space-y-3">
              <div className="relative">
                <select
                  value={referenceOptions.dream_regret.includes(formData.dream_regret) ? formData.dream_regret : 'custom'}
                  onChange={(e) => {
                    if (e.target.value !== 'custom') {
                      handleInputChange('dream_regret', e.target.value)
                    }
                  }}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                >
                  <option value="">请选择梦想或遗憾</option>
                  {referenceOptions.dream_regret.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                  <option value="custom">自定义输入</option>
                </select>
              </div>
              
              {(!referenceOptions.dream_regret.includes(formData.dream_regret) || formData.dream_regret === '') && (
                <div className="relative">
                  <textarea
                    value={formData.dream_regret}
                    onChange={(e) => handleInputChange('dream_regret', e.target.value)}
                    className={`w-full p-4 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors h-24 resize-none ${
                      fieldErrors.dream_regret ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="请输入您的梦想或遗憾"
                    maxLength={200}
                    required
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">{formData.dream_regret.length}/200</span>
                    {fieldErrors.dream_regret && (
                      <span className="text-xs text-red-600">{fieldErrors.dream_regret}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* 用户原本人生故事 */}
          <div>
            <label className="flex items-center text-lg font-semibold text-gray-800 mb-3">
              <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
              您的原本人生故事（可选）
            </label>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    <strong>提示：</strong>分享您真实的人生经历，AI将基于此创作更贴合您的平行人生故事。
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    例如："我从小比较贪玩，爸爸妈妈都觉得我很烦，但是上了大学之后我莫名变的自觉起来，从大三就开始找第一份工作，现在我已经成功进入了我的梦中公司"
                  </p>
                </div>
              </div>
            </div>
            <div className="relative">
              <textarea
                value={formData.original_story}
                onChange={(e) => handleInputChange('original_story', e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors h-32 resize-none"
                placeholder="请简单描述您的真实人生经历，这将帮助AI创作更符合您的平行人生故事（可选）"
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">{formData.original_story.length}/500</span>
              </div>
            </div>
          </div>
          
          {/* 故事语气 */}
          <div>
            <label className="flex items-center text-lg font-semibold text-gray-800 mb-4">
              <Palette className="w-5 h-5 mr-2 text-purple-600" />
              故事语气 *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {toneOptions.map((option) => (
                <label
                  key={option.value}
                  className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                    formData.tone === option.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="tone"
                    value={option.value}
                    checked={formData.tone === option.value}
                    onChange={(e) => handleInputChange('tone', e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${option.color} mr-3`} />
                    <div>
                      <p className="font-medium text-gray-800">{option.label}</p>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {fieldErrors.tone && (
              <div className="mt-2">
                <span className="text-xs text-red-600">{fieldErrors.tone}</span>
              </div>
            )}
          </div>
          
          {/* 生成配图选项 */}
          <div>
            <label className="flex items-center text-lg font-semibold text-gray-800 mb-3">
              <Image className="w-5 h-5 mr-2 text-purple-600" />
              配图选项
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.generate_images}
                onChange={(e) => handleInputChange('generate_images', e.target.checked)}
                className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="ml-3 text-gray-700">
                为故事生成AI配图（可能需要更长时间）
              </span>
            </label>
          </div>
          
          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-red-800">故事生成失败</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                  <div className="mt-3 flex items-center space-x-3">
                    {error.includes('API密钥') && (
                      <Link
                        to="/settings"
                        className="flex items-center text-purple-600 hover:text-purple-700 text-sm font-medium"
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        前往设置
                      </Link>
                    )}
                    {retryable && (
                      <button
                        type="button"
                        onClick={handleRetry}
                        className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        重试
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* 提交按钮 */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  AI正在创作中...
                </div>
              ) : (
                '开始生成我的平行人生故事'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Create