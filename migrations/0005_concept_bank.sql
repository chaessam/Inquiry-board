-- 개념 은행: 교실마다 모아 두는 개념 단어 (수업이 바뀌어도 계속 쌓여요)
-- [{ w: 개념 단어, m: 뜻(선택), u: 단원 이름표(선택), at: 넣은 시각 }] 를 JSON으로 저장합니다.
-- 학생 '내 과제' 응답에 함께 실어 보내서, 요청 수는 늘지 않아요.
ALTER TABLE classrooms ADD COLUMN concepts TEXT NOT NULL DEFAULT '[]';
