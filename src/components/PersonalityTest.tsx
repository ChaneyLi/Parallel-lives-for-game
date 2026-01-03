import React, { useState } from 'react'
import { Brain, ChevronRight, RotateCcw } from 'lucide-react'

interface Question {
  id: string
  question: string
  options: {
    text: string
    dimension: 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P'
    score: number
  }[]
}

interface PersonalityTestProps {
  onResult: (personality: string, description: string) => void
  isVisible: boolean
  onToggle: () => void
}

const PersonalityTest: React.FC<PersonalityTestProps> = ({ onResult, isVisible, onToggle }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [isCompleted, setIsCompleted] = useState(false)
  const [result, setResult] = useState<{ type: string; description: string } | null>(null)

  const questions: Question[] = [
    {
      id: 'q1',
      question: '在社交聚会中，你更倾向于：',
      options: [
        { text: '主动与很多人交谈，成为焦点', dimension: 'E', score: 2 },
        { text: '与少数几个熟悉的朋友深入交流', dimension: 'I', score: 2 }
      ]
    },
    {
      id: 'q2',
      question: '做决定时，你更依赖：',
      options: [
        { text: '逻辑分析和客观事实', dimension: 'T', score: 2 },
        { text: '个人价值观和他人感受', dimension: 'F', score: 2 }
      ]
    },
    {
      id: 'q3',
      question: '你更喜欢：',
      options: [
        { text: '制定详细计划并按计划执行', dimension: 'J', score: 2 },
        { text: '保持灵活性，随机应变', dimension: 'P', score: 2 }
      ]
    },
    {
      id: 'q4',
      question: '学习新知识时，你更关注：',
      options: [
        { text: '具体的事实和细节', dimension: 'S', score: 2 },
        { text: '概念、模式和可能性', dimension: 'N', score: 2 }
      ]
    },
    {
      id: 'q5',
      question: '面对压力时，你倾向于：',
      options: [
        { text: '寻求他人支持和建议', dimension: 'E', score: 1 },
        { text: '独自思考和处理', dimension: 'I', score: 1 }
      ]
    },
    {
      id: 'q6',
      question: '在团队中，你更愿意：',
      options: [
        { text: '关注任务效率和结果', dimension: 'T', score: 1 },
        { text: '关注团队和谐和成员感受', dimension: 'F', score: 1 }
      ]
    }
  ]

  const personalityTypes = {
    'ENTJ': { name: '指挥官', description: '天生的领导者，充满激情、魅力和自信' },
    'ENTP': { name: '辩论家', description: '聪明好奇的思想家，不会拒绝智力挑战' },
    'ENFJ': { name: '主人公', description: '富有魅力和鼓舞人心的领导者，能够吸引听众' },
    'ENFP': { name: '竞选者', description: '热情洋溢、有创造力和社交能力强的自由精神' },
    'INTJ': { name: '建筑师', description: '富有想象力和战略性的思想家，一切皆在计划中' },
    'INTP': { name: '逻辑学家', description: '具有创造性的发明家，对知识有着止不住的渴望' },
    'INFJ': { name: '提倡者', description: '安静而神秘，同时鼓舞他人的理想主义者' },
    'INFP': { name: '调停者', description: '诗意的、善良的和利他的，总是热切地想要帮助好的事业' },
    'ESTJ': { name: '总经理', description: '出色的管理者，在管理事情或人的时候无与伦比' },
    'ESTP': { name: '企业家', description: '聪明、精力充沛和非常敏锐的人，真正享受生活在边缘' },
    'ESFJ': { name: '执政官', description: '非常关心他人的人，社交、受欢迎，总是热切地想要帮助他人' },
    'ESFP': { name: '娱乐家', description: '自发的、精力充沛和热情的人，生活对他们来说从不无聊' },
    'ISTJ': { name: '物流师', description: '实用和注重事实的人，可靠性不容怀疑' },
    'ISTP': { name: '鉴赏家', description: '大胆而实际的实验家，擅长使用各种工具' },
    'ISFJ': { name: '守护者', description: '非常专注和温暖的守护者，时刻准备保护爱的人' },
    'ISFP': { name: '探险家', description: '灵活和迷人的艺术家，时刻准备探索新的可能性' }
  }

  const handleAnswer = (optionIndex: number) => {
    const question = questions[currentQuestion]
    const option = question.options[optionIndex]
    
    setAnswers(prev => ({
      ...prev,
      [question.id]: optionIndex
    }))

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      // 计算结果
      calculateResult({ ...answers, [question.id]: optionIndex })
    }
  }

  const calculateResult = (finalAnswers: Record<string, number>) => {
    const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }
    
    questions.forEach((question, index) => {
      const answerIndex = finalAnswers[question.id]
      if (answerIndex !== undefined) {
        const option = question.options[answerIndex]
        scores[option.dimension] += option.score
      }
    })

    const personality = (
      (scores.E > scores.I ? 'E' : 'I') +
      (scores.S > scores.N ? 'S' : 'N') +
      (scores.T > scores.F ? 'T' : 'F') +
      (scores.J > scores.P ? 'J' : 'P')
    ) as keyof typeof personalityTypes

    const personalityInfo = personalityTypes[personality]
    const resultData = {
      type: `${personality} - ${personalityInfo.name}`,
      description: personalityInfo.description
    }
    
    setResult(resultData)
    setIsCompleted(true)
    onResult(resultData.type, resultData.description)
  }

  const resetTest = () => {
    setCurrentQuestion(0)
    setAnswers({})
    setIsCompleted(false)
    setResult(null)
  }

  if (!isVisible) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Brain className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <h3 className="font-semibold text-gray-800">AI性格测试</h3>
              <p className="text-sm text-gray-600">可选的简化版MBTI测试，帮助生成更精准的故事</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            开始测试
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Brain className="w-6 h-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">AI性格测试</h3>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          收起
        </button>
      </div>

      {!isCompleted ? (
        <div>
          {/* 进度条 */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>问题 {currentQuestion + 1} / {questions.length}</span>
              <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* 问题 */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-800 mb-4">
              {questions[currentQuestion].question}
            </h4>
            <div className="space-y-3">
              {questions[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleAnswer(index)}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  {option.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-4">
            <h4 className="text-xl font-bold text-gray-800 mb-2">
              你的性格类型：{result?.type}
            </h4>
            <p className="text-gray-600">{result?.description}</p>
          </div>
          <button
            type="button"
            onClick={resetTest}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <RotateCcw className="w-4 h-4" />
            重新测试
          </button>
        </div>
      )}
    </div>
  )
}

export default PersonalityTest