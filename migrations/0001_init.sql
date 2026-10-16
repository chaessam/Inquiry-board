-- 서버에는 학생 이름을 저장하지 않습니다. 번호와 기기 표시만 둡니다.

CREATE TABLE classrooms (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,          -- 학생이 입력하는 교실 코드 (6자리)
  label TEXT NOT NULL,                -- 예: 3학년 2반
  size INTEGER NOT NULL,              -- 학생 수 (번호 1 ~ size)
  admin_hash TEXT NOT NULL UNIQUE,    -- 교실 관리 코드의 SHA-256 해시
  created_at INTEGER NOT NULL,
  last_used INTEGER NOT NULL
);

CREATE TABLE assignments (
  id TEXT PRIMARY KEY,
  classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  strategy TEXT NOT NULL,
  title TEXT NOT NULL,
  payload TEXT NOT NULL,              -- 교사가 준비한 활동지 (JSON)
  deadline INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,        -- 마감 + 14일
  created_at INTEGER NOT NULL
);
CREATE INDEX assignments_classroom ON assignments(classroom_id);
CREATE INDEX assignments_expires ON assignments(expires_at);

CREATE TABLE submissions (
  id TEXT PRIMARY KEY,
  assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  device_id TEXT NOT NULL,
  content TEXT NOT NULL,              -- 학생 답 (JSON)
  revisions INTEGER NOT NULL DEFAULT 0,
  submitted_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  UNIQUE (assignment_id, number, device_id)
);
CREATE INDEX submissions_assignment ON submissions(assignment_id);
CREATE INDEX submissions_expires ON submissions(expires_at);
