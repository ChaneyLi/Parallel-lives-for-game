-- 修复数据库权限问题
-- 为anon和authenticated角色授予必要的权限

-- 授予anon角色对stories表的SELECT权限（用于查看公开故事）
GRANT SELECT ON stories TO anon;
GRANT SELECT ON story_segments TO anon;
GRANT SELECT ON users TO anon;

-- 授予authenticated角色对所有表的完整权限
GRANT ALL PRIVILEGES ON stories TO authenticated;
GRANT ALL PRIVILEGES ON story_segments TO authenticated;
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT ALL PRIVILEGES ON likes TO authenticated;
GRANT ALL PRIVILEGES ON comments TO authenticated;

-- 确保序列权限也正确设置
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 创建一些测试数据
INSERT INTO stories (id, user_id, title, summary, input_data, tone, is_public, likes_count, views_count) 
VALUES (
  gen_random_uuid(),
  (SELECT id FROM users LIMIT 1),
  '我的平行人生：成为一名作家',
  '在这个平行世界里，我选择了文学创作的道路，经历了从默默无闻到成名的起伏人生...',
  '{"birthplace": "北京", "career": "作家", "personality": "内向敏感", "relationship": "单身", "dream_regret": "想要写出传世之作", "tone": "warm"}',
  'warm',
  true,
  5,
  23
) ON CONFLICT DO NOTHING;

INSERT INTO stories (id, user_id, title, summary, input_data, tone, is_public, likes_count, views_count) 
VALUES (
  gen_random_uuid(),
  (SELECT id FROM users LIMIT 1),
  '另一种可能：科技创业者的人生',
  '如果我选择了科技创业的道路，会是怎样的人生轨迹？从车库里的小公司到改变世界的科技巨头...',
  '{"birthplace": "深圳", "career": "创业者", "personality": "外向冒险", "relationship": "已婚", "dream_regret": "想要改变世界", "tone": "funny"}',
  'funny',
  true,
  12,
  45
) ON CONFLICT DO NOTHING;

INSERT INTO stories (id, user_id, title, summary, input_data, tone, is_public, likes_count, views_count) 
VALUES (
  gen_random_uuid(),
  (SELECT id FROM users LIMIT 1),
  '浪漫的平行时空：音乐家的爱情故事',
  '在音乐的世界里，我遇到了生命中的那个人，我们一起创作，一起追梦，谱写了一段美丽的爱情乐章...',
  '{"birthplace": "维也纳", "career": "音乐家", "personality": "浪漫艺术", "relationship": "恋爱中", "dream_regret": "想要创作完美的交响乐", "tone": "romantic"}',
  'romantic',
  true,
  8,
  31
) ON CONFLICT DO NOTHING;