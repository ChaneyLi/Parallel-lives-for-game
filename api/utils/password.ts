import bcrypt from 'bcryptjs'

/**
 * 哈希密码
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

/**
 * 验证密码
 */
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword)
}

/**
 * 验证密码强度
 */
export const validatePasswordStrength = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: '密码长度至少8位' }
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: '密码必须包含小写字母' }
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: '密码必须包含大写字母' }
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: '密码必须包含数字' }
  }
  
  return { isValid: true }
}