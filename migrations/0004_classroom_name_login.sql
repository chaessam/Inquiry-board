-- 교사는 '교실 이름 + 비밀번호'로 들어옵니다. 그래서 교실 이름은 서로 겹치면 안 돼요.
-- name_key: 띄어쓰기를 빼고 소문자로 바꾼 이름 (예: '한빛초 3학년 2반' → '한빛초3학년2반')
ALTER TABLE classrooms ADD COLUMN name_key TEXT;
CREATE UNIQUE INDEX classrooms_name_key ON classrooms(name_key);
