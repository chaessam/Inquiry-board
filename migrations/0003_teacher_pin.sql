-- 교사 로그인: 교실 코드 + 비밀번호 4자리
-- 비밀번호는 해시로만 저장하고, 틀린 횟수에 따라 교실 단위로 잠급니다.
ALTER TABLE classrooms ADD COLUMN pin_hash TEXT;
ALTER TABLE classrooms ADD COLUMN pin_fails INTEGER NOT NULL DEFAULT 0;
ALTER TABLE classrooms ADD COLUMN pin_locked_until INTEGER NOT NULL DEFAULT 0;

-- 비밀번호로 들어온 기기마다 따로 발급하는 기기 열쇠 (해시만 저장)
CREATE TABLE teacher_tokens (
  token_hash TEXT PRIMARY KEY,
  classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  last_used INTEGER NOT NULL
);
CREATE INDEX teacher_tokens_classroom ON teacher_tokens(classroom_id);
