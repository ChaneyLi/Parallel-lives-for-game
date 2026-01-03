import React, { useEffect, useState } from 'react'

interface Meteor {
  id: number
  left: number
  top: number
  delay: number
  duration: number
  opacity: number
  length: number
}

const MeteorShower: React.FC = () => {
  const [meteors, setMeteors] = useState<Meteor[]>([])

  const generateMeteor = (id: number): Meteor => {
    return {
      id,
      left: Math.random() * 30 - 10, // 从左上方开始 (-10% to 20%)
      top: Math.random() * 30 - 10, // 从上方开始 (-10% to 20%)
      delay: Math.random() * 6,
      duration: Math.random() * 3 + 2, // 2-5秒，速度时快时慢
      opacity: Math.random() * 0.4 + 0.6, // 0.6-1.0透明度
      length: Math.random() * 40 + 60 // 60-100px长度
    }
  }

  useEffect(() => {
    // 创建初始流星，数量适中
    const initialMeteors = Array.from({ length: 8 }, (_, i) => generateMeteor(i))
    setMeteors(initialMeteors)

    const interval = setInterval(() => {
      setMeteors(prev => {
        const newMeteors = [...prev]
        const randomIndex = Math.floor(Math.random() * newMeteors.length)
        newMeteors[randomIndex] = generateMeteor(Date.now())
        return newMeteors
      })
    }, 3000) // 3秒间隔

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {meteors.map((meteor) => (
        <div
          key={meteor.id}
          className="absolute"
          style={{
            left: `${meteor.left}%`,
            top: `${meteor.top}%`,
            width: '1px',
            height: `${meteor.length}px`,
            opacity: meteor.opacity,
            animation: `meteorFall ${meteor.duration}s linear infinite`,
            animationDelay: `${meteor.delay}s`,
            transform: 'rotate(45deg)', // 从左上到右下的角度
            transformOrigin: 'top left'
          }}
        >
          {/* 主流星体 - 深蓝紫色细线 */}
          <div
            className="absolute w-full h-full"
            style={{
              background: 'linear-gradient(to bottom, rgba(79, 70, 229, 0) 0%, rgba(79, 70, 229, 0.4) 20%, rgba(79, 70, 229, 0.8) 60%, rgba(79, 70, 229, 1) 100%)',
              borderRadius: '0.5px',
              boxShadow: '0 0 2px rgba(79, 70, 229, 0.6), 0 0 4px rgba(79, 70, 229, 0.4)'
            }}
          />
          
          {/* 拖尾效果 */}
          <div
            className="absolute w-full"
            style={{
              height: `${meteor.length * 0.6}px`,
              top: `-${meteor.length * 0.3}px`,
              background: 'linear-gradient(to bottom, rgba(79, 70, 229, 0) 0%, rgba(79, 70, 229, 0.1) 30%, rgba(79, 70, 229, 0.3) 70%, rgba(79, 70, 229, 0.6) 100%)',
              borderRadius: '0.5px',
              filter: 'blur(0.5px)'
            }}
          />
          
          {/* 头部亮点 */}
          <div
            className="absolute"
            style={{
              width: '3px',
              height: '3px',
              left: '-1px',
              bottom: '-1px',
              background: 'radial-gradient(circle, rgba(79, 70, 229, 1) 0%, rgba(79, 70, 229, 0.8) 40%, rgba(79, 70, 229, 0.4) 70%, transparent 100%)',
              borderRadius: '50%',
              boxShadow: '0 0 4px rgba(79, 70, 229, 0.8), 0 0 8px rgba(79, 70, 229, 0.4)'
            }}
          />
        </div>
      ))}
      
      <style>{`
        @keyframes meteorFall {
          0% {
            transform: translateY(-20vh) translateX(-20vw) rotate(45deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
            animation-timing-function: ease-out;
          }
          30% {
            animation-timing-function: ease-in;
          }
          50% {
            animation-timing-function: ease-out;
          }
          70% {
            animation-timing-function: ease-in;
          }
          90% {
            opacity: 1;
            animation-timing-function: ease-out;
          }
          100% {
            transform: translateY(120vh) translateX(60vw) rotate(45deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

export default MeteorShower