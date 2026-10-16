-- 장난 요청을 막기 위한 횟수 기록.
-- 접속 주소(IP)는 그대로 저장하지 않고, 날마다 바뀌는 해시로만 남깁니다. 시간 창이 끝나면 지웁니다.
CREATE TABLE rate_limits (
  bucket TEXT PRIMARY KEY,
  hits INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);
CREATE INDEX rate_limits_reset ON rate_limits(reset_at);
