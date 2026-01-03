import React, { useEffect, useState } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  opacity: number
  speed: number
  direction: number
}

interface FloatingOrb {
  id: number
  x: number
  y: number
  size: number
  opacity: number
  duration: number
  delay: number
}

const BackgroundEffects: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([])
  const [orbs, setOrbs] = useState<FloatingOrb[]>([])

  const generateParticle = (id: number): Particle => {
    return {
      id,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1, // 1-4px
      opacity: Math.random() * 0.6 + 0.2, // 0.2-0.8
      speed: Math.random() * 20 + 10, // 10-30s
      direction: Math.random() * 360
    }
  }

  const generateOrb = (id: number): FloatingOrb => {
    return {
      id,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 120 + 80, // 80-200px
      opacity: Math.random() * 0.1 + 0.05, // 0.05-0.15
      duration: Math.random() * 20 + 15, // 15-35s
      delay: Math.random() * 10
    }
  }

  useEffect(() => {
    // 创建浮动粒子
    const initialParticles = Array.from({ length: 15 }, (_, i) => generateParticle(i))
    setParticles(initialParticles)

    // 创建光晕球体
    const initialOrbs = Array.from({ length: 6 }, (_, i) => generateOrb(i))
    setOrbs(initialOrbs)

    // 定期更新粒子
    const particleInterval = setInterval(() => {
      setParticles(prev => {
        const newParticles = [...prev]
        const randomIndex = Math.floor(Math.random() * newParticles.length)
        newParticles[randomIndex] = generateParticle(Date.now())
        return newParticles
      })
    }, 8000)

    // 定期更新光晕
    const orbInterval = setInterval(() => {
      setOrbs(prev => {
        const newOrbs = [...prev]
        const randomIndex = Math.floor(Math.random() * newOrbs.length)
        newOrbs[randomIndex] = generateOrb(Date.now())
        return newOrbs
      })
    }, 12000)

    return () => {
      clearInterval(particleInterval)
      clearInterval(orbInterval)
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* 浮动粒子 */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.8) 0%, rgba(219, 39, 119, 0.6) 50%, rgba(59, 130, 246, 0.4) 100%)',
            animation: `floatParticle ${particle.speed}s linear infinite`,
            animationDelay: `${Math.random() * 5}s`,
            boxShadow: '0 0 10px rgba(147, 51, 234, 0.3), 0 0 20px rgba(219, 39, 119, 0.2)'
          }}
        />
      ))}

      {/* 光晕球体 */}
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className="absolute rounded-full"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            opacity: orb.opacity,
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.15) 0%, rgba(219, 39, 119, 0.1) 30%, rgba(59, 130, 246, 0.05) 60%, transparent 100%)',
            animation: `floatOrb ${orb.duration}s ease-in-out infinite`,
            animationDelay: `${orb.delay}s`,
            filter: 'blur(1px)'
          }}
        />
      ))}

      {/* 渐变光斑 */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 opacity-20">
        <div className="w-full h-full bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400 rounded-full filter blur-3xl animate-pulse" />
      </div>
      
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 opacity-15">
        <div className="w-full h-full bg-gradient-to-tl from-pink-400 via-purple-300 to-indigo-400 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <style>{`
        @keyframes floatParticle {
          0% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-20px) translateX(10px) rotate(90deg);
          }
          50% {
            transform: translateY(-10px) translateX(-15px) rotate(180deg);
          }
          75% {
            transform: translateY(-30px) translateX(5px) rotate(270deg);
          }
          100% {
            transform: translateY(0px) translateX(0px) rotate(360deg);
          }
        }

        @keyframes floatOrb {
          0%, 100% {
            transform: translateY(0px) translateX(0px) scale(1);
            opacity: 0.05;
          }
          25% {
            transform: translateY(-30px) translateX(20px) scale(1.1);
            opacity: 0.1;
          }
          50% {
            transform: translateY(-15px) translateX(-25px) scale(0.9);
            opacity: 0.15;
          }
          75% {
            transform: translateY(-40px) translateX(10px) scale(1.05);
            opacity: 0.08;
          }
        }
      `}</style>
    </div>
  )
}

export default BackgroundEffects