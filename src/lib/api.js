// 서버 우편함과 주고받는 함수들

async function call(method, path, { body, key } = {}) {
  let res;
  try {
    res = await fetch('/api/' + path, {
      method,
      headers: {
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...(key ? { authorization: 'Bearer ' + key } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new Error('인터넷 연결을 확인해 주세요. 쓰던 내용은 이 기기에 저장되어 있어요.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || '잠시 뒤 다시 해 주세요.');
  return data;
}

export const api = {
  createClassroom: (label, size, pin) => call('POST', 'classrooms', { body: { label, size, pin } }),
  login: (name, pin) => call('POST', 'teacher/login', { body: { name, pin } }),
  changePin: (room, pin, signOutOthers = true) => call('PUT', `classrooms/${room.id}/pin`, { body: { pin, signOutOthers }, key: room.adminKey }),
  updateClassroom: (room, patch) => call('PATCH', `classrooms/${room.id}`, { body: patch, key: room.adminKey }),
  deleteClassroom: (room) => call('DELETE', `classrooms/${room.id}`, { key: room.adminKey }),
  listAssignments: (room) => call('GET', `classrooms/${room.id}/assignments`, { key: room.adminKey }),
  createAssignment: (room, a) => call('POST', `classrooms/${room.id}/assignments`, { body: a, key: room.adminKey }),
  getAssignment: (room, id, since = 0) => call('GET', `classrooms/${room.id}/assignments/${id}${since ? `?since=${since}` : ''}`, { key: room.adminKey }),
  getConcepts: (room) => call('GET', `classrooms/${room.id}/concepts`, { key: room.adminKey }),
  saveConcepts: (room, concepts) => call('PUT', `classrooms/${room.id}/concepts`, { body: { concepts }, key: room.adminKey }),
  extendAssignment: (room, id, deadline) => call('PATCH', `classrooms/${room.id}/assignments/${id}`, { body: { deadline }, key: room.adminKey }),
  deleteAssignment: (room, id) => call('DELETE', `classrooms/${room.id}/assignments/${id}`, { key: room.adminKey }),
  moveSubmission: (room, id, subId, number) => call('PATCH', `classrooms/${room.id}/assignments/${id}/submissions/${subId}`, { body: { number }, key: room.adminKey }),
  joinInfo: (code) => call('GET', `class/${encodeURIComponent(code)}`),
  studentAssignments: (code, number) => call('GET', `class/${encodeURIComponent(code)}/assignments?number=${number}`),
  submit: (code, id, body) => call('POST', `class/${encodeURIComponent(code)}/assignments/${id}/submit`, { body })
};
