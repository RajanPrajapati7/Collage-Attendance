import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { LoadingState, ErrorState } from './components/ui';
import {
  StudentDashboard, StudentAttendance, StudentMarks, StudentAICoach,
  StudentAssignments, StudentFees, StudentTimetable, StudentLibrary,
  StudentEvents, StudentNotifications,
} from './pages/Student';
import {
  TeacherDashboard, TeacherAttendance, TeacherMarks, TeacherAssignments,
  TeacherReports, TeacherTimetable, TeacherNotifications,
} from './pages/Teacher';
import {
  AdminDashboard, AdminStudents, AdminTeachers, AdminFees,
  AdminReports, AdminLibrary, AdminEvents, AdminNotifications,
} from './pages/Admin';
import {
  ParentDashboard, ParentAttendance, ParentMarks, ParentFees,
  ParentAISummary, ParentNotifications,
} from './pages/Parent';

function AppContent() {
  const { role, loading, error, refresh } = useApp();
  const [page, setPage] = useState('dashboard');

  useEffect(() => {
    setPage('dashboard');
  }, [role]);

  if (loading) return <LoadingState message="Loading EduPilot AI…" />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  if (!role) return <Landing />;

  const renderPage = () => {
    switch (role) {
      case 'student':
        switch (page) {
          case 'dashboard': return <StudentDashboard onNavigate={setPage} />;
          case 'attendance': return <StudentAttendance />;
          case 'marks': return <StudentMarks />;
          case 'ai-coach': return <StudentAICoach />;
          case 'assignments': return <StudentAssignments />;
          case 'fees': return <StudentFees />;
          case 'timetable': return <StudentTimetable />;
          case 'library': return <StudentLibrary />;
          case 'events': return <StudentEvents />;
          case 'notifications': return <StudentNotifications />;
          default: return <StudentDashboard onNavigate={setPage} />;
        }
      case 'teacher':
        switch (page) {
          case 'dashboard': return <TeacherDashboard />;
          case 'attendance': return <TeacherAttendance />;
          case 'marks': return <TeacherMarks />;
          case 'assignments': return <TeacherAssignments />;
          case 'reports': return <TeacherReports />;
          case 'timetable': return <TeacherTimetable />;
          case 'notifications': return <TeacherNotifications />;
          default: return <TeacherDashboard />;
        }
      case 'admin':
        switch (page) {
          case 'dashboard': return <AdminDashboard />;
          case 'students': return <AdminStudents />;
          case 'teachers': return <AdminTeachers />;
          case 'fees': return <AdminFees />;
          case 'reports': return <AdminReports />;
          case 'library': return <AdminLibrary />;
          case 'events': return <AdminEvents />;
          case 'notifications': return <AdminNotifications />;
          default: return <AdminDashboard />;
        }
      case 'parent':
        switch (page) {
          case 'dashboard': return <ParentDashboard />;
          case 'attendance': return <ParentAttendance />;
          case 'marks': return <ParentMarks />;
          case 'fees': return <ParentFees />;
          case 'ai-summary': return <ParentAISummary />;
          case 'notifications': return <ParentNotifications />;
          default: return <ParentDashboard />;
        }
      default:
        return <Landing />;
    }
  };

  return (
    <Layout activePage={page} onNavigate={setPage}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
