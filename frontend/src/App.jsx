import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import { PropertySchemaProvider } from './context/PropertySchemaContext';
import Auth from './components/Auth';
import TaskTree from './components/TaskTree';
import ReportsView from './components/ReportsView';
import './App.css';

function AppContent() {
  const { user, logout, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState('tasks');

  if (!isAuthenticated) {
    return <Auth />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>GTD Task Manager</h1>
          <nav className="app-nav">
            <button
              className={`nav-btn ${currentView === 'tasks' ? 'active' : ''}`}
              onClick={() => setCurrentView('tasks')}
            >
              Tasks
            </button>
            <button
              className={`nav-btn ${currentView === 'reports' ? 'active' : ''}`}
              onClick={() => setCurrentView('reports')}
            >
              Reports
            </button>
          </nav>
          <div className="user-info">
            <span>Welcome, {user.username}!</span>
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <PropertySchemaProvider>
          <TaskProvider userId={user.id}>
            {currentView === 'tasks' ? <TaskTree /> : <ReportsView />}
          </TaskProvider>
        </PropertySchemaProvider>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
