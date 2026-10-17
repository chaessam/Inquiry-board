import { useEffect, useState } from 'preact/hooks';
import { useHashPath, match, go } from './lib/router.js';
import { store } from './lib/db.js';
import { ToastHost, Loading } from './ui/kit.jsx';
import { Landing } from './screens/Landing.jsx';
import { Privacy, FooterLinks } from './screens/Privacy.jsx';
import { Onboarding } from './screens/teacher/Onboarding.jsx';
import { TeacherHome } from './screens/teacher/Home.jsx';
import { ClassPage } from './screens/teacher/ClassPage.jsx';
import { NewAssignment } from './screens/teacher/NewAssignment.jsx';
import { StatusPage } from './screens/teacher/Status.jsx';
import { ArchivePage, ArchiveView, ArchiveUnit } from './screens/teacher/Archive.jsx';
import { Toolbox } from './screens/teacher/Toolbox.jsx';
import { LiveBoard } from './screens/teacher/LiveBoard.jsx';
import { TaskList } from './screens/teacher/TaskList.jsx';
import { ConceptBank } from './screens/teacher/ConceptBank.jsx';
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

  // 주소 뒤 ?from=tools 같은 덧붙임은 화면에 따로 넘겨요
  const [base, qs = ''] = path.split('?');
  const query = new URLSearchParams(qs);

  if (base === '/' || base === '') screen = <Landing teacher={teacher} student={student} />;
  else if (base === '/privacy') screen = <Privacy />;
  else if (base === '/t/start') screen = <Onboarding {...tprops} />;
  else if (base.startsWith('/t') && !room) { go('/t/start'); screen = <Loading />; }
  else if (base === '/t') screen = <TeacherHome {...tprops} />;
  else if (base === '/t/tools') screen = <Toolbox {...tprops} />;
  else if ((m = match('/t/live/:id', base))) screen = <LiveBoard key={m.id} {...tprops} id={m.id} />;
  else if (base === '/t/class') screen = <ClassPage {...tprops} />;
  else if ((m = match('/t/new/:strategy', base))) screen = <NewAssignment key={m.strategy + '?' + qs} {...tprops} strategyId={m.strategy} query={query} />;
  else if (base === '/t/tasks') screen = <TaskList {...tprops} />;
  else if (base === '/t/concepts') screen = <ConceptBank {...tprops} />;
  else if ((m = match('/t/a/:id', base))) screen = <StatusPage key={m.id} {...tprops} id={m.id} view={query.get('view')} />;
  else if (base === '/t/archive') screen = <ArchivePage {...tprops} />;
  else if ((m = match('/t/archive/u/:unit', base))) screen = <ArchiveUnit {...tprops} unitId={m.unit} />;
  else if ((m = match('/t/archive/:id', base))) screen = <ArchiveView {...tprops} id={m.id} />;
  else if ((m = match('/j/:code', base))) screen = <Join code={m.code} student={student} setStudent={setStudent} />;
  else if (base === '/join') screen = <Join student={student} setStudent={setStudent} />;
  else if (base === '/s') screen = student ? <MyTasks student={student} setStudent={setStudent} /> : (go('/join'), <Loading />);
  else if ((m = match('/s/a/:id', base))) screen = student ? <DoTask student={student} setStudent={setStudent} id={m.id} /> : (go('/join'), <Loading />);
  else screen = <Landing teacher={teacher} student={student} />;

  return <>{screen}{base !== '/privacy' && !base.startsWith('/t/live/') && <FooterLinks />}<ToastHost /></>;
}
