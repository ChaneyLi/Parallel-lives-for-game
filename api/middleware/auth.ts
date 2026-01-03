import { Request, Response, NextFunction } from 'express'
import { verifyToken, extractTokenFromHeader, JWTPayload } from '../utils/jwt.js'

// 扩展Request接口以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
    }
  }
}

// 认证请求接口
export interface AuthenticatedRequest extends Request {
  user: JWTPayload
}

/**
 * 认证中间件
 * 验证JWT令牌并将用户信息添加到请求对象中
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = extractTokenFromHeader(req.headers.authorization)
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '访问令牌缺失'
    })
  }
  
  const payload = verifyToken(token)
  
  if (!payload) {
    return res.status(403).json({
      success: false,
      message: '无效的访问令牌'
    })
  }
  
  req.user = payload
  next()
}

/**
 * 可选认证中间件
 * 如果提供了令牌则验证，但不强制要求
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = extractTokenFromHeader(req.headers.authorization)
  
  if (token) {
    const payload = verifyToken(token)
    if (payload) {
      req.user = payload
    }
  }
  
  next()
}
