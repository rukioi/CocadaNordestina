import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthService } from '@/lib/auth';
import Layout from '@/components/Layout';
import Login from '@/components/Login';
import Dashboard from '@/components/Dashboard';
import ProductManager from '@/components/ProductManager';
import CustomerManager from '@/components/CustomerManager';
import SalesManager from '@/components/SalesManager';
import ReportsManager from '@/components/ReportsManager';
import SettingsManager from '@/components/SettingsManager';
import './App.css';

// Componente de proteção de rotas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentUser = AuthService.getCurrentUser();
  return currentUser ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<ProductManager />} />
          <Route path="customers" element={<CustomerManager />} />
          <Route path="sales" element={<SalesManager />} />
          <Route path="reports" element={<ReportsManager />} />
          <Route path="settings" element={<SettingsManager />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;