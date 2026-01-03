-- 创建或替换更新点赞数的函数
CREATE OR REPLACE FUNCTION update_story_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果是插入操作（新增点赞）
  IF TG_OP = 'INSERT' THEN
    UPDATE stories 
    SET likes_count = (
      SELECT COUNT(*) 
      FROM likes 
      WHERE story_id = NEW.story_id
    )
    WHERE id = NEW.story_id;
    RETURN NEW;
  END IF;
  
  -- 如果是删除操作（取消点赞）
  IF TG_OP = 'DELETE' THEN
    UPDATE stories 
    SET likes_count = (
      SELECT COUNT(*) 
      FROM likes 
      WHERE story_id = OLD.story_id
    )
    WHERE id = OLD.story_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 删除现有触发器（如果存在）
DROP TRIGGER IF EXISTS trigger_update_story_likes_count ON likes;

-- 创建触发器
CREATE TRIGGER trigger_update_story_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_story_likes_count();

-- 初始化现有故事的点赞数
UPDATE stories 
SET likes_count = (
  SELECT COUNT(*) 
  FROM likes 
  WHERE likes.story_id = stories.id
);

-- 确保likes_count不为NULL
UPDATE stories 
SET likes_count = 0 
WHERE likes_count IS NULL;