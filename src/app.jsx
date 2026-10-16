import { useEffect, useState } from 'preact/hooks';
import { useHashPath, match, go } from './lib/router.js';
import { store } from './lib/db.js';
import { ToastHost, Loading } from './ui/kit.jsx';
import { Landing } from './screens/Landing.jsx';
import { Onboarding } from './screens/teacher/Onboarding.jsx';
import { TeacherHome } from './screens/teacher/Home.jsx';
import { ClassPage } from './screens/teacher/ClassPage.jsx';
import { NewAssignment } from './screens/teacher/NewAssignment.jsx';
import { StatusPage } from './screens/teacher/Status.jsx';
import { ArchivePage, ArchiveView } from './screens/teacher/Archive.jsx';
import { Join } from './screens/student/Join.jsx';
import { MyTasks } from './screens/student/MyTasks.jsx';
import { DoTask } from './screens/student/DoTask.jsx';

export function App() {
  const path = useHashPath();
  const [teacher, setTeacherState] = useState(undefined);
  const [student, setStudentState] = useState(undefined);

  useEffect(() => {
    Promise.all([store.get('teacher'), store.get('student')]).then(([t, s]) => {
      setTeacherState(t || null);
      setStudentState(s || null);
    });
  }, []);

  const setTeacher = async (t) => { await store.set('teacher', t); setTeacherState(t); };
  const setStudent = async (s) => {
    if (s) await store.set('student', s); else await store.del('student');
    setStudentState(s);
  };

  if (teacher === undefined || student === undefined) return <Loading />;

  const room = teacher?.classrooms?.find((c) => c.id === teacher.currentId) || teacher?.classrooms?.[0] || null;
  const tprops = { teacher, setTeacher, room };
  let m;
  let screen;

  if (path === '/' || path === '') screen = <Landing teacher={teacher} student={student} />;
  else if (path === '/t/start') screen = <Onboarding {...tprops} />;
  else if (path.startsWith('/t') && !room) { go('/t/start'); screen = <Loading />; }
  else if (path === '/t') screen = <TeacherHome {...tprops} />;
  else if (path === '/t/class') screen = <ClassPage {...tprops} />;
  else if ((m = match('/t/new/:strategy', path))) screen = <NewAssignment {...tprops} strategyId={m.strategy} />;
  else if ((m = match('/t/a/:id', path))) screen = <StatusPage {...tprops} id={m.id} />;
  else if (path === '/t/archive') screen = <ArchivePage {...tprops} />;
  else if ((m = match('/t/archive/:id', path))) screen = <ArchiveView {...tprops} id={m.id} />;
  else if ((m = match('/j/:code', path))) screen = <Join code={m.code} student={student} setStudent={setStudent} />;
  else if (path === '/join') screen = <Join student={student} setStudent={setStudent} />;
  else if (path === '/s') screen = student ? <MyTasks student={student} setStudent={setStudent} /> : (go('/join'), <Loading />);
  else if ((m = match('/s/a/:id', path))) screen = student ? <DoTask student={student} setStudent={setStudent} id={m.id} /> : (go('/join'), <Loading />);
  else screen = <Landing teacher={teacher} student={student} />;

  return <>{screen}<ToastHost /></>;
}
