import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Platforms from './pages/Platforms';
import Users from './pages/Users';
import Login from './pages/Login';

function AppContent() {
  const { activeView, currentUser } = useApp();
  const views: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />,
    inventory: <Inventory />,
    sales: <Sales />,
    reports: <Reports />,
    platforms: <Platforms />,
    users: <Users />,
    login: <Login />,
  };

  if (currentUser.id === 'guest') {
    return <Login />;
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-auto">
          {views[activeView]}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
