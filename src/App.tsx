import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppStore } from './store/AppContext';
import { MainLayout } from './components/MainLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ClassDetail } from './pages/ClassDetail';
import { ScheduleClass } from './pages/ScheduleClass';
import { RegisterUser } from './pages/RegisterUser';
import { StudentSignUp } from './pages/StudentSignUp';
import { ManageStudents } from './pages/ManageStudents';
import { ManageInstructors } from './pages/ManageInstructors';

import { InstructorReports } from './pages/InstructorReports';

import { PrintReport } from './pages/PrintReport';
import { LandingPage } from './pages/LandingPage';
import { TermsAndConditions } from './pages/TermsAndConditions';
import { Loader2 } from 'lucide-react';

function RootLoader({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAppStore();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <AppProvider>
      <RootLoader>
        <Router>
          <Routes>
            <Route path="/home" element={<LandingPage />} />
            <Route path="/termos" element={<TermsAndConditions />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<StudentSignUp />} />
            {/* Print Route without layout */}
            <Route path="/print-report/:studentId" element={<PrintReport />} />
            
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="class/:id" element={<ClassDetail />} />
              <Route path="schedule" element={<ScheduleClass />} />
              <Route path="schedule/:id" element={<ScheduleClass />} />
              <Route path="reports" element={<InstructorReports />} />
              <Route path="manage-instructors" element={<ManageInstructors />} />
              <Route path="manage-students" element={<ManageStudents />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Router>
      </RootLoader>
    </AppProvider>
  );
}
