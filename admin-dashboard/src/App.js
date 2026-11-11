import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProfileManager from './components/ProfileManager';
import BookingManager from './components/BookingManager';
import TransactionMethods from './components/TransactionMethods';
import { AuthProvider, useAuth } from './context/AuthContext';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' }
  }
});

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>}>
              <Route index element={<Navigate to="/profiles" replace />} />
              <Route path="profiles" element={<ProfileManager />} />
              <Route path="bookings" element={<BookingManager />} />
              <Route path="transactions" element={<TransactionMethods />} />
              {/* Backward compatibility aliases */}
              <Route path="users" element={<Navigate to="/profiles" replace />} />
              <Route path="travels" element={<Navigate to="/bookings" replace />} />
              <Route path="payment-methods" element={<Navigate to="/transactions" replace />} />
            </Route>
          </Routes>
        </Router>
        <ToastContainer position="top-right" autoClose={3000} />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
