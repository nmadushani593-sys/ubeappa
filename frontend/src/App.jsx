import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Chat from './pages/Chat';
import Analytics from './pages/Analytics';
import CRM from './pages/CRM';
import Templates from './pages/Templates';
import PhoneNumbers from './pages/PhoneNumbers';
import Agents from './pages/Agents';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-[#111B21]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" /></div>;
  }
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><SocketProvider><Layout /></SocketProvider></PrivateRoute>}>
            <Route index element={<Navigate to="/chat" />} />
            <Route path="chat" element={<Chat />} />
            <Route path="chat/:id" element={<Chat />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="crm" element={<CRM />} />
            <Route path="templates" element={<Templates />} />
            <Route path="phone-numbers" element={<PhoneNumbers />} />
            <Route path="agents" element={<Agents />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
