import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/Toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/admin/Teachers';
import Students from './pages/admin/Students';
import Rooms from './pages/admin/Rooms';
import Classes from './pages/admin/Classes';
import Specialites from './pages/admin/Specialites';
import Filieres from './pages/admin/Filieres';
import Cycles from './pages/admin/Cycles';
import UEs from './pages/admin/UEs';
import Matieres from './pages/admin/Matieres';
import Semestres from './pages/admin/Semestres';
import DFR from './pages/admin/DFR';
import Domaines from './pages/admin/Domaines';
import Attributions from './pages/admin/Attributions';
import Indisponibilites from './pages/admin/Indisponibilites';
import ScheduleManager from './pages/admin/ScheduleManager';
import Schedule from './pages/Schedule';
import DashboardLayout from './layouts/DashboardLayout';

// Composant pour protéger les routes
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/dashboard" element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }>
              <Route index element={<Dashboard />} />
              {/* D'autres routes seront ajoutées ici */}
              <Route path="schedule" element={<Schedule />} />
              <Route path="teachers" element={<Teachers />} />
              <Route path="students" element={<Students />} />
              <Route path="rooms" element={<Rooms />} />
              <Route path="classes" element={<Classes />} />
              <Route path="specialites" element={<Specialites />} />
              <Route path="filieres" element={<Filieres />} />
              <Route path="cycles" element={<Cycles />} />
              <Route path="ues" element={<UEs />} />
              <Route path="matieres" element={<Matieres />} />
              <Route path="semestres" element={<Semestres />} />
              <Route path="dfr" element={<DFR />} />
              <Route path="domaines" element={<Domaines />} />
              <Route path="attributions" element={<Attributions />} />
              <Route path="indisponibilites" element={<Indisponibilites />} />
              <Route path="schedule-manager" element={<ScheduleManager />} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
        <ToastContainer />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
