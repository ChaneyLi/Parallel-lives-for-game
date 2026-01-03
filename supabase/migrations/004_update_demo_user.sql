-- 更新demo用户的正确密码哈希

-- 删除可能存在的旧demo用户
DELETE FROM users WHERE email = 'demo@parallellives.com';

-- 创建新的demo用户，使用正确的密码哈希
INSERT INTO users (email, password_hash, nickname, plan, usage_count)
VALUES (
  'demo@parallellives.com',
  '$2b$12$1y0XWzybk3.z/06F3iqnO.mSL75WCGulZQNCEOgJWE9PTD/Ket3oe', -- demo123的正确bcrypt哈希
  'Demo用户',
  'free',
  0
);

-- 验证用户创建成功
SELECT id, email, nickname, plan, usage_count, created_at 
FROM users 
WHERE email = 'demo@parallellives.com';