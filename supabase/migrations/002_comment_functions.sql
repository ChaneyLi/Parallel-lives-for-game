-- 创建增加评论数的函数
CREATE OR REPLACE FUNCTION increment_comments_count(story_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE stories 
  SET comments_count = COALESCE(comments_count, 0) + 1
  WHERE id = story_id;
END;
$$ LANGUAGE plpgsql;

-- 创建减少评论数的函数
CREATE OR REPLACE FUNCTION decrement_comments_count(story_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE stories 
  SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0)
  WHERE id = story_id;
END;
$$ LANGUAGE plpgsql;

-- 确保stories表有comments_count字段
ALTER TABLE stories ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- 更新现有故事的评论数
UPDATE stories 
SET comments_count = (
  SELECT COUNT(*) 
  FROM comments 
  WHERE comments.story_id = stories.id
)
WHERE comments_count IS NULL OR comments_count = 0;