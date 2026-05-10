CREATE TABLE IF NOT EXISTS comments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id    UUID        NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
  user_id    TEXT        REFERENCES "user"(id) ON DELETE SET NULL,
  body       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
