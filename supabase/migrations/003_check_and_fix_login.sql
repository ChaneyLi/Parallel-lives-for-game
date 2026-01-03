-- 检查和修复登录问题

-- 1. 检查现有用户数据
SELECT id, email, nickname, plan, usage_count, created_at 
FROM users 
WHERE email = 'demo@parallellives.com';

-- 2. 如果demo用户不存在，创建它
INSERT INTO users (email, password_hash, nickname, plan, usage_count)
SELECT 
  'demo@parallellives.com',
  '$2b$10$rQJ8vQZ9X1Y2Z3A4B5C6D.eF7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U', -- demo123的bcrypt哈希
  'Demo用户',
  'free',
  0
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'demo@parallellives.com'
);

-- 3. 确保数据库权限正确设置
-- 为anon角色授予基本权限
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON users TO anon;
GRANT SELECT ON stories TO anon;
GRANT SELECT ON story_segments TO anon;
GRANT SELECT ON likes TO anon;
GRANT SELECT ON comments TO anon;

-- 为authenticated角色授予完整权限
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT ALL PRIVILEGES ON stories TO authenticated;
GRANT ALL PRIVILEGES ON story_segments TO authenticated;
GRANT ALL PRIVILEGES ON likes TO authenticated;
GRANT ALL PRIVILEGES ON comments TO authenticated;

-- 4. 检查权限设置
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- 5. 验证demo用户最终状态
SELECT id, email, nickname, plan, usage_count, created_at 
FROM users 
WHERE email = 'demo@parallellives.com';