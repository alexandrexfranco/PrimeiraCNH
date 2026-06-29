import { useAppStore } from '../store/AppContext';
import { InstructorDashboard } from './dashboards/InstructorDashboard';
import { StudentDashboard } from './dashboards/StudentDashboard';
import { AdminDashboard } from './dashboards/AdminDashboard';
import { Navigate } from 'react-router-dom';

export function Dashboard() {
  const { currentUser } = useAppStore();

  if (!currentUser) return <Navigate to="/login" replace />;

  switch (currentUser.role) {
    case 'INSTRUCTOR':
      return <InstructorDashboard />;
    case 'STUDENT':
      return <StudentDashboard />;
    case 'ADMIN':
      return <AdminDashboard />;
    default:
      return <div>Perfil não reconhecido.</div>;
  }
}
