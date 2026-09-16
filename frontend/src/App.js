import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { store } from './store/store';
import MainLayout from './layout/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectList from './pages/ProjectList';
import SpringBoard from './pages/SpringBoard';
import TaskDetails from './pages/TaskDetails';
import TeamManagement from './pages/TeamManagement';
import AdminDashboard from './pages/AdminDashboard';
import Report from './pages/Report';
import './index.css';

function PrivateRoute({ children, roles }) {
  const { user } = useSelector((state) => state.auth);
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.some(r => user.roles?.includes(r))) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
            <Route index element={<SpringBoard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="projects" element={<ProjectList />} />
            <Route path="tasks/:id" element={<TaskDetails />} />
            <Route path="teams" element={<PrivateRoute roles={['ROLE_ADMIN','ROLE_MANAGER']}><TeamManagement /></PrivateRoute>} />
            <Route path="admin" element={<PrivateRoute roles={['ROLE_ADMIN']}><AdminDashboard /></PrivateRoute>} />
            <Route path="reports" element={<Report />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
