-- Parallel Lives 初始数据库架构
-- 创建用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建故事表
CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    summary TEXT NOT NULL,
    input_data JSONB NOT NULL,
    tone VARCHAR(20) NOT NULL CHECK (tone IN ('warm', 'funny', 'romantic', 'dark')),
    cover_image_url TEXT,
    likes_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建故事段落表
CREATE TABLE story_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    segment_order INTEGER NOT NULL,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建点赞表
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, story_id)
);

-- 创建评论表
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX idx_stories_likes_count ON stories(likes_count DESC);
CREATE INDEX idx_stories_is_public ON stories(is_public);

CREATE INDEX idx_story_segments_story_id ON story_segments(story_id);
CREATE INDEX idx_story_segments_order ON story_segments(story_id, segment_order);

CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_story_id ON likes(story_id);
CREATE INDEX idx_likes_created_at ON likes(created_at DESC);

CREATE INDEX idx_comments_story_id ON comments(story_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- 设置权限
GRANT SELECT ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;

GRANT SELECT ON stories TO anon;
GRANT ALL PRIVILEGES ON stories TO authenticated;

GRANT SELECT ON story_segments TO anon;
GRANT ALL PRIVILEGES ON story_segments TO authenticated;

GRANT SELECT ON likes TO anon;
GRANT ALL PRIVILEGES ON likes TO authenticated;

GRANT SELECT ON comments TO anon;
GRANT ALL PRIVILEGES ON comments TO authenticated;

-- 插入示例数据
INSERT INTO users (email, password_hash, nickname, plan) VALUES
('demo@parallelives.com', '$2b$10$example_hash', '示例用户', 'premium'),
('test@parallelives.com', '$2b$10$example_hash', '测试用户', 'free');

-- 插入示例故事
INSERT INTO stories (user_id, title, summary, input_data, tone, is_public) VALUES
((SELECT id FROM users WHERE email = 'demo@parallelives.com'), 
 '平行世界的艺术家之路', 
 '在这个平行世界里，你选择了艺术创作的道路，成为了一名备受瞩目的画家。', 
 '{"birthplace": "北京", "career": "艺术家", "personality": "创意", "relationship": "单身", "dream_regret": "成为知名画家"}', 
 'romantic', 
 true);